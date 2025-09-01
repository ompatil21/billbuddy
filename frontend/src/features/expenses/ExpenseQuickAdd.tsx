'use client';
import { useState } from 'react';

export default function ExpenseQuickAdd({ currency = 'AUD', onAdd }: {
    currency?: string;
    onAdd: (x: { description: string; amount_cents: number; currency: string }) => void;
}) {
    const [desc, setDesc] = useState('');
    const [amt, setAmt] = useState('');

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const val = Number(amt);
        if (!desc.trim() || !isFinite(val) || val <= 0) return;
        onAdd({ description: desc, amount_cents: Math.round(val * 100), currency });
        setDesc(''); setAmt('');
    }
    return (
        <form onSubmit={submit} className="mb-3 flex flex-col gap-2 md:flex-row">
            <input className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Description (e.g., Dinner)" value={desc} onChange={e => setDesc(e.target.value)} />
            <input className="w-40 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Amount" value={amt} onChange={e => setAmt(e.target.value)} />
            <button className="rounded-md bg-black px-3 py-2 text-sm text-white" type="submit">Add</button>
        </form>
    );
}
