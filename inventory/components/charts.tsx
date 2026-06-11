"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CategoryPoint, BestsellerPoint, MovementPoint, ProfitPoint, RevenuePoint } from '@/lib/types';

const COLORS = {
  blue: '#2563eb',
  green: '#16a34a',
  orange: '#f59e0b',
  navy: '#0f172a',
  grid: '#e7ecf3',
  axis: '#94a3b8',
};

const CATEGORY_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ec4899'];
const axisStyle = { fontSize: 11, fill: COLORS.axis };

const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid #e7ecf3',
    boxShadow: '0 12px 32px rgba(15,23,42,0.12)',
    fontSize: 12,
    padding: '8px 12px',
  } as const,
  labelStyle: { color: COLORS.navy, fontWeight: 600 } as const,
};

const chf = (v: number) => `CHF ${Number(v).toLocaleString('de-CH')}`;

export function RevenueChart({ data, height = 300 }: { data: RevenuePoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.28} />
            <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisStyle} minTickGap={18} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} width={48} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [chf(v), 'Umsatz']} />
        <Area type="monotone" dataKey="revenue" stroke={COLORS.blue} strokeWidth={2.5} fill="url(#revFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProfitChart({ data, height = 300 }: { data: ProfitPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.green} stopOpacity={0.28} />
            <stop offset="100%" stopColor={COLORS.green} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisStyle} minTickGap={18} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} width={48} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [chf(v), 'Gewinn']} />
        <Area type="monotone" dataKey="profit" stroke={COLORS.green} strokeWidth={2.5} fill="url(#profitFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Compact sparkline used inside KPI / dashboard cards
export function MiniArea({ data, dataKey, color = COLORS.blue }: { data: { label: string }[]; dataKey: string; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`mini-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip {...tooltipStyle} formatter={(v: number) => [chf(v), '']} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#mini-${dataKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MovementChart({ data, height = 300 }: { data: MovementPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisStyle} minTickGap={18} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} width={40} />
        <Tooltip {...tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar name="Eingang" dataKey="restock" fill={COLORS.blue} radius={[4, 4, 0, 0]} maxBarSize={26} />
        <Bar name="Verkauf" dataKey="sale" fill={COLORS.green} radius={[4, 4, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BestsellerChart({ data, height = 300 }: { data: BestsellerPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 6, right: 12, left: 12, bottom: 0 }}>
        <CartesianGrid stroke={COLORS.grid} horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: COLORS.navy }} width={130} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [chf(v), 'Umsatz']} />
        <Bar dataKey="revenue" fill={COLORS.blue} radius={[0, 5, 5, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({ data, height = 300 }: { data: CategoryPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Tooltip {...tooltipStyle} formatter={(v: number) => [chf(v), '']} />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={64} outerRadius={104} paddingAngle={3} stroke="none">
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
          ))}
        </Pie>
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
