'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '@/components/DataProvider';

export default function BudgetPage() {
  const { expenses, budget, updateBudget, currencySymbol, convertAmount } = useData();
  const [tempBudget, setTempBudget] = useState(budget);
  const [showTooltip, setShowTooltip] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);

  const thumbPercent = ((tempBudget - 50) / (10000 - 50)) * 100;

  useEffect(() => {
    setTempBudget(budget);
  }, [budget]);

  const totalSpent = expenses.reduce((acc, exp) => acc + convertAmount(exp.total || 0, exp.currency), 0);
  const remaining = Math.max(0, budget - totalSpent);
  const percentage = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  
  // Group expenses by category
  const categorySpending = useMemo(() => {
    const categories: Record<string, number> = {};
    expenses.forEach(exp => {
      const cat = exp.receiptCategory || 'Other';
      categories[cat] = (categories[cat] || 0) + convertAmount(exp.total || 0, exp.currency);
    });
    return Object.entries(categories)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  return (
    <div className="flex-1 p-margin-mobile md:p-margin-desktop overflow-y-auto">
      <div className="mb-lg">
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Budget Planning</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
          Set category limits, track spending, and adjust your financial plan on the fly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-lg">
          {/* Global Budget Summary Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-[0_4px_4px_rgba(0,0,0,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed-dim opacity-20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-md relative z-10">
              <div>
                <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm">
                  Total Budget
                </h3>
                <div className="flex items-baseline gap-sm mt-xs">
                  <span className="font-display-lg text-display-lg font-bold text-on-background">{currencySymbol}{totalSpent.toFixed(2)}</span>
                  <span className="font-body-md text-on-surface-variant mb-1">
                    / {currencySymbol}{budget.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="relative w-full h-4 bg-surface-container rounded-full overflow-hidden mb-xs z-10">
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ${percentage >= 100 ? 'bg-error' : 'bg-primary'}`} 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between font-label-md text-label-md text-on-surface-variant relative z-10 mb-4">
              <span>{currencySymbol}{remaining.toFixed(2)} Remaining</span>
              <span>{percentage.toFixed(1)}% Used</span>
            </div>

            {/* Permanent explicit budget editor */}
            <div className="flex flex-col gap-2 pt-4 border-t border-outline-variant/50 relative z-10">
              <div className="flex justify-between items-center">
                <span className="font-label-md text-on-surface-variant">Set Budget Manually</span>
                <div className="flex items-center gap-1 bg-surface-container-low px-3 py-1.5 rounded-lg border-2 border-outline-variant focus-within:border-primary transition-colors min-w-[100px]">
                  <span className="text-on-surface-variant text-sm font-medium">{currencySymbol}</span>
                  <input 
                    type="number"
                    value={tempBudget}
                    onChange={(e) => setTempBudget(Number(e.target.value))}
                    onBlur={() => updateBudget(tempBudget)}
                    className="bg-transparent outline-none w-24 text-right font-numeric-data font-bold text-primary text-base"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="relative flex-1">
                  {showTooltip && (
                    <div
                      className="absolute -top-9 flex flex-col items-center pointer-events-none z-10"
                      style={{ left: `calc(${thumbPercent}% + ${8 - thumbPercent * 0.16}px)`, transform: 'translateX(-50%)' }}
                    >
                      <span className="bg-primary text-on-primary text-xs font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap">
                        {currencySymbol}{tempBudget.toLocaleString()}
                      </span>
                      <span className="w-2 h-2 bg-primary rotate-45 -mt-1"></span>
                    </div>
                  )}
                  <input
                    ref={sliderRef}
                    type="range"
                    min="50"
                    max="10000"
                    step="50"
                    value={tempBudget}
                    onChange={(e) => setTempBudget(Number(e.target.value))}
                    onMouseDown={() => setShowTooltip(true)}
                    onMouseUp={() => { setShowTooltip(false); updateBudget(tempBudget); }}
                    onTouchStart={() => setShowTooltip(true)}
                    onTouchEnd={() => { setShowTooltip(false); updateBudget(tempBudget); }}
                    className="w-full h-2 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                {tempBudget !== budget && (
                  <button 
                    onClick={() => updateBudget(tempBudget)}
                    className="text-[10px] bg-primary text-on-primary px-3 py-1 rounded shadow-sm hover:bg-primary/90 transition-colors font-medium animate-in fade-in zoom-in"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Category Sliders */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-[0_4px_4px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-headline-md text-headline-md text-on-background">Category Breakdowns</h3>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">
              How much of your total spending goes to each category.
            </p>
            
            <div className="space-y-lg mt-md">
              {categorySpending.length > 0 ? categorySpending.map((cat, idx) => {
                // Calculate percentage of total spent (not total budget, just proportional to spending)
                const catPercentage = totalSpent > 0 ? (cat.amount / totalSpent) * 100 : 0;
                
                // Choose an icon based on name
                const icon = cat.name.toLowerCase().includes('food') || cat.name.toLowerCase().includes('dining') || cat.name.toLowerCase().includes('restaurant') ? 'restaurant' : 
                             cat.name.toLowerCase().includes('transport') || cat.name.toLowerCase().includes('travel') ? 'commute' : 
                             cat.name.toLowerCase().includes('grocery') || cat.name.toLowerCase().includes('supermarket') ? 'shopping_cart' : 
                             cat.name.toLowerCase().includes('tech') || cat.name.toLowerCase().includes('electronics') ? 'devices' : 'category';

                return (
                  <div key={idx} className="flex flex-col gap-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-sm">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined">{icon}</span>
                        </div>
                        <div>
                          <h4 className="font-label-md text-label-md text-on-background">{cat.name}</h4>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-numeric-data text-numeric-data font-bold text-on-background">{currencySymbol}{cat.amount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="relative w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-secondary rounded-full transition-all duration-700" style={{ width: `${catPercentage}%` }}></div>
                    </div>
                  </div>
                );
              }) : (
                 <p className="text-body-sm text-on-surface-variant text-center py-4">No spending data yet. Upload some receipts!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights */}
        <div className="lg:col-span-4 flex flex-col gap-lg">
          <div className="glass-panel rounded-xl p-md shadow-[0_12px_24px_rgba(0,0,0,0.05)] relative overflow-hidden bg-gradient-to-br from-surface-bright to-surface-container-low">
            <div className="absolute top-0 right-0 p-sm">
              <span className="material-symbols-outlined text-secondary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <h3 className="font-label-md text-label-md text-primary uppercase tracking-wider mb-sm">AI Insights</h3>
            
            <div className="space-y-md">
              <div className="bg-surface-container-lowest p-sm rounded-lg border border-outline-variant/50">
                <div className="flex items-start gap-sm">
                  <span className="material-symbols-outlined text-secondary mt-1">lightbulb</span>
                  <div>
                    <h4 className="font-label-md text-label-md text-on-background mb-1">Status</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      {percentage < 80 
                        ? "You're well within your budget." 
                        : percentage < 100 
                          ? "You are nearing your budget limit. Watch your spending!" 
                          : "You have exceeded your overall budget."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
