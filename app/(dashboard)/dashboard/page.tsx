'use client';

import { useData } from '@/components/DataProvider';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { expenses, budget, currencySymbol, convertAmount } = useData();
  
  const user = session?.user;
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';


  // Filters State
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all unique categories for the filter dropdown
  const allCategories = useMemo(() => {
    const cats = new Set(expenses.map(e => e.receiptCategory || 'Other'));
    return ['All', ...Array.from(cats)].sort();
  }, [expenses]);

  // Apply Filters
  const filteredExpenses = useMemo(() => {
    const now = Date.now();
    return expenses.filter(exp => {
      // Date filter
      if (dateFilter === '30days' && (now - exp.addedAt > 30 * 24 * 60 * 60 * 1000)) return false;
      if (dateFilter === '3months' && (now - exp.addedAt > 90 * 24 * 60 * 60 * 1000)) return false;
      
      // Category filter
      if (categoryFilter !== 'All' && (exp.receiptCategory || 'Other') !== categoryFilter) return false;
      
      // Search query (items or store)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchStore = exp.merchant?.toLowerCase().includes(query);
        const matchItems = exp.items?.some(item => item.name.toLowerCase().includes(query));
        if (!matchStore && !matchItems) return false;
      }
      
      return true;
    });
  }, [expenses, dateFilter, categoryFilter, searchQuery]);

  const totalSpent = filteredExpenses.reduce((acc, exp) => acc + convertAmount(exp.total || 0, exp.currency), 0);
  const remaining = Math.max(0, budget - totalSpent);
  const avgPerReceipt = filteredExpenses.length > 0 ? totalSpent / filteredExpenses.length : 0;
  const budgetUtilization = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  
  // Sort for recent uploads
  const recentUploads = [...filteredExpenses]
    .sort((a, b) => b.addedAt - a.addedAt)
    .slice(0, 5);

  // Group by category for the chart
  const categoryTotals = filteredExpenses.reduce((acc, exp) => {
    const cat = exp.receiptCategory || 'Other';
    acc[cat] = (acc[cat] || 0) + convertAmount(exp.total || 0, exp.currency);
    return acc;
  }, {} as Record<string, number>);
  
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCatValue = topCategories.length ? Math.max(...topCategories.map(c => c[1])) : 1;

  // Group by merchant
  const merchantTotals = filteredExpenses.reduce((acc, exp) => {
    const merchant = exp.merchant || 'Unknown';
    acc[merchant] = (acc[merchant] || 0) + convertAmount(exp.total || 0, exp.currency);
    return acc;
  }, {} as Record<string, number>);

  const topMerchants = Object.entries(merchantTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxMerchantValue = topMerchants.length ? Math.max(...topMerchants.map(m => m[1])) : 1;

  // Group by items
  const itemTotals = filteredExpenses.flatMap(exp => 
    (exp.items || []).map(item => ({ ...item, convertedAmount: convertAmount(item.amount, exp.currency) }))
  ).reduce((acc, item) => {
    const name = item.name || 'Unknown Item';
    acc[name] = (acc[name] || 0) + item.convertedAmount;
    return acc;
  }, {} as Record<string, number>);

  const topItems = Object.entries(itemTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const bgColors = ['bg-secondary-container', 'bg-primary-container', 'bg-surface-tint', 'bg-tertiary-container', 'bg-outline-variant'];

  return (
    <div className="flex-1 overflow-y-auto pb-12">
      {/* Overview Header */}
      <div className="mb-lg flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Dashboard</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-base">
            Welcome back, {firstName}. Here's your financial overview.
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-sm w-full md:w-auto bg-surface-container-lowest p-2 rounded-lg border border-outline-variant shadow-sm">
          <div className="flex items-center bg-surface-variant rounded-md px-2 flex-1 md:flex-none">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant mr-1">search</span>
            <input 
              type="text" 
              placeholder="Search items, stores..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-body-sm text-on-surface w-full md:w-32 py-1.5 outline-none placeholder:text-on-surface-variant/50"
            />
          </div>
          
          <div className="h-8 w-px bg-outline-variant/50 hidden md:block mx-1"></div>
          
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-transparent border-none rounded-md py-1.5 px-2 font-body-sm text-body-sm text-on-surface focus:ring-0 outline-none cursor-pointer hover:bg-surface-variant transition-colors"
          >
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-transparent border-none rounded-md py-1.5 px-2 font-body-sm text-body-sm text-on-surface focus:ring-0 outline-none cursor-pointer hover:bg-surface-variant transition-colors"
          >
            <option value="all">All Time</option>
            <option value="3months">Last 3 Months</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>
      
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg mt-6">
        {/* Big Metric: Total Spent */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_4px_rgba(0,0,0,0.05)] p-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-xs">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Total Spent
            </h3>
            <Link
              href="/budget"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
            >
              Budget
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </Link>
          </div>

          {/* Amount */}
          <div className="flex items-baseline gap-xs mb-1">
            <span className="text-[38px] font-bold leading-none text-on-surface tracking-tight">
              {currencySymbol}{totalSpent.toFixed(2)}
            </span>
            <span className="text-sm font-medium text-on-surface-variant">/ {currencySymbol}{budget.toFixed(0)}</span>
          </div>

          {/* Remaining pill */}
          <p className="text-sm text-on-surface-variant mb-sm">
            <span className={`font-semibold ${remaining === 0 ? 'text-error' : 'text-secondary'}`}>
              {currencySymbol}{remaining.toFixed(2)}
            </span>
            {' '}remaining
          </p>

          {/* Progress bar */}
          <div className="w-full bg-surface-variant rounded-full h-2 overflow-hidden mb-1">
            <div
              className={`${
                budgetUtilization >= 100 ? 'bg-error' : budgetUtilization > 75 ? 'bg-tertiary-fixed-dim' : 'bg-primary'
              } h-2 rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-on-surface-variant mb-md">
            <span>Budget utilization</span>
            <span className={`font-semibold ${budgetUtilization >= 90 ? 'text-error' : ''}`}>
              {budgetUtilization.toFixed(1)}%
            </span>
          </div>

          {/* Mini stats row */}
          <div className="border-t border-outline-variant/40 pt-sm grid grid-cols-2 gap-xs">
            <div className="bg-surface-container rounded-lg px-sm py-xs">
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-0.5">Receipts</p>
              <p className="text-xl font-bold text-on-surface">{filteredExpenses.length}</p>
            </div>
            <div className="bg-surface-container rounded-lg px-sm py-xs">
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-0.5">Avg / Receipt</p>
              <p className="text-xl font-bold text-on-surface">{currencySymbol}{avgPerReceipt.toFixed(2)}</p>
            </div>
          </div>

          {budgetUtilization >= 100 && (
            <p className="text-[10px] text-error mt-sm font-medium flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">warning</span>
              You have exceeded your budget!
            </p>
          )}
        </div>
        
        {/* Chart: Spending by Category */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_4px_rgba(0,0,0,0.05)] p-lg flex flex-col">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Spending by Category
            </h3>
            <Link href="/reports" className="text-primary hover:text-primary-container font-label-md text-label-md flex items-center gap-xs">
              View Report <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
          
          {/* Improved Vertical Bar Chart */}
          <div className="relative h-[220px] mt-4 ml-10">
            {/* Y-axis background lines */}
            <div className="absolute inset-0 flex flex-col justify-between border-l border-b border-outline-variant pb-8">
              <div className="w-full border-t border-outline-variant/30"></div>
              <div className="w-full border-t border-outline-variant/30"></div>
              <div className="w-full"></div>
            </div>
            
            {/* Y-axis labels */}
            <div className="absolute left-[-45px] top-0 bottom-8 flex flex-col justify-between text-[11px] text-on-surface-variant font-medium">
              <span>{currencySymbol}{maxCatValue.toFixed(0)}</span>
              <span>{currencySymbol}{(maxCatValue / 2).toFixed(0)}</span>
              <span>{currencySymbol}0</span>
            </div>
            
            {/* Bars container */}
            <div className="absolute inset-0 left-0 bottom-8 flex items-end justify-around px-4">
              {topCategories.length > 0 ? topCategories.map(([cat, val], idx) => {
                const pct = Math.max(2, (val / maxCatValue) * 100);
                return (
                  <div key={cat} className="flex flex-col items-center group h-full justify-end w-12 md:w-16 relative">
                    <div
                      className={`w-full ${bgColors[idx % bgColors.length]} rounded-t-md relative transition-all hover:opacity-80 shadow-sm`}
                      style={{ height: `${pct}%` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-inverse-surface text-surface px-3 py-1 rounded text-[12px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap shadow-lg">
                        {currencySymbol}{val.toFixed(2)}
                      </div>
                    </div>
                    {/* X-axis label positioned completely below the border line */}
                    <span className="absolute -bottom-7 text-[11px] text-on-surface-variant truncate w-16 md:w-20 text-center font-medium" title={cat}>
                      {cat}
                    </span>
                  </div>
                );
              }) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-medium pb-8">No category data matching filters</div>
              )}
            </div>
          </div>
        </div>

        {/* Chart: Spending by Store */}
        <div className="md:col-span-6 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_4px_rgba(0,0,0,0.05)] p-lg flex flex-col">
          <div className="flex justify-between items-center mb-lg">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Top Merchants
            </h3>
          </div>
          <div className="flex flex-col gap-5">
            {topMerchants.length > 0 ? topMerchants.map(([merchant, val], idx) => {
              const pct = (val / maxMerchantValue) * 100;
              return (
                <div key={merchant} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center font-body-sm text-body-sm">
                    <span className="text-on-surface font-medium truncate max-w-[70%]">{merchant}</span>
                    <span className="text-on-surface-variant font-numeric-data">{currencySymbol}{val.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-surface-variant rounded-full h-2.5">
                    <div
                      className={`${bgColors[idx % bgColors.length]} h-2.5 rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            }) : (
               <div className="py-4 text-on-surface-variant text-center">No merchant data matching filters</div>
            )}
          </div>
        </div>

        {/* Chart: Top Spending Items */}
        <div className="md:col-span-6 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_4px_rgba(0,0,0,0.05)] p-lg flex flex-col">
          <div className="flex justify-between items-center mb-lg">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Top Spending Items
            </h3>
          </div>
          <div className="flex flex-col gap-3">
            {topItems.length > 0 ? topItems.map(([item, val], idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-surface-variant hover:border-outline-variant transition-colors cursor-default">
                <div className="flex items-center gap-md truncate">
                  <div className={`w-9 h-9 rounded-full ${bgColors[idx % bgColors.length]} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                    <span className="material-symbols-outlined text-[18px] text-on-surface">shopping_cart</span>
                  </div>
                  <span className="font-body-sm text-body-sm font-medium text-on-surface truncate">{item}</span>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="font-numeric-data text-numeric-data text-on-surface text-sm block">
                    {currencySymbol}{val.toFixed(2)}
                  </span>
                </div>
              </div>
            )) : (
               <div className="py-4 text-on-surface-variant text-center">No item data matching filters</div>
            )}
          </div>
        </div>
        
        {/* Recent Activity List */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_4px_rgba(0,0,0,0.05)] flex flex-col">
          <div className="p-lg border-b border-outline-variant flex justify-between items-center">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Recent Uploads
            </h3>
            <Link href="/receipts" className="text-primary hover:underline font-label-md text-label-md">
              View All
            </Link>
          </div>
          <div className="flex flex-col">
            {recentUploads.length > 0 ? recentUploads.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-4 border-b border-outline-variant hover:bg-surface-container-low transition-colors last:border-b-0">
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">receipt</span>
                  </div>
                  <div>
                    <h4 className="font-body-md text-body-md font-medium text-on-surface">{exp.merchant || 'Unknown Merchant'}</h4>
                    <p className="font-body-sm text-[13px] text-on-surface-variant mt-0.5">
                      {new Date(exp.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-numeric-data text-numeric-data text-on-surface block">
                    {currencySymbol}{convertAmount(exp.total || 0, exp.currency).toFixed(2)}
                  </span>
                </div>
              </div>
            )) : (
               <div className="p-8 text-on-surface-variant text-center">No recent uploads match your filters</div>
            )}
          </div>
        </div>
        
        {/* Quick Upload Widget */}
        <div
          className="md:col-span-4 rounded-xl p-lg flex flex-col justify-center items-center text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(45,212,191,0.06) 0%, rgba(59,130,246,0.08) 100%)',
            border: '1px solid rgba(45,212,191,0.2)',
            boxShadow: '0 0 40px rgba(45,212,191,0.06)',
          }}
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(45,212,191,0.12)' }} />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(59,130,246,0.10)' }} />
          <div className="relative z-10 flex flex-col items-center py-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg,#2dd4bf,#3b82f6)', boxShadow: '0 8px 24px rgba(45,212,191,0.25)' }}
            >
              <span className="material-symbols-outlined text-[30px]" style={{ color: '#0a1628' }}>document_scanner</span>
            </div>
            <h3 className="font-headline-md text-headline-md font-semibold text-on-surface mb-2">Quick Upload</h3>
            <p className="font-body-sm text-[14px] text-on-surface-variant mb-6 px-2">
              Drag &amp; drop a receipt or snap a photo to auto-extract data instantly.
            </p>
            <Link
              href="/receipts"
              className="w-full rounded-xl p-3 text-center font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg,#2dd4bf,#3b82f6)',
                color: '#0a1628',
                textDecoration: 'none',
                display: 'block',
              }}
            >
              Go to Uploads
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
