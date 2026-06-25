'use client';

import type { Receipt } from '@/types';
import { ITEM_CAT_COLORS } from '@/types';

interface ItemsTableProps {
  expenses: Receipt[];
}

function escHtml(str: unknown): string {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatAmount(amount: number, currency?: string): string {
  const num = Number(amount) || 0;
  if (currency && currency !== 'USD') return `${num.toFixed(2)} ${currency}`;
  return `$${num.toFixed(2)}`;
}

export default function ItemsTable({ expenses }: ItemsTableProps) {
  if (expenses.length === 0) return null;

  const allItems: Array<{
    name: string;
    amount: number;
    quantity: number;
    category: string;
    merchant: string;
    currency: string;
  }> = [];

  for (const exp of expenses) {
    for (const item of exp.items ?? []) {
      allItems.push({
        name: item.name,
        amount: item.amount,
        quantity: item.quantity || 1,
        category: item.itemCategory ?? 'Other',
        merchant: exp.merchant,
        currency: exp.currency,
      });
    }
  }

  if (allItems.length === 0) return null;
  allItems.sort((a, b) => b.amount - a.amount);

  return (
    <section className="items-section" id="itemsSection">
      <h2 className="section-title">All Items</h2>
      <div id="itemsTable">
        <table className="items-tbl">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Store</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map((item, i) => (
              <tr key={i}>
                <td className="item-name-cell">
                  <span className="item-dot" style={{ background: ITEM_CAT_COLORS[item.category] ?? '#b2bec3' }} />
                  {item.name}
                  {item.quantity > 1 && <span className="item-qty">×{item.quantity}</span>}
                </td>
                <td><span className="item-cat-tag">{item.category}</span></td>
                <td className="item-merchant">{item.merchant}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatAmount(item.amount, item.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
