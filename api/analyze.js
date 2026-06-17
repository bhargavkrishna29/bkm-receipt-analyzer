// api/analyze.js - Vercel serverless function
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

function parseGeminiJSON(text) {
  const clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in response");
  return JSON.parse(clean.slice(start, end + 1));
}

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

    const { imageBase64, mediaType, existingExpenses } = req.body;

    if (!imageBase64) return res.status(400).json({ success: false, error: "No image data" });
    if (!mediaType) return res.status(400).json({ success: false, error: "No media type" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

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
}`
    ]);

    const receiptData = parseGeminiJSON(extractionResult.response.text());

    let insights = null;
    if (existingExpenses && existingExpenses.length > 0) {
      try {
        const allExpenses = [...existingExpenses, receiptData];
        const byItemCat = {};
        const topItems = [];
        for (const exp of allExpenses) {
          for (const item of exp.items || []) {
            const iCat = item.itemCategory || "Other";
            byItemCat[iCat] = (byItemCat[iCat] || 0) + (parseFloat(item.amount) || 0);
            topItems.push({ name: item.name, amount: item.amount });
          }
        }
        const grandTotal = allExpenses.reduce((s, e) => s + (parseFloat(e.total) || 0), 0);
        const top5 = topItems.sort((a, b) => b.amount - a.amount).slice(0, 5);

        const insightResult = await model.generateContent(
          `Finance advisor. Respond ONLY with JSON, no markdown:
Item categories: ${JSON.stringify(byItemCat)}
Top items: ${JSON.stringify(top5)}
Total: ${grandTotal}
JSON: {"topCategory":"...","topCategoryPercent":0,"savingOpportunity":"specific tip based on actual items","budgetSuggestion":"..."}`
        );
        insights = parseGeminiJSON(insightResult.response.text());
      } catch (e) {
        console.warn("Quick insight failed:", e.message);
      }
    }

    return res.status(200).json({ success: true, receipt: receiptData, insights });
  } catch (err) {
    console.error("analyze error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}