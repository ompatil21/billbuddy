"use client";

import { useRouter } from "next/navigation";
import StatCard from "@/components/dashboard/StatCard";
import RecentExpenses, { RecentExpense } from "@/components/dashboard/RecentExpenses";
import SplitWithPeopleDialog from "@/components/dashboard/SplitWithPeopleDialog";
import { formatCentsAUD } from "@/lib/money";

type GroupLite = { id: string; name: string; currency: string; createdAt: string };

export default function DashboardClient({
    name,
    groupCount,
    groups,
    stats,
    recentExpenses,
}: {
    name: string;
    groupCount: number;
    groups: GroupLite[];
    stats: {
        youAreOwedCents: number;
        youOweCents: number;
        totalBalanceCents: number;
        currency: string; // "AUD"
    };
    recentExpenses: RecentExpense[];
}) {
    const router = useRouter();

    return (
        <div className="space-y-6">
            {/* Greeting + quick actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-semibold">Hi, {name.split(" ")[0]} 👋</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        You’re in {groupCount} {groupCount === 1 ? "group" : "groups"}.
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* existing quick actions… */}
                    <SplitWithPeopleDialog onCreated={() => router.refresh()} />
                </div>
            </div>

            {/* Stats row */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    label="Total balance"
                    value={formatCentsAUD(stats.totalBalanceCents)}
                    hint={stats.totalBalanceCents >= 0 ? "Overall you’re in credit" : "Overall you owe"}
                />
                <StatCard label="You owe" value={formatCentsAUD(stats.youOweCents)} />
                <StatCard label="You’re owed" value={formatCentsAUD(stats.youAreOwedCents)} />
            </section>

            {/* Two-column layout */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <h2 className="mb-2 text-sm font-semibold text-gray-700">Recent expenses</h2>
                    <RecentExpenses items={recentExpenses} />
                </div>

                <div className="lg:col-span-1">
                    <h2 className="mb-2 text-sm font-semibold text-gray-700">Your groups</h2>
                    <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600 shadow-sm">
                        {groups.length === 0 ? (
                            <>No groups yet — create one to start splitting!</>
                        ) : (
                            <ul className="space-y-2">
                                {groups.map((g) => (
                                    <li key={g.id} className="flex items-center justify-between">
                                        <span className="truncate">{g.name}</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(g.createdAt).toLocaleDateString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
