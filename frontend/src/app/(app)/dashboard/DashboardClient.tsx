"use client";

import { useRouter } from "next/navigation";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";
import SplitWithPeopleDialog from "@/components/dashboard/SplitWithPeopleDialog";
import { formatCentsAUD } from "@/lib/money";

type RecentExpense = {
    id: string;
    description: string;
    amountCents: number;
    date: string;
};

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
        currency: string;
    };
    recentExpenses: RecentExpense[];
}) {
    const router = useRouter();

    return (
        // ◆ pastel background + centered container
        <div className="pastel-page min-h-dvh">
            <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">

                {/* Greeting + quick actions */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        {/* ◆ scribble heading */}
                        <h1 className="scribble text-2xl">Hi, {name.split(" ")[0]} 👋</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            You’re in {groupCount} {groupCount === 1 ? "group" : "groups"}.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {/* ◆ crayon-styled trigger (component likely renders a Button; add className passthrough if needed) */}
                        <SplitWithPeopleDialog
                            // if dialog supports className
                            onCreated={() => router.refresh()}
                        />
                    </div>
                </div>


                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        variant="lemon"
                        label="Total balance"
                        value={formatCentsAUD(stats.totalBalanceCents)}
                        hint={stats.totalBalanceCents >= 0 ? "Overall you’re in credit" : "Overall you owe"}
                    />
                    <StatCard variant="peach" label="You owe" value={formatCentsAUD(stats.youOweCents)} />
                    <StatCard variant="mint" label="You’re owed" value={formatCentsAUD(stats.youAreOwedCents)} />
                </section>

                <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        {/* no external h2, the component provides it */}
                        <RecentExpenses
                            className="lilac p-4"
                            expenses={recentExpenses.map((e) => ({
                                id: e.id,
                                description: e.description,
                                amount: e.amountCents,   // cents
                                createdAt: e.date,
                            }))}
                            viewAllHref="/expenses"
                            viewAllClassName="lilac"
                        />
                    </div>

                </section>
                <div className="lg:col-span-1">
                    <h2 className="scribble mb-3 text-lg">Your groups</h2>
                    {/* ◆ crayon card */}
                    <div className="crayon-card p-6 text-sm text-gray-700">
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
            </div>

        </div>

    );
}
