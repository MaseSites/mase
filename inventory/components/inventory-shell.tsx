"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import type { ReactNode } from 'react';

const BP = process.env.NEXT_PUBLIC_BASE_PATH || '';

const navigation = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z' },
  { href: '/products', label: 'Produkte', icon: 'M3 7l9-4 9 4-9 4-9-4Zm0 5l9 4 9-4M3 17l9 4 9-4' },
  { href: '/analytics', label: 'Analytics', icon: 'M4 20V10m6 10V4m6 16v-7m4 7H2' },
] as const;

export function InventoryShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [showIntro, setShowIntro] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="app-shell">
      {showIntro && (
        <div className="loading-screen loading-screen--fixed" aria-label="Lädt">
          <div className="loading-spinner" />
          <div className="loading-brand">ABJ</div>
        </div>
      )}

      <aside className={clsx('sidebar', menuOpen && 'sidebar--open')}>
        <div className="brand-block">
          <div className="brand-logo">ABJ</div>
          <div>
            <p className="brand-name">ABJ Reselling</p>
            <p className="brand-label">Control Dashboard</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const active = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
            return (
              <Link key={item.href} href={item.href} className={clsx('nav-link', active && 'active')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="status-dot" />
          <div>
            <span className="foot-strong">System aktiv</span>
            <span>Reselling Control Center</span>
          </div>
        </div>
      </aside>

      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

      <div className="workspace">
        <header className="topbar">
          <button type="button" className="menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Menü">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div>
            <p className="topbar-kicker">ABJ Reselling Dashboard</p>
            <h1>
              {pathname.includes('products') ? 'Produkte' : pathname.includes('analytics') ? 'Analytics' : 'Übersicht'}
            </h1>
          </div>
          <div className="topbar-right">
            <span className="topbar-badge">Live</span>
          </div>
        </header>
        <div className="workspace-body">{children}</div>
      </div>
    </div>
  );
}
