"use client";

import { CrayonCard } from "@/components/ui/crayon-card";
import { cn } from "@/lib/utils";

// components/dashboard/StatCard.tsx
export function StatCard({
    label, value, hint, className,
}: { label: string; value: React.ReactNode; hint?: string; className?: string }) {
    return (
        <div className={["rounded-2xl border bg-white shadow-sm p-5", className].filter(Boolean).join(" ")}>
            <div className="text-3xl font-semibold tracking-tight">{value}</div>
            <div className="mt-1 text-sm opacity-80">{label}</div>
            {hint ? <p className="mt-2 text-xs opacity-70">{hint}</p> : null}
        </div>
    );
}
