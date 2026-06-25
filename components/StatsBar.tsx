'use client';

import type { Receipt } from '@/types';

interface StatsBarProps {
  expenses: Receipt[];
  budget: number;
}

function formatAmount(amount: number, currency?: string): string {
  const num = Number(amount) || 0;
  if (currency && currency !== 'USD') return `${num.toFixed(2)} ${currency}`;
  return `$${num.toFixed(2)}`;
}

export default function StatsBar({ expenses, budget }: StatsBarProps) {
  if (expenses.length === 0) return null;

  const total = expenses.reduce((s, e) => s + e.total, 0);
  const totalItems = expenses.reduce((s, e) => s + (e.items ?? []).length, 0);

  const byCat: Record<string, number> = {};
  for (const e of expenses) {
    const cat = e.receiptCategory ?? 'Other';
    byCat[cat] = (byCat[cat] ?? 0) + e.total;
  }
  const topEntry = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  const topCategory = topEntry ? topEntry[0].split(' ')[0] : '—';

  const budgetLeft = budget > 0 ? budget - total : null;

  return (
    <section className="stats-bar" id="statsBar">
      <div className="stat-card">
        <span className="stat-label">Total Spent</span>
        <span className="stat-value" id="totalSpent">{formatAmount(total)}</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-card">
        <span className="stat-label">Receipts</span>
        <span className="stat-value" id="receiptCount">{expenses.length}</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-card">
        <span className="stat-label">Items Tracked</span>
        <span className="stat-value" id="totalItems">{totalItems}</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-card">
        <span className="stat-label">Top Category</span>
        <span className="stat-value" id="topCategory">{topCategory}</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-card">
        <span className="stat-label">Budget Left</span>
        <span
          className="stat-value"
          id="budgetLeft"
          style={budgetLeft !== null ? { color: budgetLeft < 0 ? 'var(--danger)' : 'var(--positive)' } : undefined}
        >
          {budgetLeft !== null ? formatAmount(budgetLeft) : '—'}
        </span>
      </div>
    </section>
  );
}
