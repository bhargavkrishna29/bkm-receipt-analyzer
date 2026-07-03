'use server';

import { auth } from '@/auth';
import { getModel } from '@/lib/gemini';
import type { ChatMessage } from '@/types';

export async function chatWithFinancialAssistant(
  history: ChatMessage[],
  newMessage: string,
  financialContext: {
    totalSpent: number;
    budget: number;
    remaining: number;
    currencySymbol: string;
    topCategories: { name: string; amount: number }[];
    recentExpenses: { merchant: string; amount: number; category: string; date: string }[];
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const model = getModel();

  const systemPrompt = `You are Lekha, a friendly and concise financial assistant inside the "Lekha Tracker" app.

RESPONSE RULES (follow strictly):
- Keep answers SHORT — 1 to 3 sentences unless the user asks for a breakdown.
- Never use hyphens for bullet points, no # headers, no raw asterisk spam.
- For IMPORTANT terms (amounts, category names, page names), wrap them in **double asterisks** like **Groceries** or **kr450**.
- When directing the user to a page or feature, always use a navigation link in this exact format: [Label](/path)
  Available app pages and their paths:
    [Dashboard](/dashboard) — overview and totals
    [Receipts](/receipts) — view and add receipts
    [Budget](/budget) — set and track monthly budget
    [Reports](/reports) — charts and spending trends
    [Settings](/settings) — profile and preferences
    [Admin Panel](/admin) — manage users and roles (admin only)
- If listing steps, use numbered lines: "1. ... 2. ..."
- Only expand if the user explicitly asks "show me more" or "give me details".

User's financial data for this month:
Currency: ${financialContext.currencySymbol}
Budget: ${financialContext.currencySymbol}${financialContext.budget.toFixed(2)}
Spent: ${financialContext.currencySymbol}${financialContext.totalSpent.toFixed(2)}
Remaining: ${financialContext.currencySymbol}${financialContext.remaining.toFixed(2)}

Top categories: ${financialContext.topCategories.map(c => `${c.name} (${financialContext.currencySymbol}${c.amount.toFixed(2)})`).join(', ')}

Recent receipts: ${financialContext.recentExpenses.map(e => `${e.merchant} ${financialContext.currencySymbol}${e.amount.toFixed(2)} on ${e.date}`).join(', ')}

Use this data to give precise, data-driven answers. Never make up numbers.`;

  // Format history for Gemini
  const geminiHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: `System Context (Do not reply to this, just acknowledge it as your persona and data source):\n\n${systemPrompt}` }] },
      { role: 'model', parts: [{ text: 'Understood. I am ready to help the user with their finances based on this data.' }] },
      ...geminiHistory,
    ],
  });

  const result = await chat.sendMessage(newMessage);
  const text = result.response.text();

  return text;
}
