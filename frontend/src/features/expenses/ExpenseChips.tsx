

// src/features/expenses/ExpenseChips.tsx
"use client";
import { ReactNode } from "react";

export type Person = { id: string; name: string | null; image?: string | null };
export type AllocationChip = { user: Person; amount_cents: number };

export function Pill({ children }: { children: ReactNode }) {
    return <span className="inline-flex items-center gap-1 rounded-full crayon-card px-2 py-1 text-xs" >{children}</span>;
}

export default function ExpenseChips({ payer, allocations, currency }: { payer?: Person; allocations?: AllocationChip[]; currency: string; }) {
    if (!payer && !allocations?.length) return null;
    return (
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-pastel-ink/80">
            {payer && (
                <Pill>
                    <span className="opacity-70">Payer</span> {payer.name ?? "Someone"}
                </Pill>
            )}
            {allocations && allocations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {allocations.map((a) => (
                        <Pill key={a.user.id}>
                            {a.user.name ?? "Member"} • {(a.amount_cents / 100).toLocaleString(undefined, { style: "currency", currency })}
                        </Pill>
                    ))}
                </div>
            )}
        </div>
    );
}


// src/app/(app)/groups/[id]/balances.ts (pure util for tab)
export type BalanceEdge = { from: string; to: string; amount_cents: number };
export type BalanceRow = { fromName: string; toName: string; amount: string };
export type ExpenseForBalance = {
    id: string;
    payer: { id: string; name: string | null };
    allocations: { user: { id: string; name: string | null }; amount_cents: number }[];
    currency: string;
};

export function computeBalances(expenses: ExpenseForBalance[]): BalanceRow[] {
    // net[userId] = amount cents owed (+) or to receive (-)
    const net: Record<string, number> = {};
    const names: Record<string, string> = {};
    let currency = "AUD";

    for (const e of expenses) {
        currency = e.currency;
        names[e.payer.id] = e.payer.name ?? "Payer";
        // Payer paid the whole amount; allocations say who owes what.
        let totalAlloc = 0;
        for (const a of e.allocations) {
            names[a.user.id] = a.user.name ?? "Member";
            totalAlloc += a.amount_cents;
            net[a.user.id] = (net[a.user.id] ?? 0) + a.amount_cents; // owes
        }
        net[e.payer.id] = (net[e.payer.id] ?? 0) - totalAlloc; // is owed
    }

    // Convert net vector into minimal pairwise edges (greedy)
    const debtors: { id: string; amt: number }[] = [];
    const creditors: { id: string; amt: number }[] = [];
    for (const [id, amt] of Object.entries(net)) {
        if (amt > 0) debtors.push({ id, amt });
        else if (amt < 0) creditors.push({ id, amt: -amt });
    }
    debtors.sort((a, b) => b.amt - a.amt);
    creditors.sort((a, b) => b.amt - a.amt);

    const rows: BalanceRow[] = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const d = debtors[i];
        const c = creditors[j];
        const pay = Math.min(d.amt, c.amt);
        rows.push({
            fromName: names[d.id] ?? "Member",
            toName: names[c.id] ?? "Member",
            amount: (pay / 100).toLocaleString(undefined, { style: "currency", currency }),
        });
        d.amt -= pay;
        c.amt -= pay;
        if (d.amt === 0) i++;
        if (c.amt === 0) j++;
    }
    return rows;
}


