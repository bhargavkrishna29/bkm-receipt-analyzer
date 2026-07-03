'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/components/DataProvider';
import { chatWithFinancialAssistant } from '@/app/actions/chat';
import type { ChatMessage } from '@/types';

// Parses **bold** and [label](/path) tokens inside a single line of text.
function InlineLine({ text, isUser }: { text: string; isUser: boolean }) {
  // Regex: captures **bold** groups and [label](/path) groups
  const tokenRegex = /(\*\*[^*]+\*\*|\[[^\]]+\]\(\/[^)]*\))/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      // **bold**
      const inner = token.slice(2, -2);
      parts.push(
        <strong key={match.index} className="font-semibold underline decoration-dotted underline-offset-2">
          {inner}
        </strong>
      );
    } else {
      // [label](/path)
      const labelMatch = token.match(/\[([^\]]+)\]\((\/[^)]*)\)/);
      if (labelMatch) {
        const [, label, path] = labelMatch;
        parts.push(
          <NavLink key={match.index} path={path} isUser={isUser}>
            {label}
          </NavLink>
        );
      }
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

// Clickable in-app navigation pill
function NavLink({ path, children, isUser }: { path: string; children: React.ReactNode; isUser: boolean }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(path)}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold underline underline-offset-2 transition-colors cursor-pointer ${
        isUser
          ? 'bg-on-primary/20 text-on-primary hover:bg-on-primary/30'
          : 'bg-primary/10 text-primary hover:bg-primary/20'
      }`}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>arrow_forward</span>
      {children}
    </button>
  );
}

// Renders a full message: splits by newline, renders each line with inline markup
function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split('\n').filter(l => l.trim());
  return (
    <div className="text-sm space-y-1 leading-relaxed">
      {lines.map((line, i) => (
        <p key={i}>
          <InlineLine text={line} isUser={isUser} />
        </p>
      ))}
    </div>
  );
}

export function ChatbotWidget() {
  const { expenses, budget, currencySymbol } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'model',
    content: 'Hi there! I am your Lekha financial assistant. How can I help you understand your spending today?'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Calculate financial context
      const totalSpent = expenses.reduce((acc, exp) => acc + (exp.total || 0), 0);
      const remaining = budget - totalSpent;
      
      const categories = expenses.reduce((acc, exp) => {
        const cat = exp.receiptCategory || 'Other';
        acc[cat] = (acc[cat] || 0) + (exp.total || 0);
        return acc;
      }, {} as Record<string, number>);
      
      const topCategories = Object.entries(categories)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const recentExpenses = expenses
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        .slice(0, 5)
        .map(e => ({
          merchant: e.merchant || 'Unknown',
          amount: e.total || 0,
          category: e.receiptCategory || 'Other',
          date: new Date(e.addedAt).toLocaleDateString()
        }));

      const context = {
        totalSpent,
        budget,
        remaining,
        currencySymbol,
        topCategories,
        recentExpenses
      };

      const aiResponse = await chatWithFinancialAssistant(newMessages, userMsg, context);
      
      setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-surface border border-outline-variant rounded-2xl shadow-xl w-80 md:w-96 mb-4 flex flex-col overflow-hidden transition-all transform origin-bottom-right duration-300 scale-100 opacity-100 h-[500px] max-h-[70vh]">
          {/* Header */}
          <div className="bg-primary text-on-primary p-4 flex justify-between items-center shadow-sm z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined font-variation-fill">smart_toy</span>
              <div>
                <h3 className="font-label-lg font-bold">Lekha Assistant</h3>
                <p className="text-[10px] opacity-80">AI Financial Helper</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-on-primary/10 rounded-full transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-surface-container-lowest">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-on-primary self-end rounded-br-sm' 
                    : 'bg-surface-container text-on-surface self-start rounded-bl-sm border border-outline-variant/30'
                }`}
              >
                <MessageContent content={msg.content} isUser={msg.role === 'user'} />
              </div>
            ))}
            {isLoading && (
              <div className="bg-surface-container text-on-surface self-start rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] border border-outline-variant/30 flex items-center gap-1">
                <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-surface border-t border-outline-variant/50">
            <div className="flex items-center gap-2 bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/50 focus-within:border-primary transition-colors">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your expenses..."
                className="flex-1 bg-transparent border-none outline-none font-body-sm text-sm text-on-surface placeholder:text-on-surface-variant/70"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="text-primary hover:text-primary-container p-1 rounded-full disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined font-variation-fill">send</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAB Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 group"
        >
          <span className="material-symbols-outlined font-variation-fill group-hover:scale-110 transition-transform">smart_toy</span>
        </button>
      )}
    </div>
  );
}
