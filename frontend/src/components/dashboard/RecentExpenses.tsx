"use client";

import Link from "next/link";
import { CrayonCard } from "@/components/ui/crayon-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExpenseItem = {
    id: string;
    description: string;
    amount: number;          // in your currency
    createdAt: string | Date;
    groupName?: string | null;
    counterpartyName?: string | null; // for direct split
};

export function RecentExpenses({
    expenses,
    className,
}: {
    expenses: ExpenseItem[];
    className?: string;
}) {
    return (
        <CrayonCard title="Recent expenses" className={cn(className)}>
            <ul className="divide-y">
                {expenses.slice(0, 6).map((e) => (
                    <li key={e.id} className="flex items-center justify-between py-3">
                        <div>
                            <div className="font-medium">{e.description}</div>
                            <div className="text-xs opacity-70">
                                {e.groupName ? `In ${e.groupName}` : e.counterpartyName ? `With ${e.counterpartyName}` : "Direct expense"}
                                {" • "}
                                {new Date(e.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-semibold">₹{e.amount.toLocaleString()}</div>
                        </div>
                    </li>
                ))}
            </ul>

            <div className="mt-4 flex justify-end">
                <Button asChild className="crayon-btn">
                    <Link href="/expenses">View all</Link>
                </Button>
            </div>
        </CrayonCard>
    );
}
