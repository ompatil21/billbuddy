"use client";

export default function StatCard({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint?: string;
}) {
    return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
            {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
        </div>
    );
}
