// // api/server.js — Local dev server (not used in Vercel production)
// import http from "http";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const PORT = process.env.PORT || 3000;

// function getModel() {
//   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//   return genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
// }

// async function handleAnalyze(body) {
//   const { imageBase64, mediaType, existingExpenses } = body;
//   if (!imageBase64 || !mediaType) throw new Error("Image data and media type are required");

//   const model = getModel();

//   const extractionResult = await model.generateContent([
//     { inlineData: { mimeType: mediaType, data: imageBase64 } },
//     `Analyze this receipt image and extract the following information. Respond ONLY with a valid JSON object, no markdown, no explanation:
// {
//   "merchant": "store/restaurant name",
//   "date": "YYYY-MM-DD or null if not visible",
//   "total": numeric_amount_only,
//   "currency": "currency code like USD, EUR, SEK etc",
//   "category": "one of: Food & Dining, Groceries, Transportation, Shopping, Entertainment, Health & Fitness, Utilities, Housing, Travel, Education, Other",
//   "items": [{"name": "item name", "amount": numeric_price}],
//   "confidence": "high/medium/low"
// }
// Total must be a number, not a string.`,
//   ]);

//   let receiptData;
//   try {
//     const rawText = extractionResult.response.text();
//     console.log("[EXTRACT] Raw response:", rawText.substring(0, 200));
//     receiptData = JSON.parse(rawText.replace(/```json|```/g, "").trim());
//   } catch (parseError) {
//     console.error("[EXTRACT] Parse error:", parseError.message, "Response:", rawText?.substring(0, 300));
//     throw new Error(`Failed to parse receipt: ${parseError.message}`);
//   }

//   let insights = null;
//   if (existingExpenses && existingExpenses.length > 0) {
//     const allExpenses = [...existingExpenses, receiptData];
//     const totalByCategory = allExpenses.reduce((acc, exp) => {
//       const cat = exp.category || "Other";
//       acc[cat] = (acc[cat] || 0) + (parseFloat(exp.total) || 0);
//       return acc;
//     }, {});
//     const grandTotal = Object.values(totalByCategory).reduce((a, b) => a + b, 0);

//     const insightResult = await model.generateContent(
//       `Spending: ${JSON.stringify(totalByCategory)}. Total: ${grandTotal}. Respond ONLY with JSON:
// {"topCategory":"...","topCategoryPercent":0,"tips":[],"savingOpportunity":"...","budgetSuggestion":"..."}`
//     );
//     try {
//       const raw = insightResult.response.text();
//       console.log("[INSIGHTS] Raw response:", raw.substring(0, 200));
//       insights = JSON.parse(raw.replace(/```json|```/g, "").trim());
//     } catch (err) {
//       console.error("[INSIGHTS] Parse error:", err.message, "Response:", raw?.substring(0, 300));
//       insights = null;
//     }
//   }

//   return { success: true, receipt: receiptData, insights };
// }

// async function handleInsights(body) {
//   const { expenses, monthlyBudget } = body;
//   if (!expenses || !expenses.length) throw new Error("No expenses provided");

//   const model = getModel();

//   const totalByCategory = expenses.reduce((acc, exp) => {
//     const cat = exp.category || "Other";
//     acc[cat] = (acc[cat] || 0) + (parseFloat(exp.total) || 0);
//     return acc;
//   }, {});
//   const grandTotal = Object.values(totalByCategory).reduce((a, b) => a + b, 0);
//   const sortedCategories = Object.entries(totalByCategory).sort((a, b) => b[1] - a[1]);

//   const prompt = `You are a personal finance coach. Respond ONLY with JSON (no markdown):
// Spending: ${JSON.stringify(totalByCategory)}
// Total: ${grandTotal}
// ${monthlyBudget ? `Budget: ${monthlyBudget}` : ""}
// Receipts: ${expenses.length}

// JSON format:
// {"summary":"...","categoryBreakdown":[{"category":"...","amount":0,"percent":0,"status":"high/normal/low","tip":"..."}],"topInsight":"...","savingPotential":0,"savingPlan":["..."],"budgetAllocation":{"Needs (50%)":0,"Wants (30%)":0,"Savings (20%)":0},"weeklyTarget":0,"score":0}`;

//   const result = await model.generateContent(prompt);
//   const analysis = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
//   return { success: true, analysis, totals: { grandTotal, totalByCategory, sortedCategories } };
// }

// // ===== HTTP Server =====
// const server = http.createServer(async (req, res) => {
//   const url = new URL(req.url, `http://localhost:${PORT}`);

//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type");
//   if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

//   if (url.pathname === "/api/analyze" && req.method === "POST") {
//     let body = "";
//     req.on("data", (d) => (body += d));
//     req.on("end", async () => {
//       try {
//         const result = await handleAnalyze(JSON.parse(body));
//         res.writeHead(200, { "Content-Type": "application/json" });
//         res.end(JSON.stringify(result));
//       } catch (err) {
//         console.error(err);
//         res.writeHead(500, { "Content-Type": "application/json" });
//         res.end(JSON.stringify({ error: err.message }));
//       }
//     });
//     return;
//   }

