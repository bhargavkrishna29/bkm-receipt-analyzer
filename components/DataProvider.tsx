'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import type { Receipt, Filters, AppNotification } from '@/types';
import { getCurrencySymbol } from '@/lib/currencies';
import { fetchRates, convert } from '@/lib/exchangeRates';

type DataContextType = {
  expenses: Receipt[];
  budget: number;
  loading: boolean;
  error: string | null;
  filters: Filters;
  notifications: AppNotification[];
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  refreshData: () => Promise<void>;
  addReceipt: (receipt: Receipt) => void;
  removeReceipt: (id: string) => Promise<void>;
  clearAllReceipts: () => Promise<void>;
  updateBudget: (val: number) => Promise<void>;
  updateCurrency: (code: string) => Promise<void>;
  markNotificationsRead: () => void;
  currency: string;
  currencySymbol: string;
  // ── Exchange rate additions ──────────────────────────────────────────────
  /** All rates relative to USD — e.g. { SEK: 10.5, INR: 83.2 } */
  rates: Record<string, number>;
  ratesLoading: boolean;
  ratesLastUpdated: Date | null;
  ratesError: string | null;
  /** Refreshes rates from the API immediately (bypasses cache) */
  refreshRates: () => Promise<void>;
  /**
   * Converts `amount` from `fromCurrency` (or 'USD' if omitted) into
   * the user's currently selected display currency.
   */
  convertAmount: (amount: number, fromCurrency?: string) => number;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [expenses, setExpenses] = useState<Receipt[]>([]);
  const [budget, setBudget] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ months: 3, category: 'All', sort: 'newest' });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // ── Exchange rates ─────────────────────────────────────────────────────
  const [rates, setRates] = useState<Record<string, number>>({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesLastUpdated, setRatesLastUpdated] = useState<Date | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const loadRates = useCallback(async () => {
    setRatesLoading(true);
    setRatesError(null);
    try {
      const { rates: r, lastUpdated } = await fetchRates();
      setRates(r);
      setRatesLastUpdated(lastUpdated);
    } catch (err) {
      setRatesError((err as Error).message);
    } finally {
      setRatesLoading(false);
    }
  }, []);

  // ── Load rates once when authenticated ──────────────────────────────────
  useEffect(() => {
    if (status === 'authenticated') {
      loadRates();
    }
  }, [status, loadRates]);

  /**
   * Convert amount from receipt's native currency → user's display currency.
   * Falls back to the original amount if rates are not loaded or currency unknown.
   */
  const convertAmount = useCallback(
    (amount: number, fromCurrency?: string): number => {
      const from = (fromCurrency ?? 'USD').toUpperCase();
      const to = currency.toUpperCase();
      if (from === to || Object.keys(rates).length === 0) return amount;
      return convert(amount, from, to, rates);
    },
    [rates, currency]
  );

  // ── Notifications ──────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('lekha_notifications');
    if (saved) {
      try { setNotifications(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lekha_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((message: string) => {
    setNotifications((prev) => [{ id: Date.now().toString(), message, time: Date.now(), read: false }, ...prev].slice(0, 50));
  }, []);

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // ── Data loading ───────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { loadProfile, loadReceipts } = await import('@/app/actions/db');
      const [profile, receipts] = await Promise.all([loadProfile(), loadReceipts(3)]);
      setBudget(profile?.budget ?? 0);
      setCurrency(profile?.currency ?? 'USD');
      setExpenses(receipts);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    } else if (status === 'unauthenticated') {
      setExpenses([]);
      setBudget(0);
      setCurrency('USD');
      setLoading(false);
    }
  }, [status, loadData]);

  // ── Receipts CRUD ──────────────────────────────────────────────────────
  const addReceipt = useCallback((receipt: Receipt) => {
    setExpenses((prev) => [receipt, ...prev]);
    addNotification(`Added new receipt from ${receipt.merchant} for ${receipt.currency} ${receipt.total.toFixed(2)}`);
  }, [addNotification]);

  const removeReceipt = useCallback(async (id: string) => {
    const { deleteReceipt } = await import('@/app/actions/db');
    await deleteReceipt(id);
    setExpenses((prev) => {
      const receipt = prev.find((e) => e.id === id);
      if (receipt) addNotification(`Removed receipt from ${receipt.merchant}`);
      return prev.filter((e) => e.id !== id);
    });
  }, [addNotification]);

  const clearAllReceipts = useCallback(async () => {
    const { deleteReceipt } = await import('@/app/actions/db');
    await Promise.all(expenses.map((e) => deleteReceipt(e.id)));
    setExpenses([]);
    addNotification(`Cleared all ${expenses.length} receipts`);
  }, [expenses, addNotification]);

  const updateBudget = useCallback(async (val: number) => {
    const { saveBudget } = await import('@/app/actions/db');
    await saveBudget(val);
    setBudget(val);
    addNotification(`Updated monthly budget to ${val}`);
  }, [addNotification]);

  const updateCurrency = useCallback(async (code: string) => {
    const { saveCurrency, saveBudget } = await import('@/app/actions/db');
    
    // Auto-convert existing budget to the new currency if rates exist
    if (code !== currency && Object.keys(rates).length > 0 && budget > 0) {
      const newBudget = convert(budget, currency, code, rates);
      const roundedBudget = Math.round(newBudget); // Clean numbers for budgets
      await saveBudget(roundedBudget);
      setBudget(roundedBudget);
    }
    
    await saveCurrency(code);
    setCurrency(code);
    addNotification(`Updated display currency to ${code}`);
  }, [currency, budget, rates, addNotification]);

  const value = useMemo(() => ({
    expenses,
    budget,
    currency,
    currencySymbol: getCurrencySymbol(currency),
    loading,
    error,
    filters,
    notifications,
    setFilters,
    refreshData: loadData,
    addReceipt,
    removeReceipt,
    clearAllReceipts,
    updateBudget,
    updateCurrency,
    markNotificationsRead,
    // Exchange rates
    rates,
    ratesLoading,
    ratesLastUpdated,
    ratesError,
    refreshRates: loadRates,
    convertAmount,
  }), [
    expenses, budget, currency, loading, error, filters, notifications,
    loadData, addReceipt, removeReceipt, clearAllReceipts, updateBudget,
    updateCurrency, markNotificationsRead,
    rates, ratesLoading, ratesLastUpdated, ratesError, loadRates, convertAmount,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
