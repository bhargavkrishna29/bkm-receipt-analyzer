// app/api/insights/route.ts — Full spending analysis via Gemini AI
import { NextRequest, NextResponse } from 'next/server';
import { getModel, parseGeminiJSON, auditLog } from '@/lib/gemini';
import { checkRateLimit, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimit';
import type { GeminiReceiptData, SpendingAnalysis, InsightsTotals } from '@/types';

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
      expenses?: GeminiReceiptData[];
      monthlyBudget?: number | null;
    };

    const { expenses, monthlyBudget } = body;
    if (!expenses || expenses.length === 0) throw new Error('No expenses provided');

    auditLog(req, 'INSIGHTS_REQUEST', { expenseCount: expenses.length, hasBudget: !!monthlyBudget });

    // ── Aggregate ──────────────────────────────────────────────────────────
    const byReceiptCat: Record<string, number> = {};
    const byItemCat: Record<string, number> = {};
    const itemFrequency: Record<string, { name: string; count: number; total: number; category: string }> = {};
    const allItems: Array<{ name: string; amount: number; category: string; merchant: string }> = [];

    for (const exp of expenses) {
      const cat = (exp as unknown as Record<string, string>).receiptCategory ?? (exp as unknown as Record<string, string>).category ?? 'Other';
      byReceiptCat[cat] = (byReceiptCat[cat] ?? 0) + (Number(exp.total) || 0);

      for (const item of exp.items ?? []) {
        const iCat = item.itemCategory ?? 'Other';
        const amt = Number(item.amount) || 0;
        byItemCat[iCat] = (byItemCat[iCat] ?? 0) + amt;

        const key = item.name.toLowerCase().trim();
        if (!itemFrequency[key]) {
          itemFrequency[key] = { name: item.name, count: 0, total: 0, category: iCat };
        }
        itemFrequency[key].count += item.quantity || 1;
        itemFrequency[key].total += amt;
        allItems.push({ name: item.name, amount: amt, category: iCat, merchant: exp.merchant });
      }
    }

    const grandTotal = Object.values(byReceiptCat).reduce((a, b) => a + b, 0);
    const sortedReceiptCats = Object.entries(byReceiptCat).sort((a, b) => b[1] - a[1]);
    const sortedItemCats = Object.entries(byItemCat).sort((a, b) => b[1] - a[1]);
    const topItems = [...allItems].sort((a, b) => b.amount - a.amount).slice(0, 10);
    const mostFrequent = Object.values(itemFrequency).sort((a, b) => b.count - a.count).slice(0, 5);

    const prompt = `Personal finance coach. Deep item-level analysis. Respond ONLY with a JSON object, no markdown, no explanation.
Receipt categories: ${JSON.stringify(sortedReceiptCats)}
Item categories: ${JSON.stringify(sortedItemCats)}
Top spend items: ${JSON.stringify(topItems)}
Most frequent: ${JSON.stringify(mostFrequent)}
Total: ${grandTotal}
${monthlyBudget ? `Monthly budget: ${monthlyBudget}` : ''}
Receipts: ${expenses.length}

JSON:
{
  "summary": "2-3 sentences mentioning specific items and patterns",
  "receiptCategoryBreakdown": [{"category":"...","amount":0,"percent":0,"status":"high/normal/low","tip":"..."}],
  "itemCategoryBreakdown": [{"category":"...","amount":0,"percent":0,"insight":"..."}],
  "topSpendItems": [{"name":"...","amount":0,"isEssential":true,"alternative":null}],
  "frequentItems": [{"name":"...","frequency":0,"totalSpend":0,"suggestion":null}],
  "unnecessarySpend": 0,
  "essentialSpend": 0,
  "savingPlan": ["action 1 mentioning real items", "action 2", "action 3"],
  "budgetAllocation": {"Needs (50%)": 0, "Wants (30%)": 0, "Savings (20%)": 0},
  "weeklyTarget": 0,
  "score": 0,
  "topInsight": "single most important observation"
}`;

    const model = getModel();
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    console.log('Insights raw response:', rawText.slice(0, 300));
    const analysis = parseGeminiJSON<SpendingAnalysis>(rawText);

    auditLog(req, 'INSIGHTS_SUCCESS', { expenseCount: expenses.length, grandTotal });

    const totals: InsightsTotals = {
      grandTotal,
      byReceiptCat,
      byItemCat,
      sortedReceiptCats,
      sortedItemCats,
      topItems,
      mostFrequent,
    };

    return NextResponse.json(
      { success: true, analysis, totals },
      { headers: rateLimitHeaders }
    );
  } catch (err) {
    const message = (err as Error).message;
    auditLog(req, 'REQUEST_ERROR', { path: '/api/insights', error: message });
    console.error('❌ POST /api/insights error:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: rateLimitHeaders }
    );
  }
}
