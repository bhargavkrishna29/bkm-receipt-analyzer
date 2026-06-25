'use client';

import { useRef, useState } from 'react';
import type { Receipt, QuickInsights } from '@/types';

interface UploadZoneProps {
  expenses: Receipt[];
  onReceiptAdded: (receipt: Receipt) => void;
  onQuickTip: (insights: QuickInsights) => void;
  onToast: (msg: string) => void;
}

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

export default function UploadZone({ expenses, onReceiptAdded, onQuickTip, onToast }: UploadZoneProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  async function processFile(file: File) {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      onToast('Please upload an image or PDF file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onToast('File too large. Max 10MB.');
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

      const data = await res.json() as { success: boolean; error?: string; receipt?: Record<string, unknown>; insights?: QuickInsights };
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

      onReceiptAdded(saved);
      if (data.insights) onQuickTip(data.insights);
      onToast(`✓ Added ${saved.merchant} — ${saved.total.toFixed(2)} ${saved.currency}`);
    } catch (err) {
      console.error('Upload error:', err);
      onToast('❌ ' + ((err as Error).message ?? 'Something went wrong. Try again.'));
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.currentTarget.classList.remove('drag-over');
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  return (
    <section className="upload-section">
      <div
        className="upload-zone"
        id="uploadZone"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <div className={`upload-idle${isProcessing ? ' hidden' : ''}`} id="uploadIdle">
          <div className="upload-icon">
            <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="4" width="24" height="32" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M32 4l8 8H32V4z" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M20 20v10M15 25l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="upload-headline">Drop a receipt here</p>
          <p className="upload-sub">
            or <label htmlFor="fileInput" className="upload-link">browse files</label>
          </p>
          <p className="upload-formats">JPG, PNG, WEBP · up to 10MB</p>
        </div>
        <div className={`upload-processing${isProcessing ? '' : ' hidden'}`} id="uploadProcessing">
          <div className="spinner" />
          <p className="processing-text">Reading your receipt<span className="dots" /></p>
        </div>
        <input
          type="file"
          id="fileInput"
          ref={fileInputRef}
          accept="image/*"
          className="file-input"
          onChange={onFileChange}
        />
      </div>
    </section>
  );
}
