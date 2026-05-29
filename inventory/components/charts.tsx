"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CategoryPoint, BestsellerPoint, MovementPoint, RevenuePoint } from '@/lib/types';

const axisStyle = { fontSize: 12, fill: '#777777' };

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#ecebe7" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} />
        <Tooltip />
        <Line type="monotone" dataKey="revenue" stroke="#1f7a45" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MovementChart({ data }: { data: MovementPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#ecebe7" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} />
        <Tooltip />
        <Legend />
        <Bar dataKey="restock" fill="#1f7a45" radius={[6, 6, 0, 0]} />
        <Bar dataKey="sale" fill="#222222" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BestsellerChart({ data }: { data: BestsellerPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
        <CartesianGrid stroke="#ecebe7" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={axisStyle} width={110} />
        <Tooltip />
        <Bar dataKey="revenue" fill="#1f7a45" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({ data }: { data: CategoryPoint[] }) {
  const colors = ['#1f7a45', '#262626', '#818181', '#c0c0bb', '#dfe6e1'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Tooltip />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
