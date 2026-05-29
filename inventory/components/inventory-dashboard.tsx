"use client";

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { BestsellerChart, CategoryChart, MovementChart, RevenueChart } from './charts';
import { Button, Card, Input } from './ui';
import type { DashboardPayload, ProductRecord } from '@/lib/types';

// Base path the app is mounted under (set in next.config.mjs). All raw
// absolute URLs (fetch '/api/...', <img src="/uploads/...">) must be prefixed
// with this, because Next only auto-prefixes <Link>/<Image>/router — not raw
// fetch() or <img>.
const BP = process.env.NEXT_PUBLIC_BASE_PATH || '';
const api = (path: string) => `${BP}${path}`;
const asset = (path: string) => (path && path.startsWith('/') ? `${BP}${path}` : path);

const fetcher = async (url: string) => fetch(url).then((response) => response.json());
const ranges = [
  { value: 'day', label: 'Tag' },
  { value: 'week', label: 'Woche' },
  { value: 'month', label: 'Monat' },
  { value: 'year', label: 'Jahr' },
] as const;

export type InventoryView = 'dashboard' | 'products' | 'analytics';

function money(value: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(value);
}

function changeLabel(current: number, previous: number) {
  const delta = Number((current - previous).toFixed(2));
  const isPositive = delta >= 0;
  return {
    delta,
    tone: isPositive ? 'positive' : 'negative',
    arrow: isPositive ? '↑' : '↓',
    label: `${isPositive ? '+' : ''}${money(Math.abs(delta))} gegenüber Vormonat`,
  };
}

