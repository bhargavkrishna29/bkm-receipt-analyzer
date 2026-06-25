// types/index.ts — shared TypeScript types for Lekha Tracker

export interface ReceiptItem {
  name: string;
  amount: number;
  quantity: number;
  unitPrice: number;
  itemCategory: string;
}

export interface Receipt {
  id: string;
  merchant: string;
  date: string;
  total: number;
  currency: string;
  receiptCategory: string;
  items: ReceiptItem[];
  taxAmount: number;
  discountAmount: number;
  confidence: 'high' | 'medium' | 'low';
  addedAt: number; // milliseconds timestamp
  uid: string;
}

export interface UserProfile {
  email: string | null;
  displayName: string | null;
  budget?: number;
  lastLoginAt?: number;
}

// ── Gemini AI response shapes ──────────────────────────────────────────────

export interface GeminiReceiptData {
  merchant: string;
  date: string | null;
  total: number;
  currency: string;
  receiptCategory: string;
  items: Array<{
    name: string;
    amount: number;
    quantity: number;
    unitPrice: number;
    itemCategory: string;
  }>;
  taxAmount: number;
  discountAmount: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface QuickInsights {
  topCategory: string;
  topCategoryPercent: number;
  savingOpportunity: string;
  budgetSuggestion: string;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percent: number;
  status?: 'high' | 'normal' | 'low';
  tip?: string;
  insight?: string;
}

export interface TopSpendItem {
  name: string;
  amount: number;
  isEssential: boolean;
  alternative: string | null;
}

export interface FrequentItem {
  name: string;
  frequency: number;
  totalSpend: number;
  suggestion: string | null;
}

export interface SpendingAnalysis {
  summary: string;
  receiptCategoryBreakdown: CategoryBreakdownItem[];
  itemCategoryBreakdown: CategoryBreakdownItem[];
  topSpendItems: TopSpendItem[];
  frequentItems: FrequentItem[];
  unnecessarySpend: number;
  essentialSpend: number;
  savingPlan: string[];
  budgetAllocation: { [key: string]: number };
  weeklyTarget: number;
  score: number;
  topInsight: string;
}

export interface InsightsTotals {
  grandTotal: number;
  byReceiptCat: Record<string, number>;
  byItemCat: Record<string, number>;
  sortedReceiptCats: [string, number][];
  sortedItemCats: [string, number][];
  topItems: Array<{ name: string; amount: number; category: string; merchant: string }>;
  mostFrequent: Array<{ name: string; count: number; total: number; category: string }>;
}

// ── Filters state ──────────────────────────────────────────────────────────

export interface Filters {
  months: 1 | 3;
  category: string;
  sort: 'newest' | 'oldest' | 'high' | 'low';
}

// ── Category color maps ────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#ff6b6b',
  'Groceries': '#4ecdc4',
  'Transportation': '#45b7d1',
  'Shopping': '#f7b731',
  'Entertainment': '#a29bfe',
  'Health & Fitness': '#fd79a8',
  'Utilities': '#6c5ce7',
  'Housing': '#00b894',
  'Travel': '#0984e3',
  'Education': '#e17055',
  'Other': '#b2bec3',
};

export const ITEM_CAT_COLORS: Record<string, string> = {
  'Produce': '#4ecdc4',
  'Dairy': '#a8d8ea',
  'Meat & Fish': '#ff6b6b',
  'Bakery': '#f7b731',
  'Beverages': '#45b7d1',
  'Snacks & Sweets': '#fd79a8',
  'Frozen': '#74b9ff',
  'Household': '#6c5ce7',
  'Personal Care': '#e84393',
  'Clothing': '#e17055',
  'Electronics': '#0984e3',
  'Medicine': '#00b894',
  'Transport': '#fdcb6e',
  'Entertainment': '#a29bfe',
  'Dining': '#d63031',
  'Other': '#b2bec3',
};
