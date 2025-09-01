'use client';
import { useState } from 'react';

export default function Tabs({
    tabs,
    initial = 0,
}: { tabs: { label: string; content: React.ReactNode }[]; initial?: number }) {
    const [active, setActive] = useState(initial);
    return (
        <div>
            <div className="mb-3 flex gap-1">
                {tabs.map((t, i) => (
                    <button
                        key={t.label}
                        onClick={() => setActive(i)}
                        className={`rounded-md px-3 py-1.5 text-sm ${i === active ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <div className="rounded-lg border bg-white p-4">{tabs[active].content}</div>
        </div>
    );
}
