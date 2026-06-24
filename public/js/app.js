// app.js — Spendwise Receipt Analyzer (Firebase Auth + Client-side Firestore)
import {
  observeAuthState,
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  signOut,
  resendVerificationEmail,
  friendlyAuthError,
} from "./auth.js";

import {
  saveReceipt,
  loadReceipts,
  deleteReceipt,
  saveBudget,
  loadProfile,
  saveProfileData,
} from "./firestore.js";

// ===== STATE =====
const state = {
  expenses: [],
  displayExpenses: [],
  budget: 0,
  user: null,
  filters: {
    months: 3,
    category: 'All',
    sort: 'newest'
  }
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

const ITEM_CAT_COLORS = {
  'Produce': '#4ecdc4',
  'Dairy': '#a8d8ea',
  'Meat & Fish': '#ff6b6b',
  'Bakery': '#f7b731',
  'Beverages': '#45b7d1',
  'Snacks & Sweets': '#fd79a8',
  'Frozen': '#74b9ff',
  'Household': '#6c5ce7',
  'Personal Care': '#e84393',
  'Clothing': '#e17055',
  'Electronics': '#0984e3',
  'Medicine': '#00b894',
  'Transport': '#fdcb6e',
  'Entertainment': '#a29bfe',
  'Dining': '#d63031',
  'Other': '#b2bec3',
};

// ===== SAFE FETCH (server calls — Gemini only, no auth header needed) =====
async function safeFetch(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (networkErr) {
    throw new Error('Network error — is the server running?');
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    const match = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    const detail = match ? match[1].trim().slice(0, 200) : text.slice(0, 200);
    throw new Error(`Server error (${response.status}): ${detail}`);
  }

  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

// ===== AUTH SCREEN LOGIC ===================================================
function switchTab(tab) {
  const isSignIn = tab === 'signin';
  document.getElementById('tabSignIn').classList.toggle('active', isSignIn);
  document.getElementById('tabSignUp').classList.toggle('active', !isSignIn);
  document.getElementById('signInForm').classList.toggle('hidden', !isSignIn);
  document.getElementById('signUpForm').classList.toggle('hidden', isSignIn);
  document.getElementById('signInError').classList.add('hidden');
  document.getElementById('signUpError').classList.add('hidden');
}
window.switchTab = switchTab;

function setAuthLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait…' : (btnId === 'signInBtn' ? 'Sign In' : 'Create Account');
}

window.handleSignIn = async function (e) {
  e.preventDefault();
  const email = document.getElementById('siEmail').value.trim();
  const password = document.getElementById('siPassword').value;
  const errEl = document.getElementById('signInError');
  errEl.classList.add('hidden');
  setAuthLoading('signInBtn', true);
  try {
    await signInWithEmail(email, password);
  } catch (err) {
    errEl.textContent = friendlyAuthError(err);
    errEl.classList.remove('hidden');
  } finally {
    setAuthLoading('signInBtn', false);
  }
};

window.handleSignUp = async function (e) {
  e.preventDefault();
  const email = document.getElementById('suEmail').value.trim();
  const password = document.getElementById('suPassword').value;
  const errEl = document.getElementById('signUpError');
  errEl.classList.add('hidden');
  setAuthLoading('signUpBtn', true);
  try {
    const user = await signUpWithEmail(email, password);
    document.getElementById('verifyEmail').textContent = user.email;
    document.getElementById('authVerifyBanner').classList.remove('hidden');
  } catch (err) {
    errEl.textContent = friendlyAuthError(err);
    errEl.classList.remove('hidden');
  } finally {
    setAuthLoading('signUpBtn', false);
  }
};

// ===== AUTH STATE GATE =====================================================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('googleSignInBtn').addEventListener('click', async () => {
    const errEl = document.getElementById('signInError');
    try {
      await signInWithGoogle();
    } catch (err) {
      errEl.textContent = friendlyAuthError(err);
      errEl.classList.remove('hidden');
    }
  });

  document.getElementById('resendVerifyBtn')?.addEventListener('click', async () => {
    try { await resendVerificationEmail(); showToast('Verification email resent ✓'); }
    catch (err) { showToast('Failed to resend: ' + err.message); }
  });
  document.getElementById('resendNoticeBtn')?.addEventListener('click', async () => {
    try { await resendVerificationEmail(); showToast('Verification email resent ✓'); }
    catch (err) { showToast('Failed to resend: ' + err.message); }
  });

  document.getElementById('signOutBtn').addEventListener('click', async () => {
    await signOut();
  });

  // Filters
  document.getElementById('filterMonth').addEventListener('change', (e) => {
    state.filters.months = parseInt(e.target.value, 10);
    applyFilters();
  });
  document.getElementById('filterCategory').addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    applyFilters();
  });
  document.getElementById('sortReceipts').addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    applyFilters();
  });

  observeAuthState(async (user) => {
    document.getElementById('authLoading').classList.add('hidden');

    if (user) {
      state.user = user;
      document.getElementById('authScreen').classList.add('hidden');
      document.getElementById('appShell').classList.remove('hidden');

      const initials = (user.displayName || user.email || '?')[0].toUpperCase();
      document.getElementById('userAvatar').textContent = initials;
      document.getElementById('userName').textContent = user.displayName || user.email?.split('@')[0] || '';

      if (!user.emailVerified && user.providerData[0]?.providerId === 'password') {
        document.getElementById('verifyNotice').classList.remove('hidden');
      } else {
        document.getElementById('verifyNotice').classList.add('hidden');
      }

      setupUploadZone();
      setupModals();
      await saveProfileData(user);
      await loadUserData();
    } else {
      state.user = null;
      state.expenses = [];
      state.budget = 0;
      document.getElementById('appShell').classList.add('hidden');
      document.getElementById('authScreen').classList.remove('hidden');
    }
  });
});

