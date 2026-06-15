// api/analyze.js - Vercel serverless function (Gemini)
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const { imageBase64, mediaType, existingExpenses } = req.body;

    if (!imageBase64 || !mediaType) {
      return res.status(400).json({ error: "Image data and media type are required" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using gemini-2.5-flash-lite-lite for better stability and feature support
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Step 1: Extract receipt data via Gemini Vision
    const extractionResult = await model.generateContent([
      {
        inlineData: {
          mimeType: mediaType,
          data: imageBase64,
        },
      },
      `Analyze this receipt image and extract the following information. Respond ONLY with a valid JSON object, no markdown, no explanation:
{
  "merchant": "store/restaurant name",
  "date": "YYYY-MM-DD or null if not visible",
  "total": numeric_amount_only,
  "currency": "currency code like USD, EUR, SEK etc",
  "category": "one of: Food & Dining, Groceries, Transportation, Shopping, Entertainment, Health & Fitness, Utilities, Housing, Travel, Education, Other",
  "items": [
    {"name": "item name", "amount": numeric_price}
  ],
  "confidence": "high/medium/low"
}

If you cannot read the receipt clearly, set confidence to "low" and fill what you can. Total must be a number, not a string.`,
    ]);

    let receiptData;
    try {
      const rawText = extractionResult.response.text();
      const clean = rawText.replace(/```json|```/g, "").trim();
      receiptData = JSON.parse(clean);
    } catch (parseError) {
      return res.status(422).json({ error: "Could not parse receipt data. Please try a clearer image." });
    }

    // Step 2: Quick insight if we have existing expenses
    let insights = null;
    if (existingExpenses && existingExpenses.length > 0) {
      insights = await generateInsights(model, [...existingExpenses, receiptData]);
    }

    return res.status(200).json({ success: true, receipt: receiptData, insights });
  } catch (error) {
    console.error("Analysis error:", error);
    return res.status(500).json({ error: "Failed to analyze receipt. Please try again." });
  }
}

async function generateInsights(model, expenses) {
  const totalByCategory = expenses.reduce((acc, exp) => {
    const cat = exp.category || "Other";
    acc[cat] = (acc[cat] || 0) + (parseFloat(exp.total) || 0);
    return acc;
  }, {});

  const grandTotal = Object.values(totalByCategory).reduce((a, b) => a + b, 0);

  const result = await model.generateContent(
    `You are a personal finance advisor. Based on this spending data, provide actionable insights.

Spending by category:
${Object.entries(totalByCategory)
      .map(([cat, amount]) => `- ${cat}: ${amount.toFixed(2)} (${((amount / grandTotal) * 100).toFixed(1)}%)`)
      .join("\n")}

Total tracked: ${grandTotal.toFixed(2)}
Number of receipts: ${expenses.length}

Respond ONLY with a valid JSON object, no markdown:
{
  "topCategory": "category with most spending",
  "topCategoryPercent": number,
  "tips": ["tip 1", "tip 2", "tip 3"],
  "savingOpportunity": "one specific saving suggestion",
  "budgetSuggestion": "brief monthly budget advice"
}`
  );

  try {
    const raw = result.response.text();
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}