function ProductForm({ product, onClose, onSaved }: { product?: ProductRecord | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const formData = new FormData(event.currentTarget);

    await fetch(product ? api(`/api/products/${product.id}`) : api('/api/products'), {
      method: product ? 'PUT' : 'POST',
      body: formData,
    });

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <Card className="modal-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Produkt</p>
            <h3>{product ? 'Produkt bearbeiten' : 'Produkt anlegen'}</h3>
          </div>
          <Button className="ghost" onClick={onClose}>Schließen</Button>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <Input name="name" placeholder="Name" defaultValue={product?.name ?? ''} required />
          <Input name="category" placeholder="Kategorie" defaultValue={product?.category ?? ''} required />
          <Input name="price" type="number" step="0.01" min="0" placeholder="Preis" defaultValue={product?.price ?? ''} required />
          <Input name="stock" type="number" min="0" placeholder="Bestand" defaultValue={product?.stock ?? 0} required />
          <Input name="sizes" placeholder="Größen, z. B. XS,S,M,L,XL" defaultValue={product?.sizes.join(', ') ?? 'XS, S, M, L, XL'} required />
          <Input name="image" type="file" accept="image/*" />
          <div className="form-actions">
            <Button type="submit" disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function RevenueCorrectionForm({
  products,
  onClose,
  onSaved,
}: {
  products: ProductRecord[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const formData = new FormData(event.currentTarget);

    const response = await fetch(api('/api/revenue-adjustment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: String(formData.get('productId') ?? ''),
        amount: Number(formData.get('amount') ?? 0),
        reason: String(formData.get('reason') ?? '').trim(),
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      alert(payload?.error ?? 'Korrektur konnte nicht gespeichert werden');
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <Card className="modal-card">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Umsatz</p>
            <h3>Umsatz korrigieren</h3>
          </div>
          <Button className="ghost" onClick={onClose}>Schließen</Button>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <select name="productId" className="input" required defaultValue="">
            <option value="" disabled>Produkt auswählen</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
          <Input name="amount" type="number" step="0.01" placeholder="Betrag, z. B. 300 oder -120" required />
          <Input name="reason" placeholder="Grund / Notiz" />
          <div className="form-actions">
            <Button type="submit" disabled={saving}>{saving ? 'Speichern...' : 'Korrigieren'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="warning-icon">
      <path d="M12 2 1 21h22L12 2Zm0 6.2 1 6.1h-2l1-6.1Zm0 10.9a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z" />
    </svg>
  );
}

function StockName({ product }: { product: ProductRecord }) {
  const shouldWarn = product.stock <= 5;

  return (
    <strong className={clsx('product-title-row', shouldWarn && 'product-title-row-warning')}>
      {shouldWarn && <WarningIcon />}
      <span>{product.name}</span>
    </strong>
  );
}

function StockWarningModal({ product, onClose }: { product: ProductRecord | null; onClose: () => void }) {
  if (!product) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <Card className="modal-card small stock-warning-modal">
        <div className="stock-warning-header">
          <div className="warning-mark">
            <span className="warning-cross">×</span>
          </div>
          <div>
            <p className="eyebrow">Warnung</p>
            <h3>Bestand gesperrt</h3>
          </div>
        </div>
        <p className="stock-warning-copy">
          <strong>{product.name}</strong> hat bereits <strong>0 Stück</strong>.
          <br />
          Ein Verkauf ist deshalb nicht möglich.
        </p>
        <div className="form-actions">
          <Button onClick={onClose}>OK</Button>
        </div>
      </Card>
    </div>
  );
}

export function InventoryDashboard({ view = 'dashboard' }: { view?: InventoryView }) {
  const [range, setRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [editMode, setEditMode] = useState(false);
  const [showEditPrompt, setShowEditPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<'edit' | 'reset' | null>(null);
  const [activeProduct, setActiveProduct] = useState<ProductRecord | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [stockWarningProduct, setStockWarningProduct] = useState<ProductRecord | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  useEffect(() => {
    setEditMode(window.sessionStorage.getItem('inventory-edit-mode') === '1');
  }, []);

  const { data, mutate, isLoading } = useSWR<DashboardPayload>(api(`/api/dashboard?range=${range}`), fetcher, {
    refreshInterval: 15000,
  });

  const products = data?.products ?? [];
  const stats = data?.stats;
  const revenueChange = changeLabel(stats?.currentMonthRevenue ?? 0, stats?.previousMonthRevenue ?? 0);
  const inventoryChange = changeLabel(stats?.totalInventoryValue ?? 0, stats?.totalInventoryValuePreviousMonth ?? 0);

  async function submitPassword() {
    if (password !== 'admin') {
      return;
    }

    if (pendingAction === 'reset') {
      await fetch(api('/api/reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      window.sessionStorage.removeItem('inventory-edit-mode');
      setEditMode(false);
      await mutate();
    } else {
      window.sessionStorage.setItem('inventory-edit-mode', '1');
      setEditMode(true);
    }

    setShowEditPrompt(false);
    setPassword('');
    setPendingAction(null);
  }

  function startAdminAction(action: 'edit' | 'reset') {
    setPendingAction(action);
    setShowEditPrompt(true);
  }

  function logoutEditing() {
    window.sessionStorage.removeItem('inventory-edit-mode');
    setEditMode(false);
  }

  async function moveStock(product: ProductRecord, kind: 'restock' | 'sale') {
    if (kind === 'sale' && product.stock <= 0) {
      setStockWarningProduct(product);
      return;
    }

    setSavingAction(`${product.id}-${kind}`);
    const response = await fetch(api('/api/movement'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, kind, quantity: 1 }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      alert(payload?.error ?? 'Aktion konnte nicht ausgeführt werden');
      setSavingAction(null);
      return;
    }

    await mutate();
    setSavingAction(null);
  }

  const sortedProducts = useMemo(() => [...products].sort((left, right) => left.name.localeCompare(right.name)), [products]);

  const sortedByStock = useMemo(() => [...products].sort((left, right) => left.stock - right.stock), [products]);

  function stockToneClass(stock: number) {
    if (stock <= 5) {
      return 'stock-red';
    }
    if (stock <= 15) {
      return 'stock-yellow';
    }
    return 'stock-green';
  }

  const pageCopy = {
    dashboard: {
      eyebrow: 'Dashboard',
      title: 'Überblick',
      copy: 'Kernzahlen und Live-Status auf einen Blick.',
    },
    products: {
      eyebrow: 'Produkte',
      title: 'Produkte',
      copy: 'Schnelle Eingänge, Verkäufe und Bearbeitung an einem Ort.',
    },
    analytics: {
      eyebrow: 'Analytics',
      title: 'Auswertung',
      copy: 'Visuelle Auswertung für Umsatz, Bewegungen und Bestseller.',
    },
  }[view];

  return (
    <main className="page-stack">
      <section className="hero card hero-compact">
        <div>
          <p className="eyebrow">{pageCopy.eyebrow}</p>
          <h1>{pageCopy.title}</h1>
          <p className="hero-copy">{pageCopy.copy}</p>
        </div>
        {view === 'products' && (
          <div className="hero-actions">
            <Button onClick={() => startAdminAction('edit')}>{editMode ? 'Bearbeitung aktiv' : 'Bearbeitung aktivieren'}</Button>
            {editMode && <Button className="ghost" onClick={logoutEditing}>Abmelden</Button>}
            <Button className="ghost danger" onClick={() => startAdminAction('reset')}>Alles zurücksetzen</Button>
            <Button className="ghost" onClick={() => setShowProductForm(true)} disabled={!editMode}>Produkt anlegen</Button>
          </div>
        )}
      </section>

      {view !== 'products' && (
        <section className="kpi-grid">
          <Card>
            <p className="eyebrow">Umsatz</p>
            <h2>{isLoading ? '–' : money(stats?.currentMonthRevenue ?? 0)}</h2>
            <p className={clsx('metric-delta', revenueChange.tone)}>{revenueChange.arrow} {revenueChange.label}</p>
          </Card>
          <Card>
            <p className="eyebrow">Warenwert</p>
            <h2>{isLoading ? '–' : money(stats?.totalInventoryValue ?? 0)}</h2>
            <p className={clsx('metric-delta', inventoryChange.tone)}>{inventoryChange.arrow} {inventoryChange.label}</p>
          </Card>
          <Card>
            <p className="eyebrow">Gesamtbestand</p>
            <h2>{isLoading ? '–' : stats?.totalStock ?? 0}</h2>
          </Card>
        </section>
      )}

      {view === 'dashboard' && (
        <section className="dashboard-grid">
          <Card className="dashboard-panel">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Status</p>
                <h3>Niedrige Bestände</h3>
              </div>
            </div>
            <div className="summary-list">
              {sortedByStock.length === 0 ? (
                <p className="empty-state">Noch keine Produkte vorhanden.</p>
              ) : (
                sortedByStock.slice(0, 5).map((product) => (
                  <div key={product.id} className={clsx('summary-row', product.stock <= 5 && 'summary-row-warning')}>
                    <div>
                      <StockName product={product} />
                      <p>{product.category}</p>
                    </div>
                    <span className={clsx('pill', stockToneClass(product.stock))}>{product.stock} Stück</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="dashboard-panel">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Übersicht</p>
                <h3>Produkt-Status</h3>
              </div>
            </div>
            <div className="summary-list">
              {sortedProducts.length === 0 ? (
                <p className="empty-state">Die Übersicht ist leer, bis du Produkte anlegst.</p>
              ) : (
                sortedProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="summary-row">
                    <div>
                      <strong>{product.name}</strong>
                      <p>{product.category}</p>
                    </div>
                    <span>{money(product.price)}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>
      )}

      {view === 'products' && (
        <section className="content-grid single-column">
          <div className="section-block card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Produkte</p>
                <h3>Übersicht</h3>
              </div>
            </div>
            <div className="product-grid">
              {sortedProducts.length === 0 ? (
                <div className="empty-card">
                  <h4>Keine Produkte vorhanden</h4>
                  <p>Aktiviere Bearbeitung und lege das erste Produkt an.</p>
                </div>
              ) : (
                sortedProducts.map((product) => (
                  <article key={product.id} className="product-card">
                    <img src={asset(product.imagePath)} alt={product.name} className="product-image" />
                    <div className="product-body">
                      <div className="product-topline">
                        <div>
                          <h4 className="product-card-title">
                            <StockName product={product} />
                          </h4>
                          <p>{product.category}</p>
                        </div>
                        <span className={clsx('pill', stockToneClass(product.stock))}>Bestand {product.stock}</span>
                      </div>
                      <div className="product-meta">
                        <span>Größen: {product.sizes.join(', ')}</span>
                        <strong>{money(product.price)}</strong>
                      </div>
                      <div className="product-actions">
                        <Button className="ghost" disabled={!editMode || savingAction === `${product.id}-restock`} onClick={() => moveStock(product, 'restock')}>
                          + Eingang
                        </Button>
                        <Button disabled={!editMode || savingAction === `${product.id}-sale`} onClick={() => moveStock(product, 'sale')}>
                          - Verkauf
                        </Button>
                        <Button className="ghost" disabled={!editMode} onClick={() => { setActiveProduct(product); setShowProductForm(true); }}>
                          Bearbeiten
                        </Button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {view === 'analytics' && (
        <section className="analytics-column">
          <Card className="analytics-card">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Korrekturen</p>
                <h3>Umsatz anpassen</h3>
              </div>
              <Button
                className="ghost"
                onClick={() => (editMode ? setShowRevenueForm(true) : startAdminAction('edit'))}
              >
                {editMode ? 'Umsatz korrigieren' : 'Bearbeitung aktivieren'}
              </Button>
            </div>
            <div className="analytics-kpi-grid">
              <div>
                <p className="eyebrow">Produkte</p>
                <h3>{isLoading ? '–' : stats?.productCount ?? 0}</h3>
              </div>
            </div>
          </Card>
          <Card className="analytics-card">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Umsatz</p>
                <h3>Entwicklung</h3>
              </div>
            </div>
            <RevenueChart data={data?.revenueSeries ?? []} />
          </Card>
          <Card className="analytics-card">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Lagerbewegungen</p>
                <h3>Ein- und Ausgänge</h3>
              </div>
              <div className="filter-row">
                {ranges.map((item) => (
                  <button key={item.value} type="button" className={clsx('segmented', range === item.value && 'selected')} onClick={() => setRange(item.value)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <MovementChart data={data?.movementSeries ?? []} />
          </Card>
          <Card className="analytics-card">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Bestseller</p>
                <h3>Top Produkte</h3>
              </div>
            </div>
            <BestsellerChart data={data?.bestsellerSeries ?? []} />
          </Card>
          <Card className="analytics-card">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Kategorien</p>
                <h3>Verkauf nach Segment</h3>
              </div>
            </div>
            <CategoryChart data={data?.categorySeries ?? []} />
          </Card>
        </section>
      )}

      {view === 'products' && showEditPrompt && (
        <div className="modal-backdrop">
          <Card className="modal-card small">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Admin</p>
                <h3>{pendingAction === 'reset' ? 'Alles zurücksetzen' : 'Bearbeitung aktivieren'}</h3>
              </div>
            </div>
            <Input type="password" placeholder="Passwort" value={password} onChange={(event) => setPassword(event.target.value)} />
            <div className="form-actions split">
              <Button className="ghost" onClick={() => setShowEditPrompt(false)}>Abbrechen</Button>
              <Button onClick={submitPassword}>{pendingAction === 'reset' ? 'Zurücksetzen' : 'Freischalten'}</Button>
            </div>
          </Card>
        </div>
      )}

      {view === 'products' && showProductForm && editMode && (
        <ProductForm product={activeProduct} onClose={() => { setShowProductForm(false); setActiveProduct(null); }} onSaved={() => mutate()} />
      )}

      {view === 'analytics' && showRevenueForm && editMode && (
        <RevenueCorrectionForm products={sortedProducts} onClose={() => setShowRevenueForm(false)} onSaved={() => mutate()} />
      )}

      {stockWarningProduct && (
        <StockWarningModal product={stockWarningProduct} onClose={() => setStockWarningProduct(null)} />
      )}
    </main>
  );
}
