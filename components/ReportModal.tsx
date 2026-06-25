'use client';

import { useState, useEffect } from 'react';
import type { Receipt, SpendingAnalysis, InsightsTotals } from '@/types';
import { CATEGORY_COLORS, ITEM_CAT_COLORS } from '@/types';

interface ReportModalProps {
  expenses: Receipt[];
  budget: number;
  onClose: () => void;
}

function formatAmount(amount: number, currency?: string): string {
  const num = Number(amount) || 0;
  if (currency && currency !== 'USD') return `${num.toFixed(2)} ${currency}`;
  return `$${num.toFixed(2)}`;
}

function escHtml(str: unknown): string {
  return String(str ?? '');
}

export default function ReportModal({ expenses, budget, onClose }: ReportModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<SpendingAnalysis | null>(null);
  const [totals, setTotals] = useState<InsightsTotals | null>(null);

  // Fetch on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expenses, monthlyBudget: budget || null }),
        });
        const data = await res.json() as { success: boolean; error?: string; analysis?: SpendingAnalysis; totals?: InsightsTotals };
        if (!res.ok || data.success === false) throw new Error(data.error ?? `Request failed (${res.status})`);
        setAnalysis(data.analysis!);
        setTotals(data.totals!);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scoreColor = analysis
    ? analysis.score >= 70 ? 'var(--positive)' : analysis.score >= 40 ? 'var(--warning)' : 'var(--danger)'
    : 'var(--accent)';
  const scoreDesc = analysis
    ? analysis.score >= 70 ? 'Great spending habits!' : analysis.score >= 40 ? 'Room for improvement' : 'Needs attention'
    : '';

  return (
    <div
      className="modal-overlay"
      id="reportModal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Monthly Report</h2>
          <button className="modal-close" id="closeModal" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" id="reportBody">
          {loading && (
            <div className="report-loading">
              <div className="spinner" />
              <p>Analyzing your spending patterns<span className="dots" /></p>
            </div>
          )}

          {error && (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: 8 }}>Failed to load report</p>
              <p style={{ color: 'var(--ink-muted)', fontSize: 13 }}>{error}</p>
            </div>
          )}

          {analysis && (
            <>
              {/* Score */}
              <div className="report-score">
                <div className="score-circle" style={{ background: scoreColor }}>
                  <span className="score-num">{analysis.score ?? '—'}</span>
                </div>
                <div className="score-info">
                  <div className="score-label">Finance Score</div>
                  <div className="score-desc">{scoreDesc}</div>
                  {analysis.topInsight && (
                    <div className="score-insight">&ldquo;{analysis.topInsight}&rdquo;</div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="report-summary">{analysis.summary}</div>

              {/* Essential / Optional split */}
              {(analysis.unnecessarySpend > 0 || analysis.essentialSpend > 0) && (
                <div className="spend-split">
                  <div className="spend-split-item essential-spend">
                    <span className="spend-split-label">Essential</span>
                    <span className="spend-split-value">{formatAmount(analysis.essentialSpend)}</span>
                  </div>
                  <div className="spend-split-item optional-spend">
                    <span className="spend-split-label">Optional</span>
                    <span className="spend-split-value">{formatAmount(analysis.unnecessarySpend)}</span>
                  </div>
                </div>
              )}

              {/* By Store Category */}
              {analysis.receiptCategoryBreakdown?.length > 0 && (
                <div className="report-section">
                  <div className="report-section-title">By Store Category</div>
                  {analysis.receiptCategoryBreakdown.map((c) => (
                    <div className="cat-row" key={c.category}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: CATEGORY_COLORS[c.category] ?? '#b2bec3', flexShrink: 0, marginTop: 4 }} />
                      <div className="cat-bar-wrap">
                        <div className="cat-bar-header">
                          <span className="cat-name">{c.category}</span>
                          <span className="cat-pct">{formatAmount(c.amount)} · {(c.percent ?? 0).toFixed(0)}%</span>
                        </div>
                        <div className="cat-bar">
                          <div className="cat-bar-fill" style={{ width: `${Math.min(c.percent ?? 0, 100)}%`, background: CATEGORY_COLORS[c.category] ?? '#b2bec3' }} />
                        </div>
                        {c.tip && <div className="cat-tip">{c.tip}</div>}
                      </div>
                      <span className={`status-badge status-${c.status ?? 'normal'}`}>{c.status ?? 'ok'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* By Item Type */}
              {analysis.itemCategoryBreakdown?.length > 0 && (
                <div className="report-section">
                  <div className="report-section-title">By Item Type</div>
                  {analysis.itemCategoryBreakdown.map((c) => (
                    <div className="cat-row" key={c.category}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: ITEM_CAT_COLORS[c.category] ?? '#b2bec3', flexShrink: 0, marginTop: 4 }} />
                      <div className="cat-bar-wrap">
                        <div className="cat-bar-header">
                          <span className="cat-name">{c.category}</span>
                          <span className="cat-pct">{formatAmount(c.amount)} · {(c.percent ?? 0).toFixed(0)}%</span>
                        </div>
                        <div className="cat-bar">
                          <div className="cat-bar-fill" style={{ width: `${Math.min(c.percent ?? 0, 100)}%`, background: ITEM_CAT_COLORS[c.category] ?? '#b2bec3' }} />
                        </div>
                        {c.insight && <div className="cat-tip">{c.insight}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Top Spend Items */}
              {analysis.topSpendItems?.length > 0 && (
                <div className="report-section">
                  <div className="report-section-title">Top Spend Items</div>
                  {analysis.topSpendItems.map((item, i) => (
                    <div className="top-item-row" key={i}>
                      <div className="top-item-info">
                        <span className="top-item-name">{item.name}</span>
                        {item.alternative && <span className="top-item-alt">💡 {item.alternative}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`essential-badge ${item.isEssential ? 'essential' : 'non-essential'}`}>
                          {item.isEssential ? 'Essential' : 'Optional'}
                        </span>
                        <span className="top-item-amount">{formatAmount(item.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Saving Plan */}
              {analysis.savingPlan?.length > 0 && (
                <div className="report-section">
                  <div className="report-section-title">Your Saving Plan</div>
                  <div className="saving-plan">
                    {analysis.savingPlan.map((tip, i) => (
                      <div className="saving-item" key={i}>
                        <div className="saving-num">{i + 1}</div>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget Allocation */}
              {analysis.budgetAllocation && Object.keys(analysis.budgetAllocation).length > 0 && (
                <div className="report-section">
                  <div className="report-section-title">Ideal 50/30/20 Budget Split</div>
                  <div className="budget-allocation">
                    {Object.entries(analysis.budgetAllocation).map(([key, val], i) => (
                      <div className={`budget-alloc-card ${['needs', 'wants', 'savings'][i] ?? 'needs'}`} key={key}>
                        <div className="alloc-label">{key}</div>
                        <div className="alloc-value">{formatAmount(val)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly Target */}
              {analysis.weeklyTarget ? (
                <div className="quick-tip" style={{ marginTop: 0 }}>
                  <span className="tip-icon">🎯</span>
                  <p className="tip-text">
                    Aim to spend <strong>{formatAmount(analysis.weeklyTarget)}/week</strong> to stay on track.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
