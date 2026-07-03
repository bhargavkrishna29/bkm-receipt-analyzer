// api/server.js — Spendwise Server
// Handles Gemini AI receipt analysis ONLY.
// Firestore reads/writes are done directly by the browser (Firebase client SDK).
// No Firebase Admin SDK or service account key needed.

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

// ── Rate Limiter (in-memory, per-IP) ─────────────────────────────────────────
// Persists in memory for the lifetime of the Render instance.
const rateLimitMap = new Map(); // ip → { count, resetAt }
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "10");       // max requests per window
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(60 * 60 * 1000)); // 1 hour

function getClientIP(req) {
  // Render sets X-Forwarded-For; fall back to socket address
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function checkRateLimit(req) {
  const ip = getClientIP(req);
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, ip };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000), ip };
  }
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, ip };
}

// Clean up stale entries every 30 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 30 * 60 * 1000);

// ── Audit Logger ─────────────────────────────────────────────────────────────
// Emits structured JSON — Render captures stdout as searchable logs.
function auditLog(req, action, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    ip: getClientIP(req),
    userAgent: req.headers["user-agent"]?.slice(0, 120) || null,
    ...meta,
  };
  // JSON format is parsed by Render's log aggregator
  console.log(JSON.stringify({ level: "audit", ...entry }));
}

// ── Gemini ───────────────────────────────────────────────────────────────────
function getModel() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in your .env file");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: GEMINI_MODEL });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function sendJSON(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function parseGeminiJSON(text) {
  const clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in Gemini response");
  return JSON.parse(clean.slice(start, end + 1));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (d) => (body += d));
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch (e) { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

// ── POST /api/analyze — Gemini OCR only, no Firestore ────────────────────────
// The browser saves the returned receipt to Firestore directly.
async function handleAnalyze(req) {
  const body = await readBody(req);
  auditLog(req, "RECEIPT_ANALYZE_REQUEST", { mediaType: body.mediaType, hasExistingExpenses: !!(body.existingExpenses?.length) });
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
- itemCategory must match the product type precisely`,
  ]);

  const rawText = extractionResult.response.text();
  console.log("Gemini raw response:", rawText.slice(0, 300));
  const receiptData = parseGeminiJSON(rawText);

  // Quick insight if existing expenses passed in
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

  auditLog(req, "RECEIPT_ANALYZE_SUCCESS", { merchant: receiptData.merchant, total: receiptData.total, currency: receiptData.currency, confidence: receiptData.confidence });
  return { success: true, receipt: receiptData, insights };
}

// ── POST /api/insights — full spending analysis ───────────────────────────────
// The browser passes its expenses array (loaded from Firestore client-side).
async function handleInsights(req) {
  const body = await readBody(req);
  const { expenses, monthlyBudget } = body;
  if (!expenses || !expenses.length) throw new Error("No expenses provided");
  auditLog(req, "INSIGHTS_REQUEST", { expenseCount: expenses.length, hasBudget: !!monthlyBudget });

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
  auditLog(req, "INSIGHTS_SUCCESS", { expenseCount: expenses.length, grandTotal });
  return { success: true, analysis, totals: { grandTotal, byReceiptCat, byItemCat, sortedReceiptCats, sortedItemCats, topItems, mostFrequent } };
}

// ── HTTP Server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

  // ── Health check (used by Render to verify service is up) ───────────────────
  if (url.pathname === "/health" || url.pathname === "/api/health") {
    return sendJSON(res, 200, { status: "ok", timestamp: new Date().toISOString() });
  }

  // ── Rate limiting (applied to all /api/* routes) ─────────────────────────────
  if (url.pathname.startsWith("/api/")) {
    const limit = checkRateLimit(req);
    res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX);
    res.setHeader("X-RateLimit-Remaining", limit.remaining ?? 0);
    res.setHeader("X-RateLimit-Window", `${RATE_LIMIT_WINDOW_MS / 1000}s`);

    if (!limit.allowed) {
      res.setHeader("Retry-After", limit.retryAfter);
      auditLog(req, "RATE_LIMIT_EXCEEDED", { ip: limit.ip, retryAfterSeconds: limit.retryAfter });
      return sendJSON(res, 429, {
        success: false,
        error: `Rate limit exceeded. You can make ${RATE_LIMIT_MAX} requests per hour. Try again in ${Math.ceil(limit.retryAfter / 60)} minute(s).`,
      });
    }
  }

  try {
    if (url.pathname === "/api/analyze" && req.method === "POST") {
      return sendJSON(res, 200, await handleAnalyze(req));
    }
    if (url.pathname === "/api/insights" && req.method === "POST") {
      return sendJSON(res, 200, await handleInsights(req));
    }

    // ── Static files ──
    let filePath = url.pathname === "/" ? "/public/index.html" : `/public${url.pathname}`;
    filePath = path.join(__dirname, "..", filePath);
    const ext = path.extname(filePath);
    const mimeMap = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".webp": "image/webp",
    };
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end("Not found"); return; }
      res.writeHead(200, { "Content-Type": mimeMap[ext] || "text/plain" });
      res.end(data);
    });

  } catch (err) {
    auditLog(req, "REQUEST_ERROR", { path: url.pathname, error: err.message });
    console.error(`❌ ${req.method} ${url.pathname} error:`, err.message);
    sendJSON(res, 500, { success: false, error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n✅ Spendwise running at http://localhost:${PORT}`);
  console.log(`   Model       : ${GEMINI_MODEL}`);
  console.log(`   API key set : ${!!process.env.GEMINI_API_KEY}`);
  console.log(`   Rate limit  : ${RATE_LIMIT_MAX} requests / ${RATE_LIMIT_WINDOW_MS / 60000} min`);
  console.log(`   Health check: GET /health`);
  console.log(`   Auth        : Firebase (Google + Email) — browser handles Firestore directly\n`);
});