// ===== LOAD USER DATA FROM FIRESTORE (client-side) =========================
async function loadUserData() {
  try {
    showToast('Loading your receipts…');

    // Load profile (budget) and receipts in parallel
    const [profile, receipts] = await Promise.all([
      loadProfile(),
      loadReceipts(3),
    ]);

    state.budget = profile?.budget || 0;
    state.expenses = receipts;

    applyFilters();
    showToast(`Welcome back! ${state.expenses.length} receipt${state.expenses.length !== 1 ? 's' : ''} loaded.`);
  } catch (err) {
    console.error('Failed to load user data:', err);
    showToast('⚠️ ' + err.message);
  }
}

// ===== UPLOAD ZONE =========================================================
function setupUploadZone() {
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');

  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
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
    fileInput.value = '';
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

    // 1. Send image to server → Gemini analyzes → returns receipt JSON
    const data = await safeFetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        imageBase64: base64,
        mediaType,
        existingExpenses: state.expenses,
      }),
    });

    // 2. Save receipt to Firestore directly from browser
    const saved = await saveReceipt({
      merchant: data.receipt.merchant || 'Unknown',
      date: data.receipt.date || new Date().toISOString().split('T')[0],
      total: parseFloat(data.receipt.total) || 0,
      currency: data.receipt.currency || 'SEK',
      receiptCategory: data.receipt.receiptCategory || data.receipt.category || 'Other',
      items: (data.receipt.items || []).map((item) => ({
        name: item.name || 'Unknown item',
        amount: parseFloat(item.amount) || 0,
        quantity: item.quantity || 1,
        unitPrice: parseFloat(item.unitPrice) || parseFloat(item.amount) || 0,
        itemCategory: item.itemCategory || 'Other',
      })),
      taxAmount: data.receipt.taxAmount || 0,
      discountAmount: data.receipt.discountAmount || 0,
      confidence: data.receipt.confidence || 'medium',
    });

    state.expenses.unshift(saved);
    applyFilters();

    if (data.insights) showQuickTip(data.insights);
    showToast(`✓ Added ${saved.merchant} — ${formatAmount(saved.total, saved.currency)}`);
  } catch (err) {
    console.error('Upload error:', err);
    showToast('❌ ' + (err.message || 'Something went wrong. Try again.'));
  } finally {
    setProcessing(false);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ base64: reader.result.split(',')[1], mediaType: file.type });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setProcessing(on) {
  document.getElementById('uploadIdle').classList.toggle('hidden', on);
  document.getElementById('uploadProcessing').classList.toggle('hidden', !on);
}

