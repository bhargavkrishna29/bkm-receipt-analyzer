// api/server.js — Local dev server (not used in Vercel production)
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
}

async function handleAnalyze(body) {
  const { imageBase64, mediaType, existingExpenses } = body;
  if (!imageBase64 || !mediaType) throw new Error("Image data and media type are required");

  const model = getModel();

  const extractionResult = await model.generateContent([
    { inlineData: { mimeType: mediaType, data: imageBase64 } },
    `Analyze this receipt image and extract the following information. Respond ONLY with a valid JSON object, no markdown, no explanation:
{
  "merchant": "store/restaurant name",
  "date": "YYYY-MM-DD or null if not visible",
  "total": numeric_amount_only,
  "currency": "currency code like USD, EUR, SEK etc",
  "category": "one of: Food & Dining, Groceries, Transportation, Shopping, Entertainment, Health & Fitness, Utilities, Housing, Travel, Education, Other",
  "items": [{"name": "item name", "amount": numeric_price}],
  "confidence": "high/medium/low"
}
Total must be a number, not a string.`,
  ]);

  let receiptData;
  try {
    const rawText = extractionResult.response.text();
    console.log("[EXTRACT] Raw response:", rawText.substring(0, 200));
    receiptData = JSON.parse(rawText.replace(/```json|```/g, "").trim());
  } catch (parseError) {
    console.error("[EXTRACT] Parse error:", parseError.message, "Response:", rawText?.substring(0, 300));
    throw new Error(`Failed to parse receipt: ${parseError.message}`);
  }

  let insights = null;
  if (existingExpenses && existingExpenses.length > 0) {
    const allExpenses = [...existingExpenses, receiptData];
    const totalByCategory = allExpenses.reduce((acc, exp) => {
      const cat = exp.category || "Other";
      acc[cat] = (acc[cat] || 0) + (parseFloat(exp.total) || 0);
      return acc;
    }, {});
    const grandTotal = Object.values(totalByCategory).reduce((a, b) => a + b, 0);

    const insightResult = await model.generateContent(
      `Spending: ${JSON.stringify(totalByCategory)}. Total: ${grandTotal}. Respond ONLY with JSON:
{"topCategory":"...","topCategoryPercent":0,"tips":[],"savingOpportunity":"...","budgetSuggestion":"..."}`
    );
    try {
      const raw = insightResult.response.text();
      console.log("[INSIGHTS] Raw response:", raw.substring(0, 200));
      insights = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch (err) {
      console.error("[INSIGHTS] Parse error:", err.message, "Response:", raw?.substring(0, 300));
      insights = null;
    }
  }

  return { success: true, receipt: receiptData, insights };
}

async function handleInsights(body) {
  const { expenses, monthlyBudget } = body;
  if (!expenses || !expenses.length) throw new Error("No expenses provided");

  const model = getModel();

  const totalByCategory = expenses.reduce((acc, exp) => {
    const cat = exp.category || "Other";
    acc[cat] = (acc[cat] || 0) + (parseFloat(exp.total) || 0);
    return acc;
  }, {});
  const grandTotal = Object.values(totalByCategory).reduce((a, b) => a + b, 0);
  const sortedCategories = Object.entries(totalByCategory).sort((a, b) => b[1] - a[1]);

  const prompt = `You are a personal finance coach. Respond ONLY with JSON (no markdown):
Spending: ${JSON.stringify(totalByCategory)}
Total: ${grandTotal}
${monthlyBudget ? `Budget: ${monthlyBudget}` : ""}
Receipts: ${expenses.length}

JSON format:
{"summary":"...","categoryBreakdown":[{"category":"...","amount":0,"percent":0,"status":"high/normal/low","tip":"..."}],"topInsight":"...","savingPotential":0,"savingPlan":["..."],"budgetAllocation":{"Needs (50%)":0,"Wants (30%)":0,"Savings (20%)":0},"weeklyTarget":0,"score":0}`;

  const result = await model.generateContent(prompt);
  const analysis = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
  return { success: true, analysis, totals: { grandTotal, totalByCategory, sortedCategories } };
}

// ===== HTTP Server =====
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

  if (url.pathname === "/api/analyze" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", async () => {
      try {
        const result = await handleAnalyze(JSON.parse(body));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (url.pathname === "/api/insights" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", async () => {
      try {
        const result = await handleInsights(JSON.parse(body));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static files
  let filePath = url.pathname === "/" ? "/public/index.html" : `/public${url.pathname}`;
  filePath = path.join(__dirname, "..", filePath);

  const ext = path.extname(filePath);
  const mimeMap = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".png": "image/png", ".jpg": "image/jpeg" };

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": mimeMap[ext] || "text/plain" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ Spendwise running at http://localhost:${PORT}`);
  console.log(`   Make sure GEMINI_API_KEY is set in your .env\n`);
});
