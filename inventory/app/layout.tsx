import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { InventoryShell } from '@/components/inventory-shell';

export const metadata: Metadata = {
  title: 'Stock Tracking',
  description: 'Clean inventory web app for apparel warehouse operations.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <InventoryShell>{children}</InventoryShell>
      </body>
    </html>
  );
}
