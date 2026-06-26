'use client';

import { useData } from '@/components/DataProvider';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const { expenses } = useData();

  const totalSpent = expenses.reduce((acc, exp) => acc + (exp.total || 0), 0);
  const receiptsCount = expenses.length;
  const avgReceiptValue = receiptsCount > 0 ? totalSpent / receiptsCount : 0;

  const downloadReport = () => {
    if (expenses.length === 0) {
      alert('No data to export.');
      return;
    }
    const doc = new jsPDF();
    doc.text('Lekha Tracker - Expense Report', 14, 15);
    doc.text(`Total Spent: $${totalSpent.toFixed(2)}`, 14, 25);
    
    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Merchant', 'Category', 'Total']],
      body: expenses.map((e) => [
        new Date(e.addedAt).toLocaleDateString(),
        e.merchant || 'Unknown',
        e.receiptCategory || 'Other',
        `$${e.total.toFixed(2)}`,
      ]),
    });
    
    doc.save('expense_report.pdf');
  };

  return (
    <div className="flex-1 p-margin-mobile md:p-margin-desktop overflow-y-auto">
      <div className="mb-lg flex justify-between items-end flex-wrap gap-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Financial Reports</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
            Analyze your spending patterns and generate tax-ready exports.
          </p>
        </div>
        <div className="flex gap-sm">
          <button 
            onClick={downloadReport}
            className="flex items-center gap-xs px-md py-sm bg-surface-container-low border border-outline-variant rounded-md text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="font-label-md text-label-md">Export PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-lg">
        {/* Summary Cards (Top Row) */}
        <div className="col-span-12 md:col-span-4 bg-surface rounded-xl border border-outline-variant shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-lg flex flex-col justify-between">
          <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Total Tracked Expenses</p>
          <div className="flex items-baseline gap-sm mb-md">
            <h3 className="font-numeric-data text-numeric-data text-on-surface text-3xl font-bold">${totalSpent.toFixed(2)}</h3>
          </div>
          <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full rounded-full"></div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 bg-surface rounded-xl border border-outline-variant shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-lg flex flex-col justify-between">
          <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Receipts Processed</p>
          <div className="flex items-baseline gap-sm mb-md">
            <h3 className="font-numeric-data text-numeric-data text-on-surface text-3xl font-bold">{receiptsCount}</h3>
          </div>
          <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-secondary w-full rounded-full"></div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-4 bg-surface rounded-xl border border-outline-variant shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
          <p className="font-label-md text-label-md text-on-surface-variant mb-xs">Average Receipt Value</p>
          <div className="flex items-baseline gap-sm mb-md relative z-10">
            <h3 className="font-numeric-data text-numeric-data text-primary text-3xl font-bold">${avgReceiptValue.toFixed(2)}</h3>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant relative z-10">Across {receiptsCount} tracked receipts.</p>
        </div>
      </div>
    </div>
  );
}
