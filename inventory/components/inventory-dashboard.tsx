"use client";

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { BestsellerChart, CategoryChart, MovementChart, ProfitChart, RevenueChart } from './charts';
import { Button, Card, Input } from './ui';
import type { DashboardPayload, ProductRecord } from '@/lib/types';

// All raw absolute URLs must be prefixed with the basePath (Next only
// auto-prefixes Link/Image/router — not raw fetch() or <img>).
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
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(value || 0);
}
function moneyExact(value: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(value || 0);
}
function pct(value: number) {
  return `${(value || 0).toFixed(0)}%`;
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std`;
  const days = Math.floor(hours / 24);
  return `vor ${days} T`;
}

function changeLabel(current: number, previous: number) {
  const delta = (current || 0) - (previous || 0);
  if (!previous && !current) return { tone: 'flat' as const, arrow: '→', label: 'keine Daten' };
  const ratio = previous ? (delta / Math.abs(previous)) * 100 : 100;
  if (Math.abs(delta) < 0.01) return { tone: 'flat' as const, arrow: '→', label: 'unverändert' };
  const up = delta >= 0;
  return { tone: up ? ('up' as const) : ('down' as const), arrow: up ? '↑' : '↓', label: `${up ? '+' : ''}${ratio.toFixed(0)}% vs. Vormonat` };
}

function productStatus(stock: number) {
  if (stock <= 0) return { label: 'Ausverkauft', cls: 'badge-out' };
  if (stock < 10) return { label: 'Niedrig', cls: 'badge-low' };
  return { label: 'Aktiv', cls: 'badge-active' };
}
function profitOf(p: ProductRecord) {
  return p.price - p.cost;
}
function marginOf(p: ProductRecord) {
  return p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
}

/* ---- tiny inline icons ---- */
const I = {
  cash: 'M3 6h18v12H3zM3 10h18M7 14h2',
  trend: 'M3 17l6-6 4 4 8-8M21 7v5h-5',
  profit: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  box: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8',
  stack: 'M12 2l9 4-9 4-9-4 9-4zM3 12l9 4 9-4M3 17l9 4 9-4',
  cart: 'M6 6h15l-1.5 9h-12zM6 6L5 3H2m4 17a1 1 0 100-2 1 1 0 000 2zm11 0a1 1 0 100-2 1 1 0 000 2z',
  alert: 'M12 2L1 21h22L12 2zm0 7v5m0 3v.5',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  layers: 'M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5',
  tag: 'M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01',
  plus: 'M12 5v14M5 12h14',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  spark: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z',
};
function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function PanelHead({ icon, title, sub, right }: { icon: string; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="panel-head">
      <div className="panel-head-left">
        <div className="panel-icon"><Icon d={icon} /></div>
        <div>
          <div className="panel-title">{title}</div>
          {sub && <div className="panel-sub">{sub}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}

function KpiCard({
  tone = 'blue',
  icon,
  label,
  value,
  delta,
  sub,
  spark,
}: {
  tone?: 'blue' | 'green' | 'orange' | 'red' | 'navy';
  icon: string;
  label: string;
  value: string;
  delta?: { tone: 'up' | 'down' | 'flat'; arrow: string; label: string };
  sub?: string;
  spark?: ReactNode;
}) {
  return (
    <div className="kpi-card" data-tone={tone}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon"><Icon d={icon} /></span>
      </div>
      <div className="kpi-value">{value}</div>
      {delta && <div className={clsx('kpi-delta', delta.tone)}>{delta.arrow} {delta.label}</div>}
      {sub && !delta && <div className="kpi-sub">{sub}</div>}
      {spark && <div className="kpi-spark">{spark}</div>}
    </div>
  );
}

/* ============================================================
   PRODUCT FORM (with purchase price)
   ============================================================ */
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
    <div className="modal-backdrop" onClick={onClose}>
      <Card className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Produkt</p>
            <h3>{product ? 'Produkt bearbeiten' : 'Produkt anlegen'}</h3>
          </div>
          <Button className="ghost small" onClick={onClose}>Schließen</Button>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label">Produktname</label>
            <Input name="name" placeholder="z. B. Nike Dunk Low Panda" defaultValue={product?.name ?? ''} required />
          </div>
          <div className="field">
            <label className="field-label">Kategorie</label>
            <Input name="category" placeholder="z. B. Sneakers" defaultValue={product?.category ?? ''} required />
          </div>
          <div className="form-row">
            <div className="field">
              <label className="field-label">Einkaufspreis (CHF)</label>
              <Input name="cost" type="number" step="0.01" min="0" placeholder="0.00" defaultValue={product?.cost ?? ''} required />
            </div>
            <div className="field">
              <label className="field-label">Verkaufspreis (CHF)</label>
              <Input name="price" type="number" step="0.01" min="0" placeholder="0.00" defaultValue={product?.price ?? ''} required />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label className="field-label">Bestand</label>
              <Input name="stock" type="number" min="0" placeholder="0" defaultValue={product?.stock ?? 0} required />
            </div>
            <div className="field">
              <label className="field-label">Größen</label>
              <Input name="sizes" placeholder="S, M, L, XL" defaultValue={product?.sizes.join(', ') ?? ''} />
            </div>
          </div>
          <div className="field">
            <label className="field-label">Produktbild (optional)</label>
            <Input name="image" type="file" accept="image/*" />
          </div>
          <div className="form-actions">
            <Button className="ghost" type="button" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Speichern…' : 'Speichern'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function RevenueCorrectionForm({ products, onClose, onSaved }: { products: ProductRecord[]; onClose: () => void; onSaved: () => void }) {
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
    <div className="modal-backdrop" onClick={onClose}>
      <Card className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Umsatz</p>
            <h3>Umsatz korrigieren</h3>
          </div>
          <Button className="ghost small" onClick={onClose}>Schließen</Button>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label">Produkt</label>
            <select name="productId" className="input" required defaultValue="">
              <option value="" disabled>Produkt auswählen</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Betrag (CHF)</label>
            <Input name="amount" type="number" step="0.01" placeholder="z. B. 300 oder -120" required />
          </div>
          <div className="field">
            <label className="field-label">Grund / Notiz</label>
            <Input name="reason" placeholder="Optional" />
          </div>
          <div className="form-actions">
            <Button className="ghost" type="button" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Speichern…' : 'Korrigieren'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function StockWarningModal({ product, onClose }: { product: ProductRecord | null; onClose: () => void }) {
  if (!product) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <Card className="modal-card small" onClick={(e) => e.stopPropagation()}>
        <div className="stock-warning-header">
          <div className="warning-mark"><span className="warning-cross">×</span></div>
          <div>
            <p className="eyebrow">Warnung</p>
            <h3>Bestand leer</h3>
          </div>
        </div>
        <p className="stock-warning-copy">
          <strong>{product.name}</strong> hat <strong>0 Stück</strong> auf Lager.<br />
          Ein Verkauf ist deshalb nicht möglich.
        </p>
        <div className="form-actions">
          <Button onClick={onClose}>Verstanden</Button>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   MAIN
   ============================================================ */
export function InventoryDashboard({ view = 'dashboard' }: { view?: InventoryView }) {
  const [range, setRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [editMode, setEditMode] = useState(true);
  const [showEditPrompt, setShowEditPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<'edit' | 'reset' | null>(null);
  const [activeProduct, setActiveProduct] = useState<ProductRecord | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [stockWarningProduct, setStockWarningProduct] = useState<ProductRecord | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  // Products view controls
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'stock' | 'profit' | 'margin' | 'price'>('name');

  useEffect(() => {
    setEditMode(window.sessionStorage.getItem('inventory-edit-mode') !== '0');
  }, []);

  const { data, mutate, isLoading } = useSWR<DashboardPayload>(api(`/api/dashboard?range=${range}`), fetcher, {
    refreshInterval: 20000,
  });

  const products = data?.products ?? [];
  const stats = data?.stats;
  const revenueChange = changeLabel(stats?.currentMonthRevenue ?? 0, stats?.previousMonthRevenue ?? 0);
  const profitChange = changeLabel(stats?.monthProfit ?? 0, stats?.previousMonthProfit ?? 0);
  const inventoryChange = changeLabel(stats?.totalInventoryValue ?? 0, stats?.totalInventoryValuePreviousMonth ?? 0);

  function submitPassword() {
    if (password !== 'admin') return;
    if (pendingAction === 'reset') {
      fetch(api('/api/reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }).then(() => mutate());
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
    window.sessionStorage.setItem('inventory-edit-mode', '0');
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

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).sort(), [products]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const list = products.filter((p) => {
      const matchSearch = !term || p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
      const matchCat = !categoryFilter || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
    return list.sort((a, b) => {
      if (sortKey === 'stock') return a.stock - b.stock;
      if (sortKey === 'price') return b.price - a.price;
      if (sortKey === 'profit') return profitOf(b) - profitOf(a);
      if (sortKey === 'margin') return marginOf(b) - marginOf(a);
      return a.name.localeCompare(b.name);
    });
  }, [products, searchTerm, categoryFilter, sortKey]);

  const lowStock = useMemo(() => [...products].filter((p) => p.stock < 10).sort((a, b) => a.stock - b.stock), [products]);
  const lowMargin = useMemo(() => [...products].filter((p) => marginOf(p) < 30).sort((a, b) => marginOf(a) - marginOf(b)), [products]);
  const byName = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products]);

  /* ---------------- DASHBOARD ---------------- */
  if (view === 'dashboard') {
    return (
      <main className="page-stack">
        <div className="page-head">
          <div>
            <h2>Übersicht</h2>
            <p>Live-Status deines Reselling-Geschäfts auf einen Blick.</p>
          </div>
          <div className="range-tabs">
            {ranges.map((r) => (
              <button key={r.value} className={clsx('range-tab', range === r.value && 'active')} onClick={() => setRange(r.value)}>{r.label}</button>
            ))}
          </div>
        </div>

        <section className="kpi-grid">
          <KpiCard tone="blue" icon={I.cash} label="Umsatz heute" value={isLoading ? '–' : money(stats?.todayRevenue ?? 0)} sub="Verkäufe seit Mitternacht" />
          <KpiCard tone="blue" icon={I.trend} label="Umsatz Monat" value={isLoading ? '–' : money(stats?.currentMonthRevenue ?? 0)} delta={revenueChange} />
          <KpiCard tone="green" icon={I.profit} label="Gewinn (Monat)" value={isLoading ? '–' : money(stats?.monthProfit ?? 0)} delta={profitChange} />
          <KpiCard tone="navy" icon={I.box} label="Warenwert" value={isLoading ? '–' : money(stats?.totalInventoryValue ?? 0)} delta={inventoryChange} />
          <KpiCard tone="navy" icon={I.stack} label="Gesamtbestand" value={isLoading ? '–' : `${stats?.totalStock ?? 0}`} sub={`${stats?.productCount ?? 0} Produkte`} />
          <KpiCard tone="orange" icon={I.cart} label="Offene Verkäufe" value={isLoading ? '–' : `${stats?.openSales ?? 0}`} sub="Heute zu versenden" />
          <KpiCard tone={(stats?.lowStockCount ?? 0) > 0 ? 'red' : 'green'} icon={I.alert} label="Niedrige Bestände" value={isLoading ? '–' : `${stats?.lowStockCount ?? 0}`} sub="Produkte unter 10 Stück" />
          <KpiCard tone="green" icon={I.spark} label="Gewinn gesamt" value={isLoading ? '–' : money(stats?.totalProfit ?? 0)} sub="Letzte 60 Tage" />
        </section>

        <section className="charts-row">
          <div className="panel">
            <PanelHead icon={I.trend} title="Umsatzentwicklung" sub="Umsatz über die Zeit" />
            <RevenueChart data={data?.revenueSeries ?? []} height={240} />
          </div>
          <div className="panel">
            <PanelHead icon={I.profit} title="Gewinnentwicklung" sub="Marge nach Kosten" />
            <ProfitChart data={data?.profitSeries ?? []} height={240} />
          </div>
        </section>

        <section className="section-grid">
          <div className="panel">
            <PanelHead icon={I.cart} title="Letzte Verkäufe" sub="Aktuelle Bewegungen" />
            {(data?.recentSales?.length ?? 0) === 0 ? (
              <p className="kpi-sub">Noch keine Verkäufe erfasst.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Produkt</th><th>Menge</th><th>Umsatz</th><th>Zeit</th></tr>
                  </thead>
                  <tbody>
                    {(data?.recentSales ?? []).map((sale) => (
                      <tr key={sale.id}>
                        <td className="td-strong">{sale.productName}<div className="list-sub">{sale.category}</div></td>
                        <td className="td-muted">{sale.kind === 'adjustment' ? '—' : `${sale.quantity}×`}</td>
                        <td className="td-green">{moneyExact(sale.revenue)}</td>
                        <td className="td-muted">{timeAgo(sale.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="panel">
            <PanelHead icon={I.spark} title="Top Produkte" sub="Nach Umsatz" />
            <div className="list">
              {(data?.bestsellerSeries?.length ?? 0) === 0 ? (
                <p className="kpi-sub">Noch keine Daten.</p>
              ) : (
                (data?.bestsellerSeries ?? []).map((b, i) => (
                  <div className="list-row" key={b.name + i}>
                    <span className={clsx('list-rank', i === 0 && 'top')}>{i + 1}</span>
                    <div className="list-main">
                      <div className="list-name">{b.name}</div>
                      <div className="list-sub">{b.quantity} verkauft</div>
                    </div>
                    <span className="list-value">{money(b.revenue)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="section-grid even">
          <div className="panel">
            <PanelHead icon={I.alert} title="Niedrige Bestände" sub="Bald nachbestellen" />
            <div className="list">
              {lowStock.length === 0 ? (
                <p className="kpi-sub">Alle Bestände sind gesund. 👍</p>
              ) : (
                lowStock.slice(0, 6).map((p) => {
                  const st = productStatus(p.stock);
                  return (
                    <div className="list-row" key={p.id}>
                      <div className="list-main">
                        <div className="list-name">{p.name}</div>
                        <div className="list-sub">{p.category}</div>
                      </div>
                      <span className={clsx('badge', st.cls)}>{p.stock} Stück</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="panel">
            <PanelHead icon={I.list} title="Produktstatus" sub="Aktueller Lagerstatus" />
            <div className="list">
              {byName.length === 0 ? (
                <p className="kpi-sub">Noch keine Produkte.</p>
              ) : (
                byName.slice(0, 6).map((p) => {
                  const st = productStatus(p.stock);
                  return (
                    <div className="list-row" key={p.id}>
                      <div className="list-main">
                        <div className="list-name">{p.name}</div>
                        <div className="list-sub">{money(p.price)} · Marge {pct(marginOf(p))}</div>
                      </div>
                      <span className={clsx('badge', st.cls)}>{st.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  /* ---------------- PRODUCTS ---------------- */
  if (view === 'products') {
    return (
      <main className="page-stack">
        <div className="page-head">
          <div>
            <h2>Produkte</h2>
            <p>Verwalte Bestand, Preise und Margen deines Sortiments.</p>
          </div>
          <div className="page-head-actions">
            {editMode ? (
              <Button className="ghost small" onClick={logoutEditing}>Bearbeitung sperren</Button>
            ) : (
              <Button className="ghost small" onClick={() => startAdminAction('edit')}>Bearbeitung aktivieren</Button>
            )}
            <Button className="danger small" onClick={() => startAdminAction('reset')}>Zurücksetzen</Button>
            <Button onClick={() => { setActiveProduct(null); setShowProductForm(true); }} disabled={!editMode}>
              <Icon d={I.plus} /> Produkt anlegen
            </Button>
          </div>
        </div>

        <div className="toolbar">
          <div className="toolbar-search">
            <Icon d={I.search} />
            <Input placeholder="Produkt oder Kategorie suchen…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="input toolbar-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Alle Kategorien</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input toolbar-select" value={sortKey} onChange={(e) => setSortKey(e.target.value as typeof sortKey)}>
            <option value="name">Sortieren: Name</option>
            <option value="stock">Bestand (niedrig zuerst)</option>
            <option value="price">Verkaufspreis (hoch zuerst)</option>
            <option value="profit">Gewinn (hoch zuerst)</option>
            <option value="margin">Marge (hoch zuerst)</option>
          </select>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="panel">
            <div className="empty-state">
              <div className="empty-icon"><Icon d={I.box} /></div>
              <h4>{products.length === 0 ? 'Noch keine Produkte' : 'Keine Treffer'}</h4>
              <p>{products.length === 0 ? 'Lege dein erstes Produkt an, um Bestand, Margen und Verkäufe zu verfolgen.' : 'Passe Suche oder Filter an, um Produkte zu finden.'}</p>
              {products.length === 0 && editMode && (
                <Button onClick={() => { setActiveProduct(null); setShowProductForm(true); }}><Icon d={I.plus} /> Produkt anlegen</Button>
              )}
            </div>
          </div>
        ) : (
          <section className="product-grid">
            {filteredProducts.map((p) => {
              const st = productStatus(p.stock);
              const profit = profitOf(p);
              return (
                <article className="product-card" key={p.id}>
                  <div className="product-thumb">
                    <img src={asset(p.imagePath)} alt={p.name} />
                    <span className={clsx('badge', st.cls)}>{st.label}</span>
                  </div>
                  <div className="product-info">
                    <div>
                      <div className="product-name">{p.name}</div>
                      <div className="product-cat">{p.category}{p.sizes.length ? ` · ${p.sizes.join(', ')}` : ''}</div>
                    </div>
                    <div className="product-metrics">
                      <div>
                        <div className="metric-label">Einkauf</div>
                        <div className="metric-value">{money(p.cost)}</div>
                      </div>
                      <div>
                        <div className="metric-label">Verkauf</div>
                        <div className="metric-value">{money(p.price)}</div>
                      </div>
                      <div>
                        <div className="metric-label">Gewinn</div>
                        <div className="metric-value profit">{money(profit)}</div>
                      </div>
                      <div>
                        <div className="metric-label">Marge</div>
                        <div className="metric-value margin">{pct(marginOf(p))}</div>
                      </div>
                    </div>
                    <div className="product-foot">
                      <span className="product-stock">Bestand <strong>{p.stock}</strong></span>
                    </div>
                    <div className="product-actions">
                      <Button className="success small" disabled={!editMode || savingAction === `${p.id}-sale`} onClick={() => moveStock(p, 'sale')}>Verkauf erfassen</Button>
                      <Button className="ghost small" disabled={!editMode || savingAction === `${p.id}-restock`} onClick={() => moveStock(p, 'restock')}>Bestand +1</Button>
                      <Button className="ghost small wide" disabled={!editMode} onClick={() => { setActiveProduct(p); setShowProductForm(true); }}>Bearbeiten</Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {showEditPrompt && (
          <div className="modal-backdrop" onClick={() => setShowEditPrompt(false)}>
            <Card className="modal-card small" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <p className="eyebrow">Admin</p>
                  <h3>{pendingAction === 'reset' ? 'Alles zurücksetzen' : 'Bearbeitung aktivieren'}</h3>
                </div>
              </div>
              <Input type="password" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitPassword()} />
              <div className="form-actions split">
                <Button className="ghost" onClick={() => setShowEditPrompt(false)}>Abbrechen</Button>
                <Button className={pendingAction === 'reset' ? 'danger' : ''} onClick={submitPassword}>{pendingAction === 'reset' ? 'Zurücksetzen' : 'Freischalten'}</Button>
              </div>
            </Card>
          </div>
        )}

        {showProductForm && editMode && (
          <ProductForm product={activeProduct} onClose={() => { setShowProductForm(false); setActiveProduct(null); }} onSaved={() => mutate()} />
        )}
        {stockWarningProduct && <StockWarningModal product={stockWarningProduct} onClose={() => setStockWarningProduct(null)} />}
      </main>
    );
  }

  /* ---------------- ANALYTICS ---------------- */
  return (
    <main className="page-stack">
      <div className="page-head">
        <div>
          <h2>Analytics</h2>
          <p>Detaillierte Auswertung von Umsatz, Gewinn und Performance.</p>
        </div>
        <div className="page-head-actions">
          <div className="range-tabs">
            {ranges.map((r) => (
              <button key={r.value} className={clsx('range-tab', range === r.value && 'active')} onClick={() => setRange(r.value)}>{r.label}</button>
            ))}
          </div>
          <Button className="ghost small" onClick={() => (editMode ? setShowRevenueForm(true) : startAdminAction('edit'))}>Umsatz korrigieren</Button>
        </div>
      </div>

      <section className="compare-grid">
        <CompareCard label="Umsatz diesen Monat" now={stats?.currentMonthRevenue ?? 0} prev={stats?.previousMonthRevenue ?? 0} fmt={money} />
        <CompareCard label="Gewinn diesen Monat" now={stats?.monthProfit ?? 0} prev={stats?.previousMonthProfit ?? 0} fmt={money} />
        <CompareCard label="Warenwert" now={stats?.totalInventoryValue ?? 0} prev={stats?.totalInventoryValuePreviousMonth ?? 0} fmt={money} />
      </section>

      <section className="analytics-grid">
        <div className="panel">
          <PanelHead icon={I.trend} title="Umsatzentwicklung" sub="Umsatz über die Zeit" />
          <RevenueChart data={data?.revenueSeries ?? []} height={260} />
        </div>
        <div className="panel">
          <PanelHead icon={I.profit} title="Gewinnentwicklung" sub="Marge nach Einkaufskosten" />
          <ProfitChart data={data?.profitSeries ?? []} height={260} />
        </div>
      </section>

      <section className="analytics-grid">
        <div className="panel">
          <PanelHead icon={I.spark} title="Bestseller Ranking" sub="Top Produkte nach Umsatz" />
          <BestsellerChart data={data?.bestsellerSeries ?? []} height={260} />
        </div>
        <div className="panel">
          <PanelHead icon={I.layers} title="Warenwert nach Kategorie" sub="Umsatzverteilung" />
          <CategoryChart data={data?.categorySeries ?? []} height={260} />
        </div>
      </section>

      <section className="analytics-grid">
        <div className="panel">
          <PanelHead icon={I.stack} title="Lagerbewegungen" sub="Ein- und Ausgänge" />
          <MovementChart data={data?.movementSeries ?? []} height={240} />
        </div>
        <div className="panel">
          <PanelHead icon={I.alert} title="Niedrige Margen" sub="Produkte unter 30% Marge" />
          <div className="list">
            {lowMargin.length === 0 ? (
              <p className="kpi-sub">Alle Produkte haben gesunde Margen. 👍</p>
            ) : (
              lowMargin.slice(0, 7).map((p) => (
                <div className="list-row" key={p.id}>
                  <div className="list-main">
                    <div className="list-name">{p.name}</div>
                    <div className="list-sub">{money(p.cost)} → {money(p.price)}</div>
                  </div>
                  <span className="badge badge-low">{pct(marginOf(p))}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="panel span-2">
          <PanelHead icon={I.list} title="Verkäufe pro Produkt" sub="Verkaufte Menge & Umsatz" />
          {(data?.bestsellerSeries?.length ?? 0) === 0 ? (
            <p className="kpi-sub">Noch keine Verkäufe erfasst.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Produkt</th><th>Verkauft</th><th>Umsatz</th><th>Ø Preis</th></tr>
                </thead>
                <tbody>
                  {(data?.bestsellerSeries ?? []).map((b) => (
                    <tr key={b.name}>
                      <td className="td-strong">{b.name}</td>
                      <td className="td-muted">{b.quantity}×</td>
                      <td className="td-green">{moneyExact(b.revenue)}</td>
                      <td className="td-muted">{moneyExact(b.quantity ? b.revenue / b.quantity : 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {showEditPrompt && (
        <div className="modal-backdrop" onClick={() => setShowEditPrompt(false)}>
          <Card className="modal-card small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Admin</p>
                <h3>Bearbeitung aktivieren</h3>
              </div>
            </div>
            <Input type="password" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitPassword()} />
            <div className="form-actions split">
              <Button className="ghost" onClick={() => setShowEditPrompt(false)}>Abbrechen</Button>
              <Button onClick={submitPassword}>Freischalten</Button>
            </div>
          </Card>
        </div>
      )}
      {showRevenueForm && editMode && (
        <RevenueCorrectionForm products={byName} onClose={() => setShowRevenueForm(false)} onSaved={() => mutate()} />
      )}
    </main>
  );
}

function CompareCard({ label, now, prev, fmt }: { label: string; now: number; prev: number; fmt: (v: number) => string }) {
  const ch = changeLabel(now, prev);
  const ratio = Math.max(0, Math.min(100, prev > 0 ? (now / (now + prev)) * 100 : now > 0 ? 100 : 0));
  return (
    <div className="compare-card">
      <h4>{label}</h4>
      <div className="compare-values">
        <span className="compare-now">{fmt(now)}</span>
        <span className={clsx('kpi-delta', ch.tone)}>{ch.arrow} {ch.label}</span>
      </div>
      <div className="compare-prev">Vormonat: {fmt(prev)}</div>
      <div className="compare-bar"><span style={{ width: `${ratio}%` }} /></div>
    </div>
  );
}
