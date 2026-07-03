'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/components/DataProvider';
import { getCurrencySymbol } from '@/lib/currencies';
import { convert } from '@/lib/exchangeRates';

/**
 * ExchangeRateBanner
 *
 * Shown at the top of the dashboard layout whenever the user's display
 * currency differs from the most common receipt currency in their data.
 * Displays the live conversion rate, last-updated time, and a refresh button.
 */
export function ExchangeRateBanner() {
  const {
    expenses,
    currency,
    currencySymbol,
    rates,
    ratesLoading,
    ratesLastUpdated,
    ratesError,
    refreshRates,
  } = useData();

  const [dismissed, setDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Find the most common source currency across all receipts
  const sourceCurrency = useMemo(() => {
    if (expenses.length === 0) return null;
    const freq: Record<string, number> = {};
    expenses.forEach(e => {
      const c = (e.currency || 'USD').toUpperCase();
      freq[c] = (freq[c] || 0) + 1;
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  }, [expenses]);

  // Don't render if:
  // - dismissed by user
  // - no receipts
  // - source currency == display currency (no conversion happening)
  // - rates not loaded yet and no error
  if (dismissed || !sourceCurrency) return null;
  if (sourceCurrency === currency.toUpperCase() && !ratesError) return null;
  if (Object.keys(rates).length === 0 && !ratesError && !ratesLoading) return null;

  // Compute the rate: 1 sourceCurrency = X displayCurrency
  const rate = Object.keys(rates).length > 0
    ? convert(1, sourceCurrency, currency, rates)
    : null;

  const fromSymbol = getCurrencySymbol(sourceCurrency);
  const toSymbol = currencySymbol;
  const updatedTime = ratesLastUpdated
    ? ratesLastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  async function handleRefresh() {
    setRefreshing(true);
    // Clear localStorage cache so fetchRates fetches fresh data
    try { localStorage.removeItem('lekha_fx_rates_v1'); } catch {}
    await refreshRates();
    setRefreshing(false);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: 'linear-gradient(135deg, rgba(45,212,191,0.08), rgba(59,130,246,0.08))',
        borderBottom: '1px solid rgba(45,212,191,0.18)',
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        fontSize: 13,
      }}
    >
      {/* Live indicator dot */}
      {!ratesLoading && !ratesError && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 6px rgba(34,197,94,0.6)',
              display: 'inline-block',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Live Rate
          </span>
        </span>
      )}

      {ratesLoading && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontWeight: 500 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, animation: 'spin 1s linear infinite' }}>autorenew</span>
          Fetching live exchange rates…
        </span>
      )}

      {ratesError && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f87171' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
          Rates unavailable — showing original amounts. {ratesError}
        </span>
      )}

      {/* Rate display */}
      {rate !== null && !ratesError && !ratesLoading && (
        <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
          Converting receipts from{' '}
          <strong style={{ color: '#2dd4bf' }}>{sourceCurrency}</strong>
          {' '}→{' '}
          <strong style={{ color: '#60a5fa' }}>{currency}</strong>
          {' • '}
          <span style={{ fontVariantNumeric: 'tabular-nums', color: '#fff', fontWeight: 700 }}>
            {fromSymbol}1 = {toSymbol}{rate.toFixed(4)}
          </span>
          {updatedTime && (
            <span style={{ color: '#64748b', marginLeft: 6, fontSize: 12 }}>
              (updated {updatedTime})
            </span>
          )}
        </span>
      )}

      {/* Spacer */}
      <span style={{ flex: 1 }} />

      {/* Refresh */}
      {!ratesLoading && (
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh exchange rates"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'transparent', border: '1px solid rgba(45,212,191,0.25)',
            borderRadius: 6, padding: '3px 10px',
            color: '#2dd4bf', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', transition: 'opacity .15s',
            opacity: refreshing ? 0.5 : 1,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>refresh</span>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      )}

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        title="Dismiss"
        aria-label="Dismiss exchange rate banner"
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#475569', display: 'flex', alignItems: 'center', padding: 2,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
      </button>

      {/* Pulse + spin keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
