'use client';

import { Navigation } from '@/components/Navigation';
import { DataProvider } from '@/components/DataProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <Navigation>{children}</Navigation>
    </DataProvider>
  );
}