//   if (url.pathname === "/api/insights" && req.method === "POST") {
//     let body = "";
//     req.on("data", (d) => (body += d));
//     req.on("end", async () => {
//       try {
//         const result = await handleInsights(JSON.parse(body));
//         res.writeHead(200, { "Content-Type": "application/json" });
//         res.end(JSON.stringify(result));
//       } catch (err) {
//         console.error(err);
//         res.writeHead(500, { "Content-Type": "application/json" });
//         res.end(JSON.stringify({ error: err.message }));
//       }
//     });
//     return;
//   }

//   // Static files
//   let filePath = url.pathname === "/" ? "/public/index.html" : `/public${url.pathname}`;
//   filePath = path.join(__dirname, "..", filePath);

//   const ext = path.extname(filePath);
//   const mimeMap = { ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".png": "image/png", ".jpg": "image/jpeg" };

//   fs.readFile(filePath, (err, data) => {
//     if (err) { res.writeHead(404); res.end("Not found"); return; }
//     res.writeHead(200, { "Content-Type": mimeMap[ext] || "text/plain" });
//     res.end(data);
//   });
// });

// server.listen(PORT, () => {
//   console.log(`\n✅ Spendwise running at http://localhost:${PORT}`);
//   console.log(`   Make sure GEMINI_API_KEY is set in your .env\n`);
// });



// api/server.js — Local dev server
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

function getModel() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in your .env file");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: GEMINI_MODEL });
}

// Always send JSON — never let an HTML error page leak through
function sendJSON(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function parseGeminiJSON(text) {
  // Strip markdown code fences and leading/trailing whitespace
  const clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  // Find the first { and last } to extract just the JSON object
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in Gemini response");
  return JSON.parse(clean.slice(start, end + 1));
}

async function handleAnalyze(body) {
  const { imageBase64, mediaType, existingExpenses } = body;
  if (!imageBase64) throw new Error("No image data received");
  if (!mediaType) throw new Error("No media type received");

  const model = getModel();

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
- itemCategory must match the product type precisely`
  ]);

  const rawText = extractionResult.response.text();
  console.log("Gemini raw response:", rawText.slice(0, 300));

  const receiptData = parseGeminiJSON(rawText);

  // Quick insight if we have existing expenses
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
Item categories spend: ${JSON.stringify(byItemCat)}
Top items by price: ${JSON.stringify(top5)}
Total: ${grandTotal}
JSON: {"topCategory":"...","topCategoryPercent":0,"savingOpportunity":"specific saving tip based on actual items purchased","budgetSuggestion":"..."}`
      );
      insights = parseGeminiJSON(insightResult.response.text());
    } catch (e) {
      console.warn("Quick insight failed (non-fatal):", e.message);
    }
  }

  return { success: true, receipt: receiptData, insights };
}

async function handleInsights(body) {
  const { expenses, monthlyBudget } = body;
  if (!expenses || !expenses.length) throw new Error("No expenses provided");

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

  const model = getModel();
  const result = await model.generateContent(prompt);
  const rawText = result.response.text();
  console.log("Insights raw response:", rawText.slice(0, 300));

  const analysis = parseGeminiJSON(rawText);
  return { success: true, analysis, totals: { grandTotal, byReceiptCat, byItemCat, sortedReceiptCats, sortedItemCats, topItems, mostFrequent } };
}

// ── HTTP Server ──
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

  // ── API: /api/analyze ──
  if (url.pathname === "/api/analyze" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", async () => {
      try {
        const parsed = JSON.parse(body);
        const result = await handleAnalyze(parsed);
        sendJSON(res, 200, result);
      } catch (err) {
        console.error("❌ /api/analyze error:", err.message);
        sendJSON(res, 500, { success: false, error: err.message });
      }
    });
    req.on("error", (err) => sendJSON(res, 400, { success: false, error: "Bad request: " + err.message }));
    return;
  }

  // ── API: /api/insights ──
  if (url.pathname === "/api/insights" && req.method === "POST") {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", async () => {
      try {
        const parsed = JSON.parse(body);
        const result = await handleInsights(parsed);
        sendJSON(res, 200, result);
      } catch (err) {
        console.error("❌ /api/insights error:", err.message);
        sendJSON(res, 500, { success: false, error: err.message });
      }
    });
    req.on("error", (err) => sendJSON(res, 400, { success: false, error: "Bad request: " + err.message }));
    return;
  }

  // ── Static files ──
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
  console.log(`   Model : ${GEMINI_MODEL}`);
  console.log(`   API key set: ${!!process.env.GEMINI_API_KEY}\n`);
});