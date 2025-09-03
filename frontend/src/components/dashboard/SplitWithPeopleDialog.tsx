/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Search, X, Check, Loader2 } from "lucide-react";

type UserLite = { id: string; name: string | null; email: string | null; image: string | null };

async function searchUsers(q: string) {
    const url = q ? `/api/users/search?q=${encodeURIComponent(q)}` : `/api/users/search`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Search failed");
    return (await res.json()) as UserLite[];
}

export default function SplitWithPeopleDialog({
    onCreated,
    trigger,
    className,
}: {
    onCreated?: () => void;
    trigger?: React.ReactNode;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [options, setOptions] = useState<UserLite[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<UserLite[]>([]);
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState(""); // dollars as string
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // lightweight search effect
    React.useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            try {
                const data = await searchUsers(query);
                if (active) setOptions(data);
            } catch {
                if (active) setOptions([]);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [query]);

    const selectedIds = new Set(selected.map((s) => s.id));
    const amountCents = useMemo(() => {
        const n = parseFloat((amount || "").replace(/[^\d.]/g, ""));
        return Number.isFinite(n) ? Math.round(n * 100) : 0;
    }, [amount]);

    const eachShare = useMemo(() => {
        const n = Math.max(1, selected.length);
        const base = Math.floor(amountCents / n);
        const rem = amountCents - base * n;
        return { base, rem, n };
    }, [amountCents, selected.length]);

    function toggleUser(u: UserLite) {
        setSelected((prev) =>
            prev.some((p) => p.id === u.id) ? prev.filter((p) => p.id !== u.id) : [...prev, u]
        );
    }

    function removeUser(u: UserLite) {
        setSelected((prev) => prev.filter((p) => p.id !== u.id));
    }

    function resetForm() {
        setDescription("");
        setAmount("");
        setSelected([]);
        setError(null);
    }

    async function handleCreate() {
        setError(null);
        if (!description.trim()) return setError("Please add a description.");
        if (amountCents <= 0) return setError("Enter a valid amount.");
        if (selected.length === 0) return setError("Select at least one person.");

        setSubmitting(true);
        try {
            const resp = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: description.trim(),
                    amountCents,
                    currency: "AUD",
                    participantIds: selected.map((s) => s.id), // server does equal split
                }),
            });
            if (!resp.ok) {
                const body = await resp.json().catch(() => ({}));
                throw new Error(body?.error || `Failed (${resp.status})`);
            }

            toast.success("Expense added", { description: "Equal split recorded ✨" });
            setOpen(false);
            resetForm();
            onCreated?.();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to create expense";
            setError(message);
            toast.error("Couldn’t add expense", { description: message });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) resetForm();
            }}
        >
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button className={cn("crayon-btn sky", className)}>Split with people</Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="scribble">Split with people</DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Selected chips */}
                    {selected.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selected.map((u, idx) => {
                                const share =
                                    amountCents > 0
                                        ? (idx < eachShare.rem ? eachShare.base + 1 : eachShare.base) / 100
                                        : 0;
                                return (
                                    <span
                                        key={u.id}
                                        className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-2 py-1 text-xs"
                                    >
                                        <Avatar className="h-4 w-4">
                                            {u.image ? (
                                                <AvatarImage src={u.image} alt={u.name ?? u.email ?? "user"} />
                                            ) : null}
                                            <AvatarFallback>
                                                {(u.name || u.email || "?").slice(0, 1).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="max-w-[120px] truncate">{u.name ?? u.email ?? "Unknown"}</span>
                                        {amountCents > 0 && (
                                            <span className="opacity-70">≈ ${share.toFixed(2)}</span>
                                        )}
                                        <button
                                            type="button"
                                            className="ml-1 opacity-70 hover:opacity-100"
                                            onClick={() => removeUser(u)}
                                            aria-label={`Remove ${u.name ?? u.email ?? "person"}`}
                                            title="Remove"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* Search box */}
                    <div className="space-y-2">
                        <Label htmlFor="search">Search people</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
                            <Input
                                id="search"
                                className="pl-9"
                                placeholder="Type a name or email…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                aria-autocomplete="list"
                                aria-controls="search-results"
                                aria-expanded="true"
                            />
                        </div>

                        {/* Results list */}
                        <div
                            id="search-results"
                            className="crayon-card sky p-2 max-h-44 overflow-auto rounded-2xl"
                            role="listbox"
                            aria-label="Search results"
                            aria-live="polite"
                            aria-busy={loading ? "true" : undefined}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2 p-3 text-sm opacity-70">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Searching…
                                </div>
                            ) : options.length === 0 ? (
                                <div className="p-3 text-sm opacity-70">
                                    {query ? "No people found." : "Start typing to search."}
                                </div>
                            ) : (
                                <ul className="divide-y">
                                    {options.map((u) => {
                                        const active = selectedIds.has(u.id);
                                        return (
                                            <li
                                                key={u.id}
                                                role="option"
                                                aria-selected={active ? "true" : "false"}
                                                className={cn(
                                                    "flex cursor-pointer items-center gap-3 p-2 rounded-lg",
                                                    active && "bg-white/50"
                                                )}
                                                onClick={() => toggleUser(u)}
                                            >
                                                <Avatar className="h-6 w-6">
                                                    {u.image ? (
                                                        <AvatarImage src={u.image} alt={u.name ?? u.email ?? "user"} />
                                                    ) : null}
                                                    <AvatarFallback>
                                                        {(u.name || u.email || "?").slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-medium">
                                                        {u.name ?? u.email ?? "Unknown"}
                                                    </div>
                                                    <div className="truncate text-xs opacity-70">{u.email ?? ""}</div>
                                                </div>
                                                {active ? (
                                                    <Check className="h-4 w-4 opacity-80" />
                                                ) : (
                                                    <span className="text-xs opacity-70">Select</span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="desc">Description</Label>
                        <Input
                            id="desc"
                            placeholder="e.g., Coffee"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (AUD)</Label>
                        <Input
                            id="amount"
                            inputMode="decimal"
                            placeholder="e.g., 9.50"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <div className="flex justify-between text-xs opacity-70">
                            <span>Total in cents: {amountCents.toLocaleString()}</span>
                            <span>
                                {selected.length > 0 && amountCents > 0
                                    ? `Equal split between ${selected.length} → ≈ $${(
                                        eachShare.base / 100
                                    ).toFixed(2)}${eachShare.rem ? " (+1¢ for first " + eachShare.rem + ")" : ""}`
                                    : "Select people and amount"}
                            </span>
                        </div>
                    </div>

                    {error ? <div className="text-sm text-rose-600">{error}</div> : null}
                </div>

                <DialogFooter className="flex justify-end gap-2">
                    <Button
                        type="button"
                        className="crayon-btn lilac"
                        onClick={() => setOpen(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="crayon-btn sky"
                        onClick={handleCreate}
                        disabled={submitting || !description.trim() || amountCents <= 0 || selected.length === 0}
                    >
                        {submitting ? "Creating…" : "Create expense"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
