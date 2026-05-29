"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import type { ReactNode } from 'react';

const navigation = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/products', label: 'Produkte' },
  { href: '/analytics', label: 'Analytics' },
] as const;

export function InventoryShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowIntro(false);
    }, 850);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="app-shell">
      {showIntro && (
        <div className="loading-screen loading-screen--fixed" aria-label="Lädt">
          <div className="loading-spinner" />
          <div className="loading-brand">ABJ</div>
        </div>
      )}
      <aside className="sidebar">
        <div className="brand-block">
          <p className="brand-label">Stock Tracking</p>
          <h2>Inventory</h2>
        </div>
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={clsx('nav-link', active && 'active')}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <span>Read-Only standard</span>
          <span>Admin in Produkte</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="topbar-kicker">Warehouse control</p>
            <h1>Stock Tracking</h1>
          </div>
        </header>
        <div className="workspace-body">{children}</div>
      </div>
    </div>
  );
}
