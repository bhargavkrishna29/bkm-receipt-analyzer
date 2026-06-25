'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { Receipt, Filters, QuickInsights } from '@/types';
import { CATEGORY_COLORS, ITEM_CAT_COLORS } from '@/types';

import LoadingOverlay from '@/components/LoadingOverlay';
import AuthScreen from '@/components/AuthScreen';
import StatsBar from '@/components/StatsBar';
import DonutChart from '@/components/DonutChart';
import ItemsTable from '@/components/ItemsTable';
import UploadZone from '@/components/UploadZone';
import ReceiptsList from '@/components/ReceiptsList';
import BudgetModal from '@/components/BudgetModal';
import ReportModal from '@/components/ReportModal';

// ── Toast hook ─────────────────────────────────────────────────────────────────
function useToast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const toastTimeout = useMemo(() => ({ ref: null as ReturnType<typeof setTimeout> | null }), []);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    if (toastTimeout.ref) clearTimeout(toastTimeout.ref);
    toastTimeout.ref = setTimeout(() => setVisible(false), 4000);
  }, [toastTimeout]);

  return { message, visible, showToast };
}

// ── Filter & sort helper ───────────────────────────────────────────────────────
function applyFilters(expenses: Receipt[], filters: Filters): Receipt[] {
  let filtered = [...expenses];

  if (filters.months === 1) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 1);
    const cutoffMs = cutoff.getTime();
    filtered = filtered.filter((e) => e.addedAt >= cutoffMs);
  }

  if (filters.category !== 'All') {
    filtered = filtered.filter((e) => (e.receiptCategory ?? 'Other') === filters.category);
  }

  filtered.sort((a, b) => {
    if (filters.sort === 'newest') return b.addedAt - a.addedAt;
    if (filters.sort === 'oldest') return a.addedAt - b.addedAt;
    if (filters.sort === 'high') return b.total - a.total;
    if (filters.sort === 'low') return a.total - b.total;
    return 0;
  });

  return filtered;
}

