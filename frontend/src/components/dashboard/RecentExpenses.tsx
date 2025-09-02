"use client";

import { formatCentsAUD } from "@/lib/money";

type UserLite = { id: string; name: string | null; image?: string | null };
type GroupLite = { id: string; name: string } | null;
type AllocationLite = { id: string; amountCents: number; user: UserLite };

export type RecentExpense = {
    id: string;
    description: string;
    amountCents: number;
    currency: string;
    createdAt: string; // ISO
    payer: UserLite;
    group: GroupLite;  // null => direct
    allocations: AllocationLite[];
};

export default function RecentExpenses({ items, currentUserId }: { items: RecentExpense[]; currentUserId?: string }) {
    if (!items?.length) {
        return (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600 shadow-sm">
                No expenses yet.
            </div>
        );
    }

    return (
        <div className="rounded-2xl border bg-white p-2 shadow-sm">
            <ul className="divide-y">
                {items.map((e) => {
                    const title = e.group ? `${e.description} · ${e.group.name}` : `${e.description} · Direct`;
                    const youPaid = e.payer.id === currentUserId;
                    const tag = youPaid ? "You paid" : `${e.payer.name ?? "Someone"} paid`;
                    return (
                        <li key={e.id} className="flex items-center justify-between p-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{title}</p>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    {new Date(e.createdAt).toLocaleDateString()} · {tag}
                                </p>
                            </div>
                            <div className="text-sm font-semibold">
                                {formatCentsAUD(e.amountCents)}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
