'use client';

import { useState } from 'react';

interface BudgetModalProps {
  currentBudget: number;
  onSave: (val: number) => Promise<void>;
  onClose: () => void;
}

export default function BudgetModal({ currentBudget, onSave, onClose }: BudgetModalProps) {
  const [value, setValue] = useState(currentBudget > 0 ? String(currentBudget) : '');

  async function handleSave() {
    const val = parseFloat(value);
    if (val > 0) await onSave(val);
    onClose();
  }

  return (
    <div
      className="modal-overlay"
      id="budgetModal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal modal-sm">
        <div className="modal-header">
          <h2 className="modal-title">Monthly Budget</h2>
          <button className="modal-close" id="closeBudgetModal" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="modal-desc">Set your monthly spending limit to track how much you have left.</p>
          <div className="input-group">
            <label className="input-label">Amount</label>
            <input
              type="number"
              id="budgetInput"
              className="input-field"
              placeholder="e.g. 5000"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button className="btn-ghost" id="cancelBudget" onClick={onClose}>Cancel</button>
            <button className="btn-primary" id="saveBudget" onClick={handleSave}>Save Budget</button>
          </div>
        </div>
      </div>
    </div>
  );
}
