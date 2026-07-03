'use client';

import { useData } from '@/components/DataProvider';
import { useMemo } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── tiny helpers ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = '#2dd4bf' }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md flex flex-col gap-1 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="text-2xl font-bold text-on-surface" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      {sub && <p className="text-xs text-on-surface-variant">{sub}</p>}
      <div className="h-0.5 w-12 rounded-full mt-1" style={{ background: accent }} />
    </div>
  );
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ReportsPage() {
  const { expenses, budget, currencySymbol, convertAmount } = useData();

  // ── Core aggregations ─────────────────────────────────────────────────────
  const totalSpent = expenses.reduce((s, e) => s + convertAmount(e.total || 0, e.currency), 0);
  const receiptsCount = expenses.length;
  const avgReceiptValue = receiptsCount > 0 ? totalSpent / receiptsCount : 0;
  const totalTax = expenses.reduce((s, e) => s + convertAmount(e.taxAmount || 0, e.currency), 0);
  const totalDiscount = expenses.reduce((s, e) => s + convertAmount(e.discountAmount || 0, e.currency), 0);
  const budgetUsagePct = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

  // ── Derived analytics ─────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    if (expenses.length === 0) return null;

    // Per-store breakdown
    const storeMap: Record<string, { total: number; visits: number; transactions: number[]; items: string[] }> = {};
    expenses.forEach(e => {
      const m = e.merchant || 'Unknown';
      if (!storeMap[m]) storeMap[m] = { total: 0, visits: 0, transactions: [], items: [] };
      const convertedTotal = convertAmount(e.total || 0, e.currency);
      storeMap[m].total += convertedTotal;
      storeMap[m].visits += 1;
      storeMap[m].transactions.push(convertedTotal);
      (e.items || []).forEach(i => storeMap[m].items.push(i.name));
    });
    const storeStats = Object.entries(storeMap)
      .map(([name, d]) => ({
        name,
        total: d.total,
        visits: d.visits,
        avg: d.total / d.visits,
        max: Math.max(...d.transactions),
        min: Math.min(...d.transactions),
        share: totalSpent > 0 ? (d.total / totalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // All items flat
    const allItems = expenses.flatMap(e =>
      (e.items || []).map(i => ({
        name: i.name,
        amount: convertAmount(i.amount, e.currency),
        category: i.itemCategory || 'Other',
        merchant: e.merchant || 'Unknown',
        quantity: i.quantity || 1,
      }))
    );

    // Aggregated items (group by name)
    const itemMap: Record<string, { total: number; count: number; category: string; merchant: string }> = {};
    allItems.forEach(i => {
      if (!itemMap[i.name]) itemMap[i.name] = { total: 0, count: 0, category: i.category, merchant: i.merchant };
      itemMap[i.name].total += i.amount;
      itemMap[i.name].count += 1;
    });
    const aggregatedItems = Object.entries(itemMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.total - a.total);

    const maxItem = aggregatedItems[0] || null;
    const minItem = aggregatedItems.length > 0 ? aggregatedItems[aggregatedItems.length - 1] : null;

    // Category breakdown
    const catMap: Record<string, number> = {};
    expenses.forEach(e => {
      const c = e.receiptCategory || 'Other';
      catMap[c] = (catMap[c] || 0) + convertAmount(e.total || 0, e.currency);
    });
    const categoryStats = Object.entries(catMap)
      .map(([name, total]) => ({ name, total, pct: totalSpent > 0 ? (total / totalSpent) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);

    // Day-of-week spending
    const dayTotals: number[] = [0, 0, 0, 0, 0, 0, 0];
    expenses.forEach(e => {
      const d = new Date(e.addedAt).getDay();
      dayTotals[d] += convertAmount(e.total || 0, e.currency);
    });
    const maxDay = Math.max(...dayTotals, 1);

    // Monthly trend (last 6 months)
    const monthMap: Record<string, number> = {};
    expenses.forEach(e => {
      const d = new Date(e.addedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + convertAmount(e.total || 0, e.currency);
    });
    const monthTrend = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, total]) => {
        const [yr, mo] = key.split('-');
        const label = new Date(Number(yr), Number(mo) - 1, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
        return { label, total };
      });
    const maxMonth = Math.max(...monthTrend.map(m => m.total), 1);

    return { storeStats, aggregatedItems, maxItem, minItem, categoryStats, dayTotals, maxDay, monthTrend, maxMonth };
  }, [expenses, totalSpent, convertAmount]);

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const downloadReport = () => {
    if (expenses.length === 0) { alert('No data to export.'); return; }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Lekha Tracker — Financial Report', 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}   |   Total: ${currencySymbol}${totalSpent.toFixed(2)}   |   Receipts: ${receiptsCount}`, 14, 24);
    autoTable(doc, {
      startY: 30,
      head: [['Date', 'Merchant', 'Category', 'Total', 'Tax', 'Discount']],
      body: expenses.map(e => [
        new Date(e.addedAt).toLocaleDateString(),
        e.merchant || 'Unknown',
        e.receiptCategory || 'Other',
        `${currencySymbol}${convertAmount(e.total || 0, e.currency).toFixed(2)}`,
        `${currencySymbol}${convertAmount(e.taxAmount || 0, e.currency).toFixed(2)}`,
        `${currencySymbol}${convertAmount(e.discountAmount || 0, e.currency).toFixed(2)}`,
      ]),
    });
    if (analytics?.storeStats?.length) {
      const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 100;
      doc.setFontSize(14);
      doc.text('Store Breakdown', 14, finalY + 12);
      autoTable(doc, {
        startY: finalY + 18,
        head: [['Store', 'Visits', 'Total Spend', 'Avg/Visit', 'Max', 'Min']],
        body: analytics.storeStats.map(s => [
          s.name, s.visits,
          `${currencySymbol}${s.total.toFixed(2)}`,
          `${currencySymbol}${s.avg.toFixed(2)}`,
          `${currencySymbol}${s.max.toFixed(2)}`,
          `${currencySymbol}${s.min.toFixed(2)}`,
        ]),
      });
    }
    doc.save('lekha_report.pdf');
  };

  const accentColors = ['#2dd4bf', '#3b82f6', '#a78bfa', '#f59e0b', '#f472b6', '#22c55e'];

  if (expenses.length === 0) {
    return (
      <div className="flex-1 p-margin-mobile md:p-margin-desktop overflow-y-auto flex flex-col items-center justify-center gap-4 text-on-surface-variant">
        <span className="material-symbols-outlined text-[64px] opacity-30">bar_chart</span>
        <p className="text-lg font-medium">No receipts yet — upload your first receipt to see reports.</p>
        <Link href="/receipts" className="px-6 py-2 rounded-full text-sm font-semibold" style={{ background: 'linear-gradient(135deg,#2dd4bf,#3b82f6)', color: '#0a1628' }}>
          Upload Receipt
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 p-margin-mobile md:p-margin-desktop overflow-y-auto pb-16">
      {/* ── Header ── */}
      <div className="mb-lg flex justify-between items-end flex-wrap gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Financial Reports</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
            Deep-dive into your spending patterns, store habits, and item-level insights.
          </p>
        </div>
        <button
          onClick={downloadReport}
          className="flex items-center gap-xs px-md py-sm rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#2dd4bf,#3b82f6)', color: '#0a1628' }}
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export PDF
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-md mb-lg">
        <StatCard label="Total Spent" value={`${currencySymbol}${totalSpent.toFixed(2)}`} sub={budget > 0 ? `${budgetUsagePct.toFixed(1)}% of budget` : undefined} accent="#2dd4bf" />
        <StatCard label="Receipts" value={String(receiptsCount)} sub="processed" accent="#3b82f6" />
        <StatCard label="Avg / Receipt" value={`${currencySymbol}${avgReceiptValue.toFixed(2)}`} accent="#a78bfa" />
        <StatCard label="Total Tax Paid" value={`${currencySymbol}${totalTax.toFixed(2)}`} accent="#f59e0b" />
        <StatCard label="Total Savings" value={`${currencySymbol}${totalDiscount.toFixed(2)}`} sub="discounts applied" accent="#22c55e" />
        <StatCard label="Stores Visited" value={String(analytics?.storeStats.length ?? 0)} accent="#f472b6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">

        {/* ── Store Breakdown Table ── */}
        <div className="lg:col-span-12 bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="p-md border-b border-outline-variant flex items-center justify-between">
            <h3 className="font-label-md text-label-md font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">storefront</span>
              Spending by Store
            </h3>
            <span className="text-xs text-on-surface-variant">{analytics?.storeStats.length} stores</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  {['Store', 'Visits', 'Total Spend', 'Share', 'Avg / Visit', 'Max Transaction', 'Min Transaction'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-on-surface-variant whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics?.storeStats.map((s, idx) => (
                  <tr key={s.name} className="border-b border-outline-variant/40 hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: `${accentColors[idx % accentColors.length]}18`, color: accentColors[idx % accentColors.length] }}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-on-surface">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{s.visits}</td>
                    <td className="px-4 py-3 font-bold text-on-surface" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {currencySymbol}{s.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${s.share}%`, background: accentColors[idx % accentColors.length] }} />
                        </div>
                        <span className="text-xs text-on-surface-variant">{s.share.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant" style={{ fontVariantNumeric: 'tabular-nums' }}>{currencySymbol}{s.avg.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(248,113,113,0.10)', color: '#f87171' }}>
                        {currencySymbol}{s.max.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(34,197,94,0.10)', color: '#22c55e' }}>
                        {currencySymbol}{s.min.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Max / Min Items ── */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm">
          <h3 className="font-label-md text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">price_check</span>
            Item Extremes
          </h3>
          <div className="space-y-3">
            {/* Most expensive item */}
            {analytics?.maxItem && (
              <div className="rounded-lg p-3" style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#f87171' }}>Most Expensive</span>
                </div>
                <p className="font-medium text-on-surface text-sm truncate">{analytics.maxItem.name}</p>
                <p className="text-xs text-on-surface-variant">{analytics.maxItem.merchant} · {analytics.maxItem.category}</p>
                <p className="text-xl font-bold mt-1" style={{ color: '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                  {currencySymbol}{analytics.maxItem.total.toFixed(2)}
                </p>
              </div>
            )}
            {/* Least expensive item */}
            {analytics?.minItem && (
              <div className="rounded-lg p-3" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#22c55e' }}>Least Expensive</span>
                </div>
                <p className="font-medium text-on-surface text-sm truncate">{analytics.minItem.name}</p>
                <p className="text-xs text-on-surface-variant">{analytics.minItem.merchant} · {analytics.minItem.category}</p>
                <p className="text-xl font-bold mt-1" style={{ color: '#22c55e', fontVariantNumeric: 'tabular-nums' }}>
                  {currencySymbol}{analytics.minItem.total.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Category Breakdown ── */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm">
          <h3 className="font-label-md text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">category</span>
            Spend by Category
          </h3>
          <div className="space-y-3">
            {analytics?.categoryStats.map((c, idx) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-on-surface truncate max-w-[55%]">{c.name}</span>
                  <span className="text-on-surface-variant font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {currencySymbol}{c.total.toFixed(2)} <span className="text-xs font-normal opacity-60">({c.pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${c.pct}%`, background: accentColors[idx % accentColors.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Day-of-Week Pattern ── */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm">
          <h3 className="font-label-md text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
            Spend by Day of Week
          </h3>
          <div className="flex items-end justify-between h-28 gap-1 mb-2">
            {analytics?.dayTotals.map((val, idx) => {
              const pct = analytics.maxDay > 0 ? (val / analytics.maxDay) * 100 : 0;
              const isMax = val === analytics.maxDay && val > 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md transition-all duration-700"
                    style={{
                      height: `${Math.max(pct, 4)}%`,
                      background: isMax ? 'linear-gradient(180deg,#2dd4bf,#3b82f6)' : 'rgba(99,102,241,0.25)',
                    }}
                    title={`${currencySymbol}${val.toFixed(2)}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between">
            {DAYS.map(d => (
              <span key={d} className="flex-1 text-center text-[10px] font-medium text-on-surface-variant">{d}</span>
            ))}
          </div>
          {analytics && (
            <p className="text-xs text-on-surface-variant mt-2 text-center">
              Highest spend on <span className="font-semibold text-on-surface">{DAYS[analytics.dayTotals.indexOf(analytics.maxDay)]}</span> ({currencySymbol}{analytics.maxDay.toFixed(2)})
            </p>
          )}
        </div>

        {/* ── Monthly Trend ── */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant p-md shadow-sm">
          <h3 className="font-label-md text-label-md font-bold text-on-surface-variant uppercase tracking-wider mb-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">trending_up</span>
            Monthly Spend Trend
          </h3>
          {analytics?.monthTrend && analytics.monthTrend.length > 0 ? (
            <>
              <div className="flex items-end gap-2 h-32 mb-3">
                {analytics.monthTrend.map((m, idx) => {
                  const pct = analytics.maxMonth > 0 ? (m.total / analytics.maxMonth) * 100 : 0;
                  const isLatest = idx === analytics.monthTrend.length - 1;
                  return (
                    <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-on-surface-variant">{currencySymbol}{m.total.toFixed(0)}</span>
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${Math.max(pct, 4)}%`,
                          background: isLatest
                            ? 'linear-gradient(180deg,#2dd4bf,#3b82f6)'
                            : `${accentColors[idx % accentColors.length]}40`,
                          border: `1px solid ${accentColors[idx % accentColors.length]}50`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                {analytics.monthTrend.map(m => (
                  <span key={m.label} className="flex-1 text-center text-[10px] text-on-surface-variant">{m.label}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-32 flex items-center justify-center text-on-surface-variant text-sm">No monthly data yet</div>
          )}
        </div>

        {/* ── Top Items Table ── */}
        <div className="lg:col-span-12 bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="p-md border-b border-outline-variant flex items-center justify-between">
            <h3 className="font-label-md text-label-md font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">shopping_cart</span>
              Top Items by Total Spend
            </h3>
            <span className="text-xs text-on-surface-variant">{analytics?.aggregatedItems.length} unique items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  {['#', 'Item Name', 'Category', 'Store', 'Purchases', 'Total Spend'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics?.aggregatedItems.slice(0, 15).map((item, idx) => (
                  <tr key={item.name} className="border-b border-outline-variant/40 hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 text-on-surface-variant font-mono text-xs w-8">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-on-surface">{item.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-variant text-on-surface-variant">{item.category}</span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{item.merchant}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{item.count}×</td>
                    <td className="px-4 py-3 font-bold text-on-surface" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {currencySymbol}{item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
