// api/insights.js - Vercel serverless function
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

    const { expenses, monthlyBudget } = req.body;

    if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ success: false, error: "No expenses provided" });
    }

    const byReceiptCat = {};
    const byItemCat = {};
    const itemFrequency = {};
    const allItems = [];

    for (const exp of expenses) {
      const cat = exp.receiptCategory || exp.category || "Other";
      byReceiptCat[cat] = (byReceiptCat[cat] || 0) + (parseFloat(exp.total) || 0);
      for (const item of exp.items || []) {
        const iCat = item.itemCategory || "Other";
        const amt = parseFloat(item.amount) || 0;
        byItemCat[iCat] = (byItemCat[iCat] || 0) + amt;
        const key = item.name.toLowerCase().trim();
        if (!itemFrequency[key]) itemFrequency[key] = { name: item.name, count: 0, total: 0, category: iCat };
        itemFrequency[key].count += item.quantity || 1;
        itemFrequency[key].total += amt;
        allItems.push({ name: item.name, amount: amt, category: iCat, merchant: exp.merchant });
      }
    }

    const grandTotal = Object.values(byReceiptCat).reduce((a, b) => a + b, 0);
    const sortedReceiptCats = Object.entries(byReceiptCat).sort((a, b) => b[1] - a[1]);
    const sortedItemCats = Object.entries(byItemCat).sort((a, b) => b[1] - a[1]);
    const topItems = allItems.sort((a, b) => b.amount - a.amount).slice(0, 10);
    const mostFrequent = Object.values(itemFrequency).sort((a, b) => b.count - a.count).slice(0, 5);

    const prompt = `Personal finance coach. Deep item-level analysis. Respond ONLY with a JSON object, no markdown, no explanation.
Receipt categories: ${JSON.stringify(sortedReceiptCats)}
Item categories: ${JSON.stringify(sortedItemCats)}
Top spend items: ${JSON.stringify(topItems)}
Most frequent: ${JSON.stringify(mostFrequent)}
Total: ${grandTotal}
${monthlyBudget ? `Monthly budget: ${monthlyBudget}` : ""}
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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const analysis = parseGeminiJSON(result.response.text());

    return res.status(200).json({
      success: true,
      analysis,
      totals: { grandTotal, byReceiptCat, byItemCat, sortedReceiptCats, sortedItemCats, topItems, mostFrequent }
    });
  } catch (err) {
    console.error("insights error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}