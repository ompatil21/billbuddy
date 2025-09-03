"use client";
import { cn } from "@/lib/utils";

export function StatCard({
    label,
    value,
    hint,
    className,
    variant = "lemon", // "lemon" | "peach" | "mint" | "sky" | "lilac"
}: {
    label: string;
    value: React.ReactNode;
    hint?: string;
    className?: string;
    variant?: "lemon" | "peach" | "mint" | "sky" | "lilac";
}) {
    return (
        <div className={cn("crayon-card rounded-2xl p-6", variant, className)}>
            <div className="crayon-num text-3xl">{value}</div>
            <div className="mt-1 text-sm opacity-80">{label}</div>
            {hint ? <p className="mt-2 text-xs opacity-70">{hint}</p> : null}
        </div>
    );
}
