"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCentsAUD } from "@/lib/money";

type ExpenseItem = {
    id: string;
    description: string;
    amountCents: number;           // cents
    createdAt: string | Date;
    groupName?: string;
    counterpartyName?: string;
};

export function RecentExpenses({
    expenses,
    className,
    showTitle = true,
    viewAllHref,
    viewAllClassName,
}: {
    expenses: ExpenseItem[];
    className?: string;
    showTitle?: boolean;
    viewAllHref?: string;
    viewAllClassName?: string;
}) {
    return (
        <div className={cn("crayon-card lilac p-4", className)}>
            {showTitle && <h3 className="scribble text-lg mb-2">Recent expenses</h3>}

            <ul className="divide-y">
                {expenses.slice(0, 6).map((e) => (
                    <li key={e.id} className="flex items-center justify-between py-3">
                        <div>
                            <div className="font-medium">{e.description}</div>
                            <div className="text-xs opacity-70">
                                {e.groupName
                                    ? `In ${e.groupName}`
                                    : e.counterpartyName
                                        ? `With ${e.counterpartyName}`
                                        : "Direct expense"}
                                {" • "}
                                {new Date(e.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="text-right font-semibold">
                            {formatCentsAUD(e.amountCents)}
                        </div>
                    </li>
                ))}
            </ul>

            {viewAllHref && (
                <div className="mt-4 flex justify-end">
                    <Link href={viewAllHref} className={cn("crayon-btn lilac", viewAllClassName)}>
                        View all
                    </Link>
                </div>
            )}
        </div>
    );
}
