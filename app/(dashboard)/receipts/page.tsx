'use client';

import { useState, useRef } from 'react';
import { useData } from '@/components/DataProvider';
import type { Receipt } from '@/types';

async function fileToBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ base64: result.split(',')[1], mediaType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReceiptsPage() {
  const { expenses, addReceipt, removeReceipt } = useData();
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(expenses[0] || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  async function processFile(file: File) {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      showToast('Please upload an image or PDF file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large. Max 10MB.');
      return;
    }

    setIsProcessing(true);
    try {
      const { base64, mediaType } = await fileToBase64(file);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType, existingExpenses: expenses }),
      });

      const data = await res.json() as { success: boolean; error?: string; receipt?: Record<string, unknown> };
      if (!res.ok || data.success === false) throw new Error(data.error ?? `Request failed (${res.status})`);

      const receipt = data.receipt!;

      const { saveReceipt } = await import('@/app/actions/db');
      const saved = await saveReceipt({
        merchant: String(receipt.merchant ?? 'Unknown'),
        date: String(receipt.date ?? new Date().toISOString().split('T')[0]),
        total: parseFloat(String(receipt.total)) || 0,
        currency: String(receipt.currency ?? 'SEK'),
        receiptCategory: String(receipt.receiptCategory ?? receipt.category ?? 'Other'),
        items: ((receipt.items as Array<Record<string, unknown>>) ?? []).map((item) => ({
          name: String(item.name ?? 'Unknown item'),
          amount: parseFloat(String(item.amount)) || 0,
          quantity: Number(item.quantity) || 1,
          unitPrice: parseFloat(String(item.unitPrice ?? item.amount)) || 0,
          itemCategory: String(item.itemCategory ?? 'Other'),
        })),
        taxAmount: Number(receipt.taxAmount) || 0,
        discountAmount: Number(receipt.discountAmount) || 0,
        confidence: (receipt.confidence as 'high' | 'medium' | 'low') ?? 'medium',
      });

      addReceipt(saved);
      setSelectedReceipt(saved);
      showToast(`Added ${saved.merchant} — ${saved.total.toFixed(2)} ${saved.currency}`);
    } catch (err) {
      console.error('Upload error:', err);
      showToast('❌ ' + ((err as Error).message ?? 'Something went wrong. Try again.'));
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-surface-container-high');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.classList.add('bg-surface-container-high');
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.currentTarget.classList.remove('bg-surface-container-high');
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-margin-mobile md:p-lg gap-lg">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-4 right-4 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-2 rounded shadow-lg font-body-sm">
          {toastMsg}
        </div>
      )}

      {/* Left Side: Upload & List */}
      <div className="w-full lg:w-1/3 flex flex-col gap-md h-full">
        {/* Drag & Drop Area */}
        <div
          className="border-2 border-dashed border-outline-variant rounded-xl p-lg flex flex-col items-center justify-center bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer min-h-[160px]"
          onClick={() => fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl text-primary mb-2 animate-spin">refresh</span>
              <p className="font-body-sm text-on-surface-variant">Analyzing receipt...</p>
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined text-4xl text-primary mb-2">cloud_upload</span>
              <h3 className="font-label-md text-label-md text-on-surface mb-1">Drag &amp; Drop Receipt</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
                or click to browse from device
              </p>
            </>
          )}
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            accept="image/*,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
          />
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-end mt-sm mb-xs">
          <h2 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Recent Uploads</h2>
        </div>

        {/* Receipt List */}
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-sm custom-scrollbar">
          {expenses.length > 0 ? expenses.map((receipt) => {
            const isSelected = selectedReceipt?.id === receipt.id;
            return (
              <div
                key={receipt.id}
                onClick={() => setSelectedReceipt(receipt)}
                className={`bg-surface-container-lowest border ${isSelected ? 'border-primary shadow-[0_4px_12px_rgba(30,58,138,0.05)]' : 'border-outline-variant hover:border-primary/50 shadow-[0_2px_4px_rgba(0,0,0,0.02)]'} rounded-lg p-sm cursor-pointer transition-colors relative overflow-hidden`}
              >
                {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>}
                <div className="flex justify-between items-start mb-2 pl-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center">
                      <span className={`material-symbols-outlined text-sm ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>
                        receipt
                      </span>
                    </div>
                    <div>
                      <h4 className="font-body-sm text-body-sm font-semibold text-on-surface">{receipt.merchant || 'Unknown'}</h4>
                      <p className="font-label-md text-[10px] text-on-surface-variant truncate w-32">{receipt.id}</p>
                    </div>
                  </div>
                  <span className="font-numeric-data text-numeric-data text-on-surface">${receipt.total?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-outline-variant/50 pl-2">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-secondary-container/30 text-on-secondary-container font-label-md text-[10px]">
                    <span className="material-symbols-outlined text-[12px] mr-1">check_circle</span> Processed
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">
                    {new Date(receipt.addedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          }) : (
            <p className="text-body-sm text-on-surface-variant text-center mt-lg">No receipts found.</p>
          )}
        </div>
      </div>

      {/* Right Side: Detail View */}
      {selectedReceipt ? (
        <div className="w-full lg:w-2/3 h-full overflow-y-auto pb-lg custom-scrollbar">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-full flex flex-col relative overflow-hidden">
            {/* Decorative background blur */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-fixed-dim/20 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/4"></div>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-lg pb-md border-b border-outline-variant">
              <div>
                <div className="flex items-center gap-sm mb-1">
                  <h2 className="font-headline-md text-headline-md text-on-surface">{selectedReceipt.merchant || 'Unknown'}</h2>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-md text-[10px] border border-outline-variant/50 truncate max-w-32">
                    ID: {selectedReceipt.id}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span> 
                  {new Date(selectedReceipt.date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase">Total Amount</p>
                <p className="font-numeric-data text-display-lg text-primary leading-none">${selectedReceipt.total?.toFixed(2)}</p>
              </div>
            </div>

            {/* Bento Grid for Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
              {/* AI Categorization Box */}
              <div className="md:col-span-2 bg-surface-container-low border border-outline-variant rounded-lg p-md flex items-center gap-md">
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                    category
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">AI Category Prediction</p>
                  <div className="flex items-center justify-between">
                    <h3 className="font-body-lg text-body-lg font-semibold text-on-surface">{selectedReceipt.receiptCategory || 'Uncategorized'}</h3>
                    <span className="text-secondary text-sm flex items-center gap-1 font-numeric-data">
                      <span className="material-symbols-outlined text-[16px]">verified</span> {selectedReceipt.confidence} confidence
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Delete Box */}
              <div className="bg-surface-container rounded-lg p-md flex flex-col justify-center items-center cursor-pointer hover:bg-error-container hover:text-error transition-colors"
                onClick={async () => {
                  if(confirm('Delete this receipt?')) {
                    await removeReceipt(selectedReceipt.id);
                    setSelectedReceipt(null);
                  }
                }}
              >
                <span className="material-symbols-outlined text-on-surface-variant hover:text-error">delete</span>
                <span className="font-label-md text-sm mt-1 text-on-surface-variant hover:text-error">Delete Receipt</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider mb-sm">Line Items Extracted</h3>
              <div className="border border-outline-variant rounded-lg overflow-hidden flex-1 flex flex-col">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 p-sm bg-surface-container-low border-b border-outline-variant font-label-md text-on-surface-variant">
                  <div className="col-span-6 md:col-span-8">Description</div>
                  <div className="col-span-3 md:col-span-2 text-right">Qty</div>
                  <div className="col-span-3 md:col-span-2 text-right">Amount</div>
                </div>
                
                {/* Table Body */}
                <div className="flex-1 overflow-y-auto bg-surface-container-lowest custom-scrollbar">
                  {selectedReceipt.items?.length > 0 ? selectedReceipt.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-sm border-b border-outline-variant/30 items-center hover:bg-surface/50 transition-colors">
                      <div className="col-span-6 md:col-span-8 font-body-sm text-on-surface">{item.name}</div>
                      <div className="col-span-3 md:col-span-2 text-right font-numeric-data text-body-sm text-on-surface-variant">{item.quantity}</div>
                      <div className="col-span-3 md:col-span-2 text-right font-numeric-data text-body-sm font-medium text-on-surface">${item.amount?.toFixed(2)}</div>
                    </div>
                  )) : (
                    <div className="p-sm text-center text-body-sm text-on-surface-variant">No line items extracted.</div>
                  )}
                </div>
                
                {/* Table Footer (Totals) */}
                <div className="bg-surface-container-low p-sm font-numeric-data">
                  <div className="flex justify-end gap-md mb-2 text-body-sm text-on-surface-variant border-b border-outline-variant pb-2">
                    <span>Tax:</span>
                    <span className="w-20 text-right">${selectedReceipt.taxAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-end gap-md text-numeric-data text-on-surface font-semibold pt-1">
                    <span>Total:</span>
                    <span className="w-20 text-right">${selectedReceipt.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex w-2/3 h-full items-center justify-center border-l border-outline-variant bg-surface-container-lowest">
          <p className="text-on-surface-variant font-body-md">Select a receipt to view details</p>
        </div>
      )}
    </div>
  );
}