// ===== EXPENSE MANAGEMENT ==================================================
async function removeExpense(id) {
  try {
    await deleteReceipt(id);  // Firestore delete directly from browser
    state.expenses = state.expenses.filter((e) => e.id !== id);
    applyFilters();
    showToast('Receipt removed.');
  } catch (err) {
    showToast('❌ Failed to remove: ' + err.message);
  }
}
window.removeExpense = removeExpense;

// ===== RENDER & FILTERS ====================================================
function applyFilters() {
  let filtered = [...state.expenses];

  if (state.filters.months === 1) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 1);
    const cutoffMs = cutoff.getTime();
    filtered = filtered.filter(e => e.addedAt >= cutoffMs);
  }

  if (state.filters.category !== 'All') {
    filtered = filtered.filter(e => (e.receiptCategory || e.category || 'Other') === state.filters.category);
  }

  filtered.sort((a, b) => {
    if (state.filters.sort === 'newest') return b.addedAt - a.addedAt;
    if (state.filters.sort === 'oldest') return a.addedAt - b.addedAt;
    if (state.filters.sort === 'high') return b.total - a.total;
    if (state.filters.sort === 'low') return a.total - b.total;
    return 0;
  });

  state.displayExpenses = filtered;
  renderAll();
}

function renderAll() {
  renderStats();
  renderChart();
  renderItemsSection();
  renderReceipts();
  updateGetInsightsBtn();
}

function renderStats() {
  const hasExpenses = state.displayExpenses.length > 0;
  document.getElementById('statsBar').classList.toggle('hidden', !hasExpenses);
  if (!hasExpenses) return;

  const total = state.displayExpenses.reduce((s, e) => s + e.total, 0);
  document.getElementById('totalSpent').textContent = formatAmount(total);
  document.getElementById('receiptCount').textContent = state.displayExpenses.length;

  const totalItems = state.displayExpenses.reduce((s, e) => s + (e.items || []).length, 0);
  document.getElementById('totalItems').textContent = totalItems;

  const byCat = groupByReceiptCategory();
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
  const hasExpenses = state.displayExpenses.length > 0;
  document.getElementById('chartSection').classList.toggle('hidden', !hasExpenses);
  if (!hasExpenses) return;

  const byReceiptCat = groupByReceiptCategory();
  const receiptTotal = Object.values(byReceiptCat).reduce((a, b) => a + b, 0);
  const receiptEntries = Object.entries(byReceiptCat).sort((a, b) => b[1] - a[1]);
  drawDonut('donutChart', receiptEntries, receiptTotal, CATEGORY_COLORS);
  renderLegend('chartLegend', receiptEntries, receiptTotal, CATEGORY_COLORS);

  const byItemCat = groupByItemCategory();
  const itemTotal = Object.values(byItemCat).reduce((a, b) => a + b, 0);
  const itemEntries = Object.entries(byItemCat).sort((a, b) => b[1] - a[1]);
  drawDonut('itemDonutChart', itemEntries, itemTotal, ITEM_CAT_COLORS);
  renderLegend('itemChartLegend', itemEntries, itemTotal, ITEM_CAT_COLORS);
}

function drawDonut(canvasId, entries, total, colorMap) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 200, H = 200;
  const cx = W / 2, cy = H / 2;
  const outerR = 85, innerR = 54;

  ctx.clearRect(0, 0, W, H);
  if (total === 0) return;

  let startAngle = -Math.PI / 2;
  for (const [cat, amount] of entries) {
    const slice = (amount / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = colorMap[cat] || '#b2bec3';
    ctx.fill();
    startAngle += slice;
  }

  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();

  ctx.fillStyle = '#0d0e12';
  ctx.font = 'bold 16px Syne, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatAmount(total), cx, cy - 8);
  ctx.font = '500 10px Space Grotesk, sans-serif';
  ctx.fillStyle = '#9195a8';
  ctx.fillText('total', cx, cy + 10);
}

