/**
 * lib/exchangeRates.ts
 *
 * Fetches live currency exchange rates from open.er-api.com (no API key needed).
 * All rates are returned relative to USD as base.
 * Results are cached in localStorage for 1 hour.
 */

const CACHE_KEY = 'lekha_fx_rates_v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface RatesCache {
  rates: Record<string, number>;
  timestamp: number;
}

/**
 * Fetches exchange rates, using a local cache to avoid hammering the API.
 * Returns rates relative to USD (e.g., { SEK: 10.5, INR: 83.2, USD: 1 }).
 */
export async function fetchRates(): Promise<{
  rates: Record<string, number>;
  lastUpdated: Date;
  fromCache: boolean;
}> {
  // ── Try cache ────────────────────────────────────────────────────────────
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: RatesCache = JSON.parse(raw);
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
          return {
            rates: cached.rates,
            lastUpdated: new Date(cached.timestamp),
            fromCache: true,
          };
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  // ── Fetch fresh ──────────────────────────────────────────────────────────
  const res = await fetch('https://open.er-api.com/v6/latest/USD', {
    next: { revalidate: 3600 }, // Next.js cache hint
  });
  if (!res.ok) throw new Error(`Exchange rate API returned ${res.status}`);
  const json = await res.json();

  const rates: Record<string, number> = json.rates ?? {};

  if (typeof localStorage !== 'undefined') {
    try {
      const cache: RatesCache = { rates, timestamp: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      // storage might be full — ignore
    }
  }

  return { rates, lastUpdated: new Date(), fromCache: false };
}

/**
 * Converts `amount` from `fromCurrency` to `toCurrency` using a rates map
 * where all values are relative to USD.
 *
 * Formula: amount_in_to = amount_in_from × (rateToUSD_to / rateToUSD_from)
 */
export function convert(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) return amount;

  const fromRate = rates[from];
  const toRate = rates[to];

  // If either currency is unknown, return unchanged
  if (!fromRate || !toRate) return amount;

  return amount * (toRate / fromRate);
}
