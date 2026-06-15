// app.js — Spendwise Receipt Analyzer

// ===== STATE =====
const state = {
  expenses: JSON.parse(localStorage.getItem('sw_expenses') || '[]'),
  budget: parseFloat(localStorage.getItem('sw_budget') || '0'),
};

const CATEGORY_COLORS = {
  'Food & Dining': '#ff6b6b',
  'Groceries': '#4ecdc4',
  'Transportation': '#45b7d1',
  'Shopping': '#f7b731',
  'Entertainment': '#a29bfe',
  'Health & Fitness': '#fd79a8',
  'Utilities': '#6c5ce7',
  'Housing': '#00b894',
  'Travel': '#0984e3',
  'Education': '#e17055',
  'Other': '#b2bec3',
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  setupUploadZone();
  setupModals();
  renderAll();
});

// ===== UPLOAD ZONE =====
function setupUploadZone() {
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
    fileInput.value = ''; // allow re-upload same file
  });
}

async function processFile(file) {
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
    showToast('Please upload an image or PDF file.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('File too large. Max 10MB.');
    return;
  }

  setProcessing(true);

  try {
    const { base64, mediaType } = await fileToBase64(file);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        mediaType,
        existingExpenses: state.expenses,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Analysis failed');
    }

    addExpense(data.receipt);

    if (data.insights) {
      showQuickTip(data.insights);
    }

    showToast(`✓ Added ${data.receipt.merchant || 'Receipt'} — ${formatAmount(data.receipt.total, data.receipt.currency)}`);
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Something went wrong. Try again.');
  } finally {
    setProcessing(false);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve({ base64, mediaType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setProcessing(on) {
  document.getElementById('uploadIdle').classList.toggle('hidden', on);
  document.getElementById('uploadProcessing').classList.toggle('hidden', !on);
}

// ===== EXPENSE MANAGEMENT =====
function addExpense(receipt) {
  const expense = {
    id: Date.now().toString(),
    merchant: receipt.merchant || 'Unknown',
    date: receipt.date || new Date().toISOString().split('T')[0],
    total: parseFloat(receipt.total) || 0,
    currency: receipt.currency || 'USD',
    category: receipt.category || 'Other',
    items: receipt.items || [],
    addedAt: Date.now(),
  };
  state.expenses.unshift(expense);
  saveState();
  renderAll();
}

function removeExpense(id) {
  state.expenses = state.expenses.filter((e) => e.id !== id);
  saveState();
  renderAll();
  showToast('Receipt removed.');
}

function saveState() {
  localStorage.setItem('sw_expenses', JSON.stringify(state.expenses));
}

// ===== RENDER =====
function renderAll() {
  renderStats();
  renderChart();
  renderReceipts();
  updateGetInsightsBtn();
}

function renderStats() {
  const hasExpenses = state.expenses.length > 0;
  const statsBar = document.getElementById('statsBar');
  statsBar.classList.toggle('hidden', !hasExpenses);

  if (!hasExpenses) return;

  const total = state.expenses.reduce((s, e) => s + e.total, 0);
  document.getElementById('totalSpent').textContent = formatAmount(total);
  document.getElementById('receiptCount').textContent = state.expenses.length;

  const byCat = groupByCategory();
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('topCategory').textContent = top ? top[0].split(' ')[0] : '—';

  if (state.budget > 0) {
    const left = state.budget - total;
    const el = document.getElementById('budgetLeft');
    el.textContent = formatAmount(left);
    el.style.color = left < 0 ? 'var(--danger)' : 'var(--positive)';
  } else {
    document.getElementById('budgetLeft').textContent = '—';
  }
}

function renderChart() {
  const hasExpenses = state.expenses.length > 0;
  const chartSection = document.getElementById('chartSection');
  chartSection.classList.toggle('hidden', !hasExpenses);
  if (!hasExpenses) return;

  const byCat = groupByCategory();
  const total = Object.values(byCat).reduce((a, b) => a + b, 0);
  const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  drawDonut(entries, total);
  renderLegend(entries, total);
}

function drawDonut(entries, total) {
  const canvas = document.getElementById('donutChart');
  const ctx = canvas.getContext('2d');
  const W = 220, H = 220;
  const cx = W / 2, cy = H / 2;
  const outerR = 90, innerR = 58;

  ctx.clearRect(0, 0, W, H);

  let startAngle = -Math.PI / 2;
  for (const [cat, amount] of entries) {
    const slice = (amount / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = CATEGORY_COLORS[cat] || '#b2bec3';
    ctx.fill();
    startAngle += slice;
  }

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#0d0e12';
  ctx.font = 'bold 18px Syne, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatAmount(total), cx, cy - 8);
  ctx.font = '500 11px Space Grotesk, sans-serif';
  ctx.fillStyle = '#9195a8';
  ctx.fillText('total spent', cx, cy + 12);
}

function renderLegend(entries, total) {
  const el = document.getElementById('chartLegend');
  el.innerHTML = entries
    .map(
      ([cat, amount]) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${CATEGORY_COLORS[cat] || '#b2bec3'}"></div>
      <span class="legend-label">${cat}</span>
      <span class="legend-amount">${formatAmount(amount)}</span>
      <span class="legend-pct">${((amount / total) * 100).toFixed(0)}%</span>
    </div>`
    )
    .join('');
}

function renderReceipts() {
  const hasExpenses = state.expenses.length > 0;
  const section = document.getElementById('receiptsSection');
  section.classList.toggle('hidden', !hasExpenses);
  if (!hasExpenses) return;

  const list = document.getElementById('receiptsList');
  list.innerHTML = state.expenses
    .map(
      (exp) => `
    <div class="receipt-item" id="receipt-${exp.id}">
      <div class="receipt-cat-dot" style="background:${CATEGORY_COLORS[exp.category] || '#b2bec3'}"></div>
      <div class="receipt-info">
        <div class="receipt-merchant">${escHtml(exp.merchant)}</div>
        <div class="receipt-meta">${exp.category} · ${formatDate(exp.date)}</div>
      </div>
      <div class="receipt-amount">${formatAmount(exp.total, exp.currency)}</div>
      <button class="receipt-remove" onclick="removeExpense('${exp.id}')" title="Remove">×</button>
    </div>`
    )
    .join('');
}

function showQuickTip(insights) {
  const tip = document.getElementById('quickTip');
  const tipText = document.getElementById('tipText');
  if (insights.savingOpportunity) {
    tipText.textContent = insights.savingOpportunity;
    tip.classList.remove('hidden');
  }
}

function updateGetInsightsBtn() {
  const btn = document.getElementById('getInsightsBtn');
  const badge = document.getElementById('receiptCountBadge');
  const count = state.expenses.length;
  btn.disabled = count === 0;
  badge.textContent = count;
}

// ===== MODALS =====
function setupModals() {
  // Report modal
  document.getElementById('getInsightsBtn').addEventListener('click', openReport);
  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('reportModal').classList.add('hidden');
  });
  document.getElementById('reportModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });

  // Budget modal
  document.getElementById('setBudgetBtn').addEventListener('click', () => {
    document.getElementById('budgetInput').value = state.budget || '';
    document.getElementById('budgetModal').classList.remove('hidden');
  });
  document.getElementById('closeBudgetModal').addEventListener('click', () => {
    document.getElementById('budgetModal').classList.add('hidden');
  });
  document.getElementById('cancelBudget').addEventListener('click', () => {
    document.getElementById('budgetModal').classList.add('hidden');
  });
  document.getElementById('saveBudget').addEventListener('click', () => {
    const val = parseFloat(document.getElementById('budgetInput').value);
    if (val > 0) {
      state.budget = val;
      localStorage.setItem('sw_budget', val);
      renderStats();
      showToast(`Budget set to ${formatAmount(val)}`);
    }
    document.getElementById('budgetModal').classList.add('hidden');
  });
  document.getElementById('budgetModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });

  // Clear all
  document.getElementById('clearAllBtn').addEventListener('click', () => {
    if (confirm('Remove all receipts?')) {
      state.expenses = [];
      saveState();
      renderAll();
      document.getElementById('quickTip').classList.add('hidden');
      showToast('All receipts cleared.');
    }
  });
}

async function openReport() {
  const modal = document.getElementById('reportModal');
  const body = document.getElementById('reportBody');
  modal.classList.remove('hidden');
  body.innerHTML = `<div class="report-loading"><div class="spinner"></div><p>Analyzing your spending patterns<span class="dots"></span></p></div>`;

  try {
    const response = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expenses: state.expenses,
        monthlyBudget: state.budget || null,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Failed');

    renderReport(data.analysis, data.totals);
  } catch (err) {
    body.innerHTML = `<p style="color:var(--danger);text-align:center;padding:40px 0">${err.message || 'Could not load report. Try again.'}</p>`;
  }
}

function renderReport(analysis, totals) {
  const body = document.getElementById('reportBody');

  const scoreColor = analysis.score >= 70 ? 'var(--positive)' : analysis.score >= 40 ? 'var(--warning)' : 'var(--danger)';
  const scoreDesc = analysis.score >= 70 ? 'Great spending habits!' : analysis.score >= 40 ? 'Room for improvement' : 'Needs attention';

  const categoryRows = (analysis.categoryBreakdown || [])
    .map(
      (c) => `
    <div class="cat-row">
      <div style="width:10px;height:10px;border-radius:50%;background:${CATEGORY_COLORS[c.category] || '#b2bec3'};flex-shrink:0;margin-top:4px"></div>
      <div class="cat-bar-wrap">
        <div class="cat-bar-header">
          <span class="cat-name">${escHtml(c.category)}</span>
          <span class="cat-pct">${formatAmount(c.amount)} · ${c.percent.toFixed(0)}%</span>
        </div>
        <div class="cat-bar">
          <div class="cat-bar-fill" style="width:${Math.min(c.percent, 100)}%;background:${CATEGORY_COLORS[c.category] || '#b2bec3'}"></div>
        </div>
        <div class="cat-tip">${escHtml(c.tip || '')}</div>
      </div>
      <span class="status-badge status-${c.status || 'normal'}">${c.status || 'ok'}</span>
    </div>`
    )
    .join('');

  const savingItems = (analysis.savingPlan || [])
    .map(
      (tip, i) => `
    <div class="saving-item">
      <div class="saving-num">${i + 1}</div>
      <span>${escHtml(tip)}</span>
    </div>`
    )
    .join('');

  const alloc = analysis.budgetAllocation || {};
  const allocKeys = Object.keys(alloc);

  body.innerHTML = `
    <div class="report-score">
      <div class="score-circle" style="background:${scoreColor}">
        <span class="score-num">${analysis.score || '—'}</span>
      </div>
      <div class="score-info">
        <div class="score-label">Finance Score</div>
        <div class="score-desc">${escHtml(scoreDesc)}</div>
      </div>
    </div>

    <div class="report-summary">${escHtml(analysis.summary || '')}</div>

    <div class="report-section">
      <div class="report-section-title">Spending by Category</div>
      ${categoryRows}
    </div>

    ${analysis.savingPlan?.length ? `
    <div class="report-section">
      <div class="report-section-title">Your Saving Plan</div>
      <div class="saving-plan">${savingItems}</div>
    </div>` : ''}

    ${allocKeys.length ? `
    <div class="report-section">
      <div class="report-section-title">Ideal 50/30/20 Budget Split</div>
      <div class="budget-allocation">
        <div class="budget-alloc-card needs">
          <div class="alloc-label">Needs 50%</div>
          <div class="alloc-value">${formatAmount(alloc[allocKeys[0]] || 0)}</div>
        </div>
        <div class="budget-alloc-card wants">
          <div class="alloc-label">Wants 30%</div>
          <div class="alloc-value">${formatAmount(alloc[allocKeys[1]] || 0)}</div>
        </div>
        <div class="budget-alloc-card savings">
          <div class="alloc-label">Savings 20%</div>
          <div class="alloc-value">${formatAmount(alloc[allocKeys[2]] || 0)}</div>
        </div>
      </div>
    </div>` : ''}

    ${analysis.weeklyTarget ? `
    <div class="quick-tip" style="margin-top:0">
      <span class="tip-icon">🎯</span>
      <p class="tip-text">To stay on track, aim to spend <strong>${formatAmount(analysis.weeklyTarget)}/week</strong>. ${escHtml(analysis.topInsight || '')}</p>
    </div>` : ''}
  `;
}

// ===== HELPERS =====
function groupByCategory() {
  return state.expenses.reduce((acc, e) => {
    const cat = e.category || 'Other';
    acc[cat] = (acc[cat] || 0) + e.total;
    return acc;
  }, {});
}

function formatAmount(amount, currency) {
  const num = parseFloat(amount) || 0;
  if (currency && currency !== 'USD') {
    return `${num.toFixed(2)} ${currency}`;
  }
  return `$${num.toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let toastTimeout;
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.add('hidden'), 3200);
}