function renderLegend(legendId, entries, total, colorMap) {
  const el = document.getElementById(legendId);
  if (!el) return;
  el.innerHTML = entries.map(([cat, amount]) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${colorMap[cat] || '#b2bec3'}"></div>
      <span class="legend-label">${cat}</span>
      <span class="legend-amount">${formatAmount(amount)}</span>
      <span class="legend-pct">${((amount / total) * 100).toFixed(0)}%</span>
    </div>`).join('');
}

function renderItemsSection() {
  const section = document.getElementById('itemsSection');
  const container = document.getElementById('itemsTable');
  if (!section || !container) return;

  const allItems = [];
  for (const exp of state.displayExpenses) {
    for (const item of exp.items || []) {
      allItems.push({
        name: item.name,
        amount: item.amount,
        quantity: item.quantity || 1,
        category: item.itemCategory || 'Other',
        merchant: exp.merchant,
        currency: exp.currency,
      });
    }
  }

  section.classList.toggle('hidden', allItems.length === 0);
  if (allItems.length === 0) return;

  allItems.sort((a, b) => b.amount - a.amount);

  container.innerHTML = `
    <table class="items-tbl">
      <thead>
        <tr>
          <th>Item</th><th>Category</th><th>Store</th><th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${allItems.map(item => `
          <tr>
            <td class="item-name-cell">
              <span class="item-dot" style="background:${ITEM_CAT_COLORS[item.category] || '#b2bec3'}"></span>
              ${escHtml(item.name)}
              ${item.quantity > 1 ? `<span class="item-qty">×${item.quantity}</span>` : ''}
            </td>
            <td><span class="item-cat-tag">${escHtml(item.category)}</span></td>
            <td class="item-merchant">${escHtml(item.merchant)}</td>
            <td style="text-align:right;font-weight:600">${formatAmount(item.amount, item.currency)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderReceipts() {
  const hasExpenses = state.displayExpenses.length > 0;
  document.getElementById('receiptsSection').classList.toggle('hidden', !hasExpenses);
  if (!hasExpenses) return;

  document.getElementById('receiptsList').innerHTML = state.displayExpenses.map((exp) => `
    <div class="receipt-item" id="receipt-${exp.id}">
      <div class="receipt-cat-dot" style="background:${CATEGORY_COLORS[exp.receiptCategory || exp.category] || '#b2bec3'}"></div>
      <div class="receipt-info">
        <div class="receipt-merchant">${escHtml(exp.merchant)}</div>
        <div class="receipt-meta">${exp.receiptCategory || exp.category} · ${formatDate(exp.date)} · ${(exp.items || []).length} items</div>
      </div>
      <div class="receipt-amount">${formatAmount(exp.total, exp.currency)}</div>
      <button class="receipt-remove" onclick="removeExpense('${exp.id}')" title="Remove">×</button>
    </div>`).join('');
}

function showQuickTip(insights) {
  const tip = document.getElementById('quickTip');
  const tipText = document.getElementById('tipText');
  if (insights && insights.savingOpportunity) {
    tipText.textContent = insights.savingOpportunity;
    tip.classList.remove('hidden');
  }
}

function updateGetInsightsBtn() {
  const btn = document.getElementById('getInsightsBtn');
  const badge = document.getElementById('receiptCountBadge');
  const count = state.displayExpenses.length;
  btn.disabled = count === 0;
  badge.textContent = count;
}

// ===== GROUPING HELPERS ====================================================
function groupByReceiptCategory() {
  return state.displayExpenses.reduce((acc, e) => {
    const cat = e.receiptCategory || e.category || 'Other';
    acc[cat] = (acc[cat] || 0) + e.total;
    return acc;
  }, {});
}

function groupByItemCategory() {
  const acc = {};
  for (const exp of state.displayExpenses) {
    for (const item of exp.items || []) {
      const cat = item.itemCategory || 'Other';
      acc[cat] = (acc[cat] || 0) + (parseFloat(item.amount) || 0);
    }
  }
  return acc;
}

// ===== MODALS ==============================================================
function setupModals() {
  document.getElementById('getInsightsBtn').addEventListener('click', openReport);
  document.getElementById('closeModal').addEventListener('click', () => document.getElementById('reportModal').classList.add('hidden'));
  document.getElementById('reportModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });

  document.getElementById('setBudgetBtn').addEventListener('click', () => {
    document.getElementById('budgetInput').value = state.budget || '';
    document.getElementById('budgetModal').classList.remove('hidden');
  });
  document.getElementById('closeBudgetModal').addEventListener('click', () => document.getElementById('budgetModal').classList.add('hidden'));
  document.getElementById('cancelBudget').addEventListener('click', () => document.getElementById('budgetModal').classList.add('hidden'));
  document.getElementById('saveBudget').addEventListener('click', async () => {
    const val = parseFloat(document.getElementById('budgetInput').value);
    if (val > 0) {
      try {
        await saveBudget(val);  // Firestore write directly from browser
        state.budget = val;
        renderStats();
        showToast(`Budget set to ${formatAmount(val)}`);
      } catch (err) {
        showToast('❌ Failed to save budget: ' + err.message);
      }
    }
    document.getElementById('budgetModal').classList.add('hidden');
  });
  document.getElementById('budgetModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });

  document.getElementById('clearAllBtn').addEventListener('click', async () => {
    if (!confirm('Remove all receipts? This cannot be undone.')) return;
    try {
      await Promise.all(state.expenses.map((e) => deleteReceipt(e.id)));
      state.expenses = [];
      applyFilters();
      document.getElementById('quickTip').classList.add('hidden');
      showToast('All receipts cleared.');
    } catch (err) {
      showToast('❌ ' + err.message);
    }
  });
}

async function openReport() {
  const modal = document.getElementById('reportModal');
  const body = document.getElementById('reportBody');
  modal.classList.remove('hidden');
  body.innerHTML = `<div class="report-loading"><div class="spinner"></div><p>Analyzing your spending patterns<span class="dots"></span></p></div>`;

  try {
    // Pass expenses from in-memory state (already loaded from Firestore)
    const data = await safeFetch('/api/insights', {
      method: 'POST',
      body: JSON.stringify({ expenses: state.displayExpenses, monthlyBudget: state.budget || null }),
    });
    renderReport(data.analysis, data.totals);
  } catch (err) {
    body.innerHTML = `<div style="padding:32px;text-align:center">
      <p style="color:var(--danger);font-weight:600;margin-bottom:8px">Failed to load report</p>
      <p style="color:var(--ink-muted);font-size:13px">${escHtml(err.message)}</p>
    </div>`;
  }
}

function renderReport(analysis, totals) {
  const body = document.getElementById('reportBody');
  const scoreColor = analysis.score >= 70 ? 'var(--positive)' : analysis.score >= 40 ? 'var(--warning)' : 'var(--danger)';
  const scoreDesc = analysis.score >= 70 ? 'Great spending habits!' : analysis.score >= 40 ? 'Room for improvement' : 'Needs attention';

  const receiptCatRows = (analysis.receiptCategoryBreakdown || []).map((c) => `
    <div class="cat-row">
      <div style="width:10px;height:10px;border-radius:50%;background:${CATEGORY_COLORS[c.category] || '#b2bec3'};flex-shrink:0;margin-top:4px"></div>
      <div class="cat-bar-wrap">
        <div class="cat-bar-header"><span class="cat-name">${escHtml(c.category)}</span><span class="cat-pct">${formatAmount(c.amount)} · ${(c.percent || 0).toFixed(0)}%</span></div>
        <div class="cat-bar"><div class="cat-bar-fill" style="width:${Math.min(c.percent || 0, 100)}%;background:${CATEGORY_COLORS[c.category] || '#b2bec3'}"></div></div>
        <div class="cat-tip">${escHtml(c.tip || '')}</div>
      </div>
      <span class="status-badge status-${c.status || 'normal'}">${c.status || 'ok'}</span>
    </div>`).join('');

  const itemCatRows = (analysis.itemCategoryBreakdown || []).map((c) => `
    <div class="cat-row">
      <div style="width:10px;height:10px;border-radius:50%;background:${ITEM_CAT_COLORS[c.category] || '#b2bec3'};flex-shrink:0;margin-top:4px"></div>
      <div class="cat-bar-wrap">
        <div class="cat-bar-header"><span class="cat-name">${escHtml(c.category)}</span><span class="cat-pct">${formatAmount(c.amount)} · ${(c.percent || 0).toFixed(0)}%</span></div>
        <div class="cat-bar"><div class="cat-bar-fill" style="width:${Math.min(c.percent || 0, 100)}%;background:${ITEM_CAT_COLORS[c.category] || '#b2bec3'}"></div></div>
        <div class="cat-tip">${escHtml(c.insight || '')}</div>
      </div>
    </div>`).join('');

  const topSpendRows = (analysis.topSpendItems || []).map((item) => `
    <div class="top-item-row">
      <div class="top-item-info">
        <span class="top-item-name">${escHtml(item.name)}</span>
        ${item.alternative ? `<span class="top-item-alt">💡 ${escHtml(item.alternative)}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="essential-badge ${item.isEssential ? 'essential' : 'non-essential'}">${item.isEssential ? 'Essential' : 'Optional'}</span>
        <span class="top-item-amount">${formatAmount(item.amount)}</span>
      </div>
    </div>`).join('');

  const savingItems = (analysis.savingPlan || []).map((tip, i) => `
    <div class="saving-item"><div class="saving-num">${i + 1}</div><span>${escHtml(tip)}</span></div>`).join('');

  const alloc = analysis.budgetAllocation || {};
  const allocKeys = Object.keys(alloc);

  body.innerHTML = `
    <div class="report-score">
      <div class="score-circle" style="background:${scoreColor}"><span class="score-num">${analysis.score || '—'}</span></div>
      <div class="score-info">
        <div class="score-label">Finance Score</div>
        <div class="score-desc">${escHtml(scoreDesc)}</div>
        ${analysis.topInsight ? `<div class="score-insight">"${escHtml(analysis.topInsight)}"</div>` : ''}
      </div>
    </div>
    <div class="report-summary">${escHtml(analysis.summary || '')}</div>
    ${analysis.unnecessarySpend > 0 || analysis.essentialSpend > 0 ? `
    <div class="spend-split">
      <div class="spend-split-item essential-spend"><span class="spend-split-label">Essential</span><span class="spend-split-value">${formatAmount(analysis.essentialSpend)}</span></div>
      <div class="spend-split-item optional-spend"><span class="spend-split-label">Optional</span><span class="spend-split-value">${formatAmount(analysis.unnecessarySpend)}</span></div>
    </div>` : ''}
    ${receiptCatRows ? `<div class="report-section"><div class="report-section-title">By Store Category</div>${receiptCatRows}</div>` : ''}
    ${itemCatRows ? `<div class="report-section"><div class="report-section-title">By Item Type</div>${itemCatRows}</div>` : ''}
    ${topSpendRows ? `<div class="report-section"><div class="report-section-title">Top Spend Items</div>${topSpendRows}</div>` : ''}
    ${savingItems ? `<div class="report-section"><div class="report-section-title">Your Saving Plan</div><div class="saving-plan">${savingItems}</div></div>` : ''}
    ${allocKeys.length ? `
    <div class="report-section">
      <div class="report-section-title">Ideal 50/30/20 Budget Split</div>
      <div class="budget-allocation">
        <div class="budget-alloc-card needs"><div class="alloc-label">Needs 50%</div><div class="alloc-value">${formatAmount(alloc[allocKeys[0]] || 0)}</div></div>
        <div class="budget-alloc-card wants"><div class="alloc-label">Wants 30%</div><div class="alloc-value">${formatAmount(alloc[allocKeys[1]] || 0)}</div></div>
        <div class="budget-alloc-card savings"><div class="alloc-label">Savings 20%</div><div class="alloc-value">${formatAmount(alloc[allocKeys[2]] || 0)}</div></div>
      </div>
    </div>` : ''}
    ${analysis.weeklyTarget ? `
    <div class="quick-tip" style="margin-top:0">
      <span class="tip-icon">🎯</span>
      <p class="tip-text">Aim to spend <strong>${formatAmount(analysis.weeklyTarget)}/week</strong> to stay on track.</p>
    </div>` : ''}`;
}

// ===== HELPERS =============================================================
function formatAmount(amount, currency) {
  const num = parseFloat(amount) || 0;
  if (currency && currency !== 'USD') return `${num.toFixed(2)} ${currency}`;
  return `$${num.toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try { return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return dateStr; }
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
  toastTimeout = setTimeout(() => toast.classList.add('hidden'), 4000);
}