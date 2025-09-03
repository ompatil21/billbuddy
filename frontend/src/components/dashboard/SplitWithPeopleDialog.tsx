/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type UserLite = { id: string; name: string | null; email: string | null; image: string | null };

async function searchUsers(q: string) {
    const url = q ? `/api/users/search?q=${encodeURIComponent(q)}` : `/api/users/search`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Search failed");
    return (await res.json()) as UserLite[];
}

export default function SplitWithPeopleDialog({ onCreated }: { onCreated?: () => void }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [options, setOptions] = useState<UserLite[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<UserLite[]>([]);
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState(""); // dollars as string input
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Debounced search
    React.useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            try {
                const data = await searchUsers(query);
                if (active) setOptions(data);
            } catch (e) {
                if (active) setOptions([]);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [query]);

    const optionMap = useMemo(() => new Map(options.map(o => [o.id, o])), [options]);
    const selectedIds = new Set(selected.map(s => s.id));

    function toggleUser(u: UserLite) {
        if (selectedIds.has(u.id)) {
            setSelected(prev => prev.filter(p => p.id !== u.id));
        } else {
            setSelected(prev => [...prev, u]);
        }
    }

    async function handleCreate() {
        setError(null);
        if (!description.trim()) return setError("Please add a description.");
        const cents = Math.round(Number(amount) * 100);
        if (!Number.isFinite(cents) || cents <= 0) return setError("Enter a valid amount.");

        if (selected.length === 0) return setError("Select at least one person.");

        setSubmitting(true);
        try {
            const resp = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: description.trim(),
                    amountCents: cents,
                    currency: "AUD",
                    participantIds: selected.map(s => s.id), // direct split (no groupId)
                }),
            });
            if (!resp.ok) {
                const body = await resp.json().catch(() => ({}));
                throw new Error(body?.error || `Failed (${resp.status})`);
            }
            // success
            setOpen(false);
            setDescription("");
            setAmount("");
            setSelected([]);
            onCreated?.();
        } catch (e: any) {
            setError(e.message || "Failed to create expense");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="crayon-btn blue">Split with people</button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Split with people</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="space-y-2">
                        <Label htmlFor="search">Search people</Label>
                        <Input
                            id="search"
                            placeholder="Type a name or email…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <div className="max-h-40 overflow-auto rounded-md border">
                            {loading ? (
                                <div className="p-3 text-sm text-gray-500">Searching…</div>
                            ) : options.length === 0 ? (
                                <div className="p-3 text-sm text-gray-500">No people found.</div>
                            ) : (
                                <ul className="divide-y">
                                    {options.map((u) => {
                                        const active = selectedIds.has(u.id);
                                        return (
                                            <li
                                                key={u.id}
                                                className={`flex cursor-pointer items-center gap-3 p-2 ${active ? "bg-gray-50" : ""}`}
                                                onClick={() => toggleUser(u)}
                                            >
                                                <Avatar className="h-6 w-6">
                                                    {u.image ? <AvatarImage src={u.image} alt={u.name ?? u.email ?? "user"} /> : null}
                                                    <AvatarFallback>{(u.name || u.email || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-medium">{u.name ?? u.email ?? "Unknown"}</div>
                                                    <div className="truncate text-xs text-gray-500">{u.email ?? ""}</div>
                                                </div>
                                                <div className="text-xs">{active ? "Selected" : "Select"}</div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {selected.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {selected.map((u) => (
                                    <span
                                        key={u.id}
                                        className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs"
                                    >
                                        <Avatar className="h-4 w-4">
                                            {u.image ? <AvatarImage src={u.image} alt={u.name ?? u.email ?? "user"} /> : null}
                                            <AvatarFallback>{(u.name || u.email || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        {u.name ?? u.email ?? "Unknown"}
                                        <button
                                            className="ml-1 text-gray-500 hover:text-gray-700"
                                            onClick={() => toggleUser(u)}
                                            title="Remove"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
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
                    </div>

                    {error ? <div className="text-sm text-rose-600">{error}</div> : null}

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={submitting}>
                            {submitting ? "Creating…" : "Create expense"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
