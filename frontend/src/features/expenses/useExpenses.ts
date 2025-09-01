'use client';

import { useEffect, useState } from 'react';

export type ExpenseLite = {
  id: string;
  groupId: string;
  description: string;
  amount_cents: number;
  currency: string;
  dateISO: string;
};

const KEY = 'bb_expenses';
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function read(): ExpenseLite[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(rows: ExpenseLite[]) { localStorage.setItem(KEY, JSON.stringify(rows)); }

export function useExpenses(groupId: string) {
  const [rows, setRows] = useState<ExpenseLite[]>([]);
  useEffect(() => { setRows(read().filter(r => r.groupId === groupId)); }, [groupId]);

  function add(input: { description: string; amount_cents: number; currency: string }) {
    const all = read();
    const row: ExpenseLite = {
      id: uid(), groupId,
      description: input.description.trim(),
      amount_cents: Math.round(input.amount_cents),
      currency: input.currency,
      dateISO: new Date().toISOString(),
    };
    const nextAll = [row, ...all];
    write(nextAll);
    setRows(nextAll.filter(r => r.groupId === groupId));
    return row;
  }

  return { expenses: rows, add };
}
