'use client';

import { useEffect, useMemo, useState } from 'react';

export type GroupLite = {
  id: string;
  name: string;
  currency: string;      // 'AUD' | 'USD' | ...
  memberCount: number;   // we’ll wire real members later
  createdAt: string;     // ISO
};

const KEY = 'bb_groups';

function read(): GroupLite[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(groups: GroupLite[]) {
  localStorage.setItem(KEY, JSON.stringify(groups));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useGroups() {
  const [groups, setGroups] = useState<GroupLite[]>([]);

  useEffect(() => {
    setGroups(read());
  }, []);

  function createGroup(input: { name: string; currency: string }) {
    const g: GroupLite = {
      id: uid(),
      name: input.name.trim(),
      currency: input.currency,
      memberCount: 1,
      createdAt: new Date().toISOString(),
    };
    const next = [g, ...groups];
    setGroups(next);
    write(next);
    return g;
  }

  function removeGroup(id: string) {
    const next = groups.filter(g => g.id !== id);
    setGroups(next);
    write(next);
  }

  return { groups, createGroup, removeGroup };
}
