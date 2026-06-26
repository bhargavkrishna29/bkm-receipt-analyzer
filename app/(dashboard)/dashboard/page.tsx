'use client';

import { useData } from '@/components/DataProvider';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { expenses, budget } = useData();
  
  const user = session?.user;
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const totalSpent = expenses.reduce((acc, exp) => acc + (exp.total || 0), 0);
  const budgetUtilization = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const recentUploads = expenses.slice(0, 3);

  // Group by category for the chart placeholder
  const categoryTotals = expenses.reduce((acc, exp) => {
    const cat = exp.receiptCategory || 'Other';
    acc[cat] = (acc[cat] || 0) + exp.total;
    return acc;
  }, {} as Record<string, number>);
  
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCatValue = topCategories.length ? Math.max(...topCategories.map(c => c[1])) : 1;

  const bgColors = ['bg-secondary-container', 'bg-primary-container', 'bg-surface-tint', 'bg-tertiary-container', 'bg-outline-variant'];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Overview Header */}
      <div className="mb-lg flex justify-between items-end flex-wrap gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Dashboard</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-base">
            Welcome back, {firstName}. Here's your financial overview.
          </p>
        </div>
        <div className="flex gap-sm">
          <select className="bg-surface-container-lowest border border-outline-variant rounded-md py-xs px-md font-body-sm text-body-sm text-on-surface focus:border-primary outline-none">
            <option>All Time</option>
          </select>
        </div>
      </div>
      
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
        {/* Big Metric: Total Spent */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_4px_rgba(0,0,0,0.05)] p-lg flex flex-col justify-between">
          <div>
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm">
              Total Spent
            </h3>
            <div className="flex items-end gap-xs">
              <span className="font-display-lg text-display-lg font-bold text-on-surface">
                ${totalSpent.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-lg">
            <div className="flex justify-between font-label-md text-label-md text-on-surface-variant mb-xs">
              <span>Budget utilization</span>
              <span>{budgetUtilization.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-surface-variant rounded-full h-1">
              <div
                className="bg-primary h-1 rounded-full"
                style={{ width: `${budgetUtilization}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Chart: Spending Trends */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_4px_4px_rgba(0,0,0,0.05)] p-lg flex flex-col">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Spending by Category
            </h3>
            <Link href="/reports" className="text-primary hover:text-primary-container font-label-md text-label-md flex items-center gap-xs">
              View Report <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
          {/* Chart Placeholder mapped with actual data */}
          <div className="flex-1 min-h-[200px] flex items-end gap-sm pt-xl border-b border-l border-outline-variant pb-xs pl-xs relative">
            <div className="absolute left-[-40px] top-0 bottom-0 flex flex-col justify-between font-label-md text-[10px] text-on-surface-variant py-xs">
              <span>${maxCatValue.toFixed(0)}</span>
              <span>${(maxCatValue / 2).toFixed(0)}</span>
              <span>$0</span>
            </div>
            {topCategories.length > 0 ? topCategories.map(([cat, val], idx) => {
              const pct = Math.max(10, (val / maxCatValue) * 100);
              return (
                <div key={cat} className="flex-1 flex flex-col items-center justify-end group">
                  <div
                    className={`w-full max-w-[40px] ${bgColors[idx % bgColors.length]} hover:opacity-80 transition-colors rounded-t-sm relative`}
                    style={{ height: `${pct}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-inverse-surface text-surface px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                      ${val.toFixed(2)}
                    </div>
                  </div>
                  <span className="font-label-md text-[10px] text-on-surface-variant mt-sm truncate w-full text-center">
                    {cat}
                  </span>
                </div>
              );
            }) : (
              <div className="w-full text-center text-on-surface-variant">No data yet</div>
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
              <div key={exp.id} className="flex items-center justify-between p-sm border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">receipt</span>
                  </div>
                  <div>
                    <h4 className="font-body-md text-body-md font-medium text-on-surface">{exp.merchant || 'Unknown Merchant'}</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {new Date(exp.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-numeric-data text-numeric-data text-on-surface block">
                    ${exp.total.toFixed(2)}
                  </span>
                </div>
              </div>
            )) : (
               <div className="p-md text-on-surface-variant text-center">No recent uploads</div>
            )}
          </div>
        </div>
        
        {/* Quick Upload Widget */}
        <div className="md:col-span-4 bg-primary text-on-primary rounded-xl p-lg flex flex-col justify-center items-center text-center relative overflow-hidden shadow-[0_12px_24px_rgba(0,35,111,0.15)]">
          {/* Decorative background element */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container rounded-full opacity-50 blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary-container rounded-full opacity-20 blur-xl"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-on-primary text-primary rounded-full flex items-center justify-center mb-md shadow-sm">
              <span className="material-symbols-outlined text-[32px]">document_scanner</span>
            </div>
            <h3 className="font-headline-md text-headline-md font-semibold mb-xs">Quick Upload</h3>
            <p className="font-body-sm text-body-sm text-primary-fixed-dim mb-lg">
              Drag &amp; drop a receipt or snap a photo to auto-extract data instantly.
            </p>
            <Link href="/receipts" className="w-full border-2 border-dashed border-primary-fixed-dim rounded-lg p-md hover:bg-primary-container transition-colors cursor-pointer inline-block">
              <span className="font-label-md text-label-md">Go to Uploads</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
