'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import type { Receipt, Filters, AppNotification } from '@/types';

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
  markNotificationsRead: () => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [expenses, setExpenses] = useState<Receipt[]>([]);
  const [budget, setBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ months: 3, category: 'All', sort: 'newest' });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { loadProfile, loadReceipts } = await import('@/app/actions/db');
      const [profile, receipts] = await Promise.all([loadProfile(), loadReceipts(3)]);
      setBudget(profile?.budget ?? 0);
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
      setLoading(false);
    }
  }, [status, loadData]);

  const addReceipt = useCallback((receipt: Receipt) => {
    setExpenses((prev) => [receipt, ...prev]);
    addNotification(`Added new receipt from ${receipt.merchant} for ${receipt.currency} ${receipt.total.toFixed(2)}`);
  }, [addNotification]);

  const removeReceipt = useCallback(async (id: string) => {
    const { deleteReceipt } = await import('@/app/actions/db');
    await deleteReceipt(id);
    setExpenses((prev) => {
      const receipt = prev.find((e) => e.id === id);
      if (receipt) {
        addNotification(`Removed receipt from ${receipt.merchant}`);
      }
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

  const value = useMemo(() => ({
    expenses,
    budget,
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
    markNotificationsRead
  }), [expenses, budget, loading, error, filters, notifications, loadData, addReceipt, removeReceipt, clearAllReceipts, updateBudget, markNotificationsRead]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
