'use client';

import { useState } from 'react';

type Props = {
    onCreate: (g: { name: string; currency: string }) => void;
    autoFocus?: boolean;
};

const CURRENCIES = ['AUD', 'USD', 'EUR', 'INR', 'GBP'];

export default function CreateGroupForm({ onCreate, autoFocus }: Props) {
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState('AUD');

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate({ name, currency });
        setName('');
        setCurrency('AUD');
    }

    return (
        <form onSubmit={submit} className="rounded-lg border bg-white p-4">
            <div className="mb-3">
                <label className="mb-1 block text-sm font-medium">Group name</label>
                <input
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="Bali Trip, Flat 12A..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus={autoFocus}
                />
            </div>

            <div className="mb-4">
                <label htmlFor="currency-select" className="mb-1 block text-sm font-medium">Currency</label>
                <select
                    id="currency-select"
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                >
                    {CURRENCIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="submit"
                    className="rounded-md bg-black px-3 py-2 text-sm text-white"
                >
                    Create group
                </button>
            </div>
        </form>
    );
}
