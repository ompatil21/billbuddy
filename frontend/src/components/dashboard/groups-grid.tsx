"use client";

import Link from "next/link";
import { CrayonCard } from "@/components/ui/crayon-card";
import { Button } from "@/components/ui/button";

type Group = {
    id: string;
    name: string;
    membersCount: number;
    balance?: number; // optional: +ve you’re owed, -ve you owe
};

export function GroupsGrid({ groups }: { groups: Group[] }) {
    if (!groups?.length) {
        return (
            <CrayonCard title="Groups">
                <div className="text-sm opacity-80">No groups yet.</div>
                <div className="mt-4">
                    <Button className="crayon-btn" asChild>
                        <Link href="/groups/new">Create a group</Link>
                    </Button>
                </div>
            </CrayonCard>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {groups.map((g) => (
                <CrayonCard key={g.id} className="p-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="scribble text-lg">{g.name}</h3>
                            <p className="mt-1 text-sm opacity-70">{g.membersCount} members</p>
                        </div>
                        {typeof g.balance === "number" && (
                            <div className="text-right">
                                <div className="text-sm opacity-70">Balance</div>
                                <div className="font-semibold">
                                    ₹{Math.abs(g.balance).toLocaleString()} {g.balance >= 0 ? "owed to you" : "you owe"}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button asChild size="sm" className="crayon-btn">
                            <Link href={`/groups/${g.id}`}>Open</Link>
                        </Button>
                    </div>
                </CrayonCard>
            ))}
        </div>
    );
}
