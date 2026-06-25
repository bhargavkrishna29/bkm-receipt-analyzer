// app/api/analyze/route.ts — Receipt OCR via Gemini AI
import { NextRequest, NextResponse } from 'next/server';
import { getModel, parseGeminiJSON, auditLog } from '@/lib/gemini';
import { checkRateLimit, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimit';
import type { GeminiReceiptData, QuickInsights } from '@/types';

export async function POST(req: NextRequest) {
  // ── Rate limiting ───────────────────────────────────────────────────────
  const limit = checkRateLimit(req);
  const rateLimitHeaders = {
    'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
    'X-RateLimit-Remaining': String(limit.remaining),
    'X-RateLimit-Window': `${RATE_LIMIT_WINDOW_MS / 1000}s`,
  };

  if (!limit.allowed) {
    auditLog(req, 'RATE_LIMIT_EXCEEDED', { ip: limit.ip, retryAfterSeconds: limit.retryAfter });
    return NextResponse.json(
      {
        success: false,
        error: `Rate limit exceeded. You can make ${RATE_LIMIT_MAX} requests per hour. Try again in ${Math.ceil((limit.retryAfter ?? 0) / 60)} minute(s).`,
      },
      {
        status: 429,
        headers: { ...rateLimitHeaders, 'Retry-After': String(limit.retryAfter ?? 60) },
      }
    );
  }

  try {
    const body = await req.json() as {
      imageBase64?: string;
      mediaType?: string;
      existingExpenses?: GeminiReceiptData[];
    };

    auditLog(req, 'RECEIPT_ANALYZE_REQUEST', {
      mediaType: body.mediaType,
      hasExistingExpenses: !!(body.existingExpenses?.length),
    });

    const { imageBase64, mediaType, existingExpenses } = body;

    if (!imageBase64) throw new Error('No image data received');
    if (!mediaType) throw new Error('No media type received');

    const model = getModel();

    // ── Gemini OCR ──────────────────────────────────────────────────────────
    const extractionResult = await model.generateContent([
      { inlineData: { mimeType: mediaType, data: imageBase64 } },
      `You are a receipt OCR expert. Read EVERY line item from this receipt carefully.

Respond ONLY with a valid JSON object, no markdown, no explanation:
{
  "merchant": "store or restaurant name",
  "date": "YYYY-MM-DD or null",
  "total": numeric_total_amount,
  "currency": "SEK or USD or EUR etc",
  "receiptCategory": "one of: Groceries, Food & Dining, Transportation, Shopping, Entertainment, Health & Fitness, Utilities, Housing, Travel, Education, Other",
  "items": [
    {
      "name": "exact item name from receipt",
      "amount": numeric_price,
      "quantity": numeric_quantity_or_1,
      "unitPrice": numeric_unit_price_or_same_as_amount,
      "itemCategory": "one of: Produce, Dairy, Meat & Fish, Bakery, Beverages, Snacks & Sweets, Frozen, Household, Personal Care, Clothing, Electronics, Medicine, Transport, Entertainment, Dining, Other"
    }
  ],
  "taxAmount": numeric_tax_or_0,
  "discountAmount": numeric_discount_or_0,
  "confidence": "high/medium/low"
}

Rules:
- Extract EVERY single item, do not skip any
- All amounts must be numbers not strings
- If quantity shown (e.g. 3st*15.90), set quantity=3, unitPrice=15.90, amount=47.70
- itemCategory must match the product type precisely`,
    ]);

    const rawText = extractionResult.response.text();
    console.log('Gemini raw response:', rawText.slice(0, 300));
    const receiptData = parseGeminiJSON<GeminiReceiptData>(rawText);

    // ── Quick insight (non-fatal) ─────────────────────────────────────────────
    let insights: QuickInsights | null = null;
    if (existingExpenses && existingExpenses.length > 0) {
      try {
        const allExpenses = [...existingExpenses, receiptData];
        const byItemCat: Record<string, number> = {};
        const topItems: Array<{ name: string; amount: number }> = [];

        for (const exp of allExpenses) {
          for (const item of exp.items ?? []) {
            const iCat = item.itemCategory ?? 'Other';
            byItemCat[iCat] = (byItemCat[iCat] ?? 0) + (Number(item.amount) || 0);
            topItems.push({ name: item.name, amount: item.amount });
          }
        }

        const grandTotal = allExpenses.reduce((s, e) => s + (Number(e.total) || 0), 0);
        const top5 = topItems.sort((a, b) => b.amount - a.amount).slice(0, 5);

        const insightResult = await model.generateContent(
          `Finance advisor. Respond ONLY with JSON, no markdown:
Item categories spend: ${JSON.stringify(byItemCat)}
Top items by price: ${JSON.stringify(top5)}
Total: ${grandTotal}
JSON: {"topCategory":"...","topCategoryPercent":0,"savingOpportunity":"specific saving tip based on actual items purchased","budgetSuggestion":"..."}`
        );
        insights = parseGeminiJSON<QuickInsights>(insightResult.response.text());
      } catch (e) {
        console.warn('Quick insight failed (non-fatal):', (e as Error).message);
      }
    }

    auditLog(req, 'RECEIPT_ANALYZE_SUCCESS', {
      merchant: receiptData.merchant,
      total: receiptData.total,
      currency: receiptData.currency,
      confidence: receiptData.confidence,
    });

    return NextResponse.json(
      { success: true, receipt: receiptData, insights },
      { headers: rateLimitHeaders }
    );
  } catch (err) {
    const message = (err as Error).message;
    auditLog(req, 'REQUEST_ERROR', { path: '/api/analyze', error: message });
    console.error('❌ POST /api/analyze error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