export default function SpendwisePage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Receipt[]>([]);
  const [budget, setBudget] = useState(0);
  const [filters, setFilters] = useState<Filters>({ months: 3, category: 'All', sort: 'newest' });
  const [quickTip, setQuickTip] = useState<QuickInsights | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const { message: toastMessage, visible: toastVisible, showToast } = useToast();

  const displayExpenses = useMemo(() => applyFilters(expenses, filters), [expenses, filters]);

  // ── Auth state listener ──────────────────────────────────────────────────────
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    (async () => {
      const { observeAuthState } = await import('@/lib/auth');
      const { saveProfileData, loadProfile, loadReceipts } = await import('@/lib/firestore');

      unsubscribe = observeAuthState(async (firebaseUser) => {
        setAuthLoading(false);

        if (firebaseUser) {
          setUser(firebaseUser);
          try {
            showToast('Loading your receipts…');
            await saveProfileData({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
            });
            const [profile, receipts] = await Promise.all([loadProfile(), loadReceipts(3)]);
            setBudget(profile?.budget ?? 0);
            setExpenses(receipts);
            showToast(`Welcome back! ${receipts.length} receipt${receipts.length !== 1 ? 's' : ''} loaded.`);
          } catch (err) {
            showToast('⚠️ ' + (err as Error).message);
          }
        } else {
          setUser(null);
          setExpenses([]);
          setBudget(0);
        }
      });
    })();

    return () => { unsubscribe?.(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleReceiptAdded(receipt: Receipt) {
    setExpenses((prev) => [receipt, ...prev]);
  }

  async function handleRemove(id: string) {
    try {
      const { deleteReceipt } = await import('@/lib/firestore');
      await deleteReceipt(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      showToast('Receipt removed.');
    } catch (err) {
      showToast('❌ Failed to remove: ' + (err as Error).message);
    }
  }

  async function handleClearAll() {
    if (!confirm('Remove all receipts? This cannot be undone.')) return;
    try {
      const { deleteReceipt } = await import('@/lib/firestore');
      await Promise.all(expenses.map((e) => deleteReceipt(e.id)));
      setExpenses([]);
      setQuickTip(null);
      showToast('All receipts cleared.');
    } catch (err) {
      showToast('❌ ' + (err as Error).message);
    }
  }

  async function handleSaveBudget(val: number) {
    try {
      const { saveBudget } = await import('@/lib/firestore');
      await saveBudget(val);
      setBudget(val);
      showToast(`Budget set to ${val.toFixed(2)}`);
    } catch (err) {
      showToast('❌ Failed to save budget: ' + (err as Error).message);
    }
  }

  async function handleSignOut() {
    const { signOut } = await import('@/lib/auth');
    await signOut();
  }

  // ── Chart data ────────────────────────────────────────────────────────────────
  const receiptCatEntries = useMemo<[string, number][]>(() => {
    const map: Record<string, number> = {};
    for (const e of displayExpenses) {
      const cat = e.receiptCategory ?? 'Other';
      map[cat] = (map[cat] ?? 0) + e.total;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [displayExpenses]);

  const itemCatEntries = useMemo<[string, number][]>(() => {
    const map: Record<string, number> = {};
    for (const exp of displayExpenses) {
      for (const item of exp.items ?? []) {
        const cat = item.itemCategory ?? 'Other';
        map[cat] = (map[cat] ?? 0) + (Number(item.amount) || 0);
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [displayExpenses]);

  const receiptTotal = useMemo(() => receiptCatEntries.reduce((s, [, v]) => s + v, 0), [receiptCatEntries]);
  const itemTotal = useMemo(() => itemCatEntries.reduce((s, [, v]) => s + v, 0), [itemCatEntries]);

  const hasExpenses = displayExpenses.length > 0;
  const initials = user ? (user.displayName ?? user.email ?? '?')[0].toUpperCase() : '?';
  const displayName = user ? (user.displayName ?? user.email?.split('@')[0] ?? '') : '';
  const showEmailVerifyNotice = user && !user.emailVerified && user.providerData[0]?.providerId === 'password';

  // ── Render ────────────────────────────────────────────────────────────────────
  if (authLoading) return <LoadingOverlay />;
  if (!user) return (
    <>
      <AuthScreen onToast={showToast} />
      {toastVisible && (
        <div className="toast"><span>{toastMessage}</span></div>
      )}
    </>
  );

  return (
    <>
      {/* Main App */}
      <div className="app-shell" id="appShell">
        <header className="header">
          <div className="header-inner">
            <div className="logo">
              <span className="logo-icon">◈</span>
              <span className="logo-text">Spendwise</span>
            </div>
            <div className="header-actions">
              <div className="user-info" id="userInfo">
                <div className="user-avatar" id="userAvatar">{initials}</div>
                <span className="user-name" id="userName">{displayName}</span>
              </div>
              <button className="btn-ghost" id="setBudgetBtn" onClick={() => setShowBudgetModal(true)}>
                Set Budget
              </button>
              <button
                className="btn-primary"
                id="getInsightsBtn"
                disabled={!hasExpenses}
                onClick={() => setShowReportModal(true)}
              >
                <span>Full Report</span>
                <span className="receipt-count" id="receiptCountBadge">{displayExpenses.length}</span>
              </button>
              <button className="btn-ghost btn-signout" id="signOutBtn" title="Sign out" onClick={handleSignOut}>
                ↪ Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Email verification notice */}
        {showEmailVerifyNotice && (
          <div className="verify-notice" id="verifyNotice">
            📧 Please verify your email address to ensure full access.
            <button className="btn-text" id="resendNoticeBtn" onClick={async () => {
              const { resendVerificationEmail } = await import('@/lib/auth');
              try { await resendVerificationEmail(); showToast('Verification email resent ✓'); }
              catch (err) { showToast('Failed to resend: ' + (err as Error).message); }
            }}>
              Resend email
            </button>
          </div>
        )}

        <main className="main">
          <UploadZone
            expenses={expenses}
            onReceiptAdded={handleReceiptAdded}
            onQuickTip={setQuickTip}
            onToast={showToast}
          />

          {hasExpenses && <StatsBar expenses={displayExpenses} budget={budget} />}

          {/* Charts */}
          {hasExpenses && receiptTotal > 0 && (
            <section className="chart-section" id="chartSection">
              <div className="chart-grid">
                <DonutChart
                  canvasId="donutChart"
                  legendId="chartLegend"
                  title="By Store Type"
                  entries={receiptCatEntries}
                  total={receiptTotal}
                  colorMap={CATEGORY_COLORS}
                />
                <DonutChart
                  canvasId="itemDonutChart"
                  legendId="itemChartLegend"
                  title="By Item Type"
                  entries={itemCatEntries}
                  total={itemTotal}
                  colorMap={ITEM_CAT_COLORS}
                />
              </div>
            </section>
          )}

          <ItemsTable expenses={displayExpenses} />

          {/* Quick Tip */}
          {quickTip?.savingOpportunity && (
            <div className="quick-tip" id="quickTip">
              <span className="tip-icon">💡</span>
              <p className="tip-text" id="tipText">{quickTip.savingOpportunity}</p>
            </div>
          )}

          <ReceiptsList
            expenses={displayExpenses}
            filters={filters}
            onFilterChange={(partial) => setFilters((prev) => ({ ...prev, ...partial }))}
            onRemove={handleRemove}
            onClearAll={handleClearAll}
          />
        </main>
      </div>

      {/* Modals */}
      {showBudgetModal && (
        <BudgetModal
          currentBudget={budget}
          onSave={handleSaveBudget}
          onClose={() => setShowBudgetModal(false)}
        />
      )}
      {showReportModal && (
        <ReportModal
          expenses={displayExpenses}
          budget={budget}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Toast */}
      {toastVisible && (
        <div className="toast"><span>{toastMessage}</span></div>
      )}
    </>
  );
}
