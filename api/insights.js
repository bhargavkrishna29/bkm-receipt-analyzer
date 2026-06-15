// api/insights.js - Vercel serverless function (Gemini)
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { expenses, monthlyBudget } = req.body;

    if (!expenses || expenses.length === 0) {
      return res.status(400).json({ error: "No expenses provided" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const totalByCategory = expenses.reduce((acc, exp) => {
      const cat = exp.category || "Other";
      acc[cat] = (acc[cat] || 0) + (parseFloat(exp.total) || 0);
      return acc;
    }, {});

    const grandTotal = Object.values(totalByCategory).reduce((a, b) => a + b, 0);
    const sortedCategories = Object.entries(totalByCategory).sort((a, b) => b[1] - a[1]);

    const prompt = `You are a smart personal finance coach. Analyze this month's spending and give detailed, actionable advice.

SPENDING BREAKDOWN:
${sortedCategories.map(([cat, amt]) => `- ${cat}: ${amt.toFixed(2)} (${((amt / grandTotal) * 100).toFixed(1)}%)`).join("\n")}

Total spent: ${grandTotal.toFixed(2)}
${monthlyBudget ? `Monthly budget: ${monthlyBudget}` : "No budget set"}
Number of transactions: ${expenses.length}

Respond ONLY with valid JSON, no markdown or extra text:
{
  "summary": "2-3 sentence overview of spending habits",
  "categoryBreakdown": [
    {
      "category": "name",
      "amount": number,
      "percent": number,
      "status": "high/normal/low",
      "tip": "specific actionable tip for this category"
    }
  ],
  "topInsight": "single most important observation",
  "savingPotential": number,
  "savingPlan": ["action 1", "action 2", "action 3"],
  "budgetAllocation": {
    "Needs (50%)": number,
    "Wants (30%)": number,
    "Savings (20%)": number
  },
  "weeklyTarget": number,
  "score": number
}

For budgetAllocation, use the 50/30/20 rule based on the total. Score is 1-100 based on how well they manage their money.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const analysis = JSON.parse(raw.replace(/```json|```/g, "").trim());

    return res.status(200).json({ success: true, analysis, totals: { grandTotal, totalByCategory, sortedCategories } });
  } catch (error) {
    console.error("Insights error:", error);
    return res.status(500).json({ error: "Failed to generate insights" });
  }
}
