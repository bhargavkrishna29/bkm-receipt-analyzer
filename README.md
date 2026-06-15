# Spendwise — AI Receipt Analyzer

Upload your receipts and get AI-powered insights on where you're overspending and how to balance your monthly budget.

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (no framework needed)
- **Backend**: Node.js serverless functions (Vercel)
- **AI**: Claude claude-sonnet-4-6 (vision for OCR + analysis)
- **Storage**: Browser localStorage (receipts persist per device)

## Project Structure

```
receipt-analyzer/
├── api/
│   ├── analyze.js      # Vercel serverless: extract receipt data via Claude Vision
│   ├── insights.js     # Vercel serverless: generate monthly spending report
│   └── server.js       # Local dev server (not used in production)
├── public/
│   ├── index.html      # Main app UI
│   ├── css/styles.css  # All styles
│   └── js/app.js       # Frontend logic
├── vercel.json         # Vercel routing config
├── package.json
└── .env.example
```

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Set up your API key
```bash
cp .env.example .env
# Edit .env and add your Anthropic API key
```

Get your key at: https://console.anthropic.com/

### 3. Run the dev server
```bash
node --env-file=.env api/server.js
```

Open http://localhost:3000

## Deploy to Vercel

### Option A: Vercel CLI (recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set your API key in Vercel dashboard or via CLI:
vercel env add ANTHROPIC_API_KEY
# paste your key when prompted

# Deploy to production
vercel --prod
```

### Option B: GitHub + Vercel Dashboard
1. Push this project to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key
5. Click Deploy

## Features

| Feature | Description |
|---|---|
| 📸 Receipt Upload | Drag & drop or click to upload JPG, PNG, WEBP, PDF |
| 🤖 AI OCR | Claude Vision extracts merchant, date, total, items, category |
| 📊 Donut Chart | Visual breakdown of spending by category |
| 💡 Quick Tips | Instant saving suggestion after each upload |
| 📋 Full Report | Detailed monthly analysis with finance score (1–100) |
| 🎯 50/30/20 Rule | Recommended budget allocation based on your spending |
| 💰 Budget Tracker | Set monthly budget and track remaining balance |
| 🗑️ Manage Receipts | Remove individual receipts or clear all |

## How It Works

1. **Upload**: User drops a receipt image
2. **Extract** (`/api/analyze`): Claude Vision reads the receipt → returns structured JSON (merchant, date, total, category, items)
3. **Insight** (`/api/analyze`): If 2+ receipts exist, Claude gives a quick saving tip
4. **Report** (`/api/insights`): Full monthly report with category breakdown, saving plan, finance score

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic API key |

## Extending This Project

### Add a database (persist across devices)
Replace `localStorage` with a database. Recommended for Vercel:
- **Vercel KV** (Redis) — add `@vercel/kv` package
- **PlanetScale** or **Neon** (Postgres) — add `pg` or `mysql2`
- **MongoDB Atlas** — add `mongoose`

### Add authentication
- Use **Clerk** or **NextAuth.js** for user accounts
- Each user gets their own expense history

### Export to CSV/PDF
Add a `/api/export` endpoint that formats expenses and returns a downloadable file

### Multi-currency support
The app already captures currency from receipts — add conversion using an exchange rate API
