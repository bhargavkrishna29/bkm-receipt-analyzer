'use client';

import type { Receipt, Filters } from '@/types';
import { CATEGORY_COLORS } from '@/types';

interface ReceiptsListProps {
  expenses: Receipt[];
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

function formatAmount(amount: number, currency?: string): string {
  const num = Number(amount) || 0;
  if (currency && currency !== 'USD') return `${num.toFixed(2)} ${currency}`;
  return `$${num.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function ReceiptsList({ expenses, filters, onFilterChange, onRemove, onClearAll }: ReceiptsListProps) {
  if (expenses.length === 0) return null;

  return (
    <section className="receipts-section" id="receiptsSection">
      <div className="section-header" style={{ flexWrap: 'wrap', gap: 16 }}>
        <h2 className="section-title">
          Receipts <span className="history-badge">History</span>
        </h2>
        <div className="filter-bar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            id="filterMonth"
            className="form-input"
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
            value={filters.months}
            onChange={(e) => onFilterChange({ months: parseInt(e.target.value) as 1 | 3 })}
          >
            <option value={3}>Last 3 Months</option>
            <option value={1}>Last Month</option>
          </select>
          <select
            id="filterCategory"
            className="form-input"
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
          >
            <option value="All">All Categories</option>
            <option value="Groceries">Groceries</option>
            <option value="Food & Dining">Food &amp; Dining</option>
            <option value="Transportation">Transportation</option>
            <option value="Shopping">Shopping</option>
            <option value="Entertainment">Entertainment</option>
          </select>
          <select
            id="sortReceipts"
            className="form-input"
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
            value={filters.sort}
            onChange={(e) => onFilterChange({ sort: e.target.value as Filters['sort'] })}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="high">Highest Amount</option>
            <option value="low">Lowest Amount</option>
          </select>
          <button className="btn-danger-ghost" id="clearAllBtn" onClick={onClearAll}>
            Clear all
          </button>
        </div>
      </div>
      <div className="receipts-list" id="receiptsList">
        {expenses.map((exp) => (
          <div className="receipt-item" key={exp.id} id={`receipt-${exp.id}`}>
            <div
              className="receipt-cat-dot"
              style={{ background: CATEGORY_COLORS[exp.receiptCategory] ?? '#b2bec3' }}
            />
            <div className="receipt-info">
              <div className="receipt-merchant">{exp.merchant}</div>
              <div className="receipt-meta">
                {exp.receiptCategory} · {formatDate(exp.date)} · {(exp.items ?? []).length} items
              </div>
            </div>
            <div className="receipt-amount">{formatAmount(exp.total, exp.currency)}</div>
            <button
              className="receipt-remove"
              title="Remove"
              onClick={() => onRemove(exp.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
