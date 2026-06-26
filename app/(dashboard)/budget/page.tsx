'use client';

import { useState } from 'react';
import { useData } from '@/components/DataProvider';

export default function BudgetPage() {
  const { expenses, budget, updateBudget } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(budget.toString());

  const totalSpent = expenses.reduce((acc, exp) => acc + (exp.total || 0), 0);
  const remaining = Math.max(0, budget - totalSpent);
  const percentage = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  
  const handleSaveBudget = async () => {
    const val = parseFloat(newBudget);
    if (!isNaN(val) && val >= 0) {
      await updateBudget(val);
      setIsEditing(false);
    }
  };

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
                {isEditing ? (
                  <div className="flex items-center gap-sm mt-xs">
                    <span className="font-display-lg text-display-lg text-on-background">$</span>
                    <input 
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="font-display-lg text-display-lg text-on-background w-48 border-b-2 border-primary bg-transparent outline-none focus:border-primary-fixed"
                      autoFocus
                    />
                    <button onClick={handleSaveBudget} className="px-3 py-1 bg-primary text-on-primary rounded text-sm hover:bg-primary/90">
                      Save
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-surface-variant text-on-surface rounded text-sm hover:bg-outline-variant">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-sm mt-xs group">
                    <span className="font-display-lg text-display-lg text-on-background">${totalSpent.toFixed(2)}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer hover:text-primary transition-colors" onClick={() => { setIsEditing(true); setNewBudget(budget.toString()); }}>
                      / ${budget.toFixed(2)} <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="relative w-full h-4 bg-surface-container rounded-full overflow-hidden mb-xs z-10">
              <div 
                className={`absolute top-0 left-0 h-full rounded-full ${percentage >= 100 ? 'bg-error' : 'bg-secondary'}`} 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between font-label-md text-label-md text-on-surface-variant relative z-10">
              <span>${remaining.toFixed(2)} Remaining</span>
              <span>{percentage.toFixed(1)}% Used</span>
            </div>
          </div>

          {/* Category Sliders (Placeholder static for now) */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-[0_4px_4px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-headline-md text-headline-md text-on-background">Category Breakdowns</h3>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-lg">
              This feature will be available in a future update to let you allocate category-specific budgets.
            </p>
            
            <div className="space-y-xl opacity-50 pointer-events-none">
              {/* Example Category */}
              <div className="flex flex-col gap-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-sm">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">restaurant</span>
                    </div>
                    <div>
                      <h4 className="font-label-md text-label-md text-on-background">Food &amp; Dining</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Groceries, Restaurants</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-numeric-data text-numeric-data text-on-background">$0</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block">/ $500</span>
                  </div>
                </div>
                <div className="relative w-full h-4 bg-surface-container rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-secondary rounded-full" style={{ width: "0%" }}></div>
                </div>
              </div>
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
