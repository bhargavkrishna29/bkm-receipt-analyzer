'use client';

import { Navigation } from '@/components/Navigation';
import { DataProvider } from '@/components/DataProvider';
import { ChatbotWidget } from '@/components/ChatbotWidget';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <Navigation>{children}</Navigation>
      <ChatbotWidget />
    </DataProvider>
  );
}

