"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Member = { id: string; name: string; image?: string | null };

export type AddGroupExpenseDialogProps = {
    groupId: string;
    currency?: string; // default "AUD"
    members: Member[]; // all group members
    currentUserId: string; // default payer = you
    trigger?: React.ReactNode; // optional custom trigger
    className?: string; // for crayon-btn
    onCreated?: () => void; // callback after success
};

function splitEqualCents(totalCents: number, userIds: string[]) {
    const n = Math.max(1, userIds.length);
    const base = Math.floor(totalCents / n);
    const rem = totalCents - base * n;
    return userIds.map((_, i) => base + (i < rem ? 1 : 0));
}

export default function AddGroupExpenseDialog({
    groupId,
    currency = "AUD",
    members,
    currentUserId,
    trigger,
    className,
    onCreated,
}: AddGroupExpenseDialogProps) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState<string>(""); // dollars as string
    const [payerId, setPayerId] = useState(currentUserId);
    const [includedIds, setIncludedIds] = useState<string[]>(
        members.map((m) => m.id)
    );
    const [submitting, setSubmitting] = useState(false);

    const amountCents = useMemo(() => {
        const n = Number.parseFloat((amount || "0").replace(/[^\d.]/g, ""));
        if (Number.isNaN(n)) return 0;
        return Math.round(n * 100);
    }, [amount]);

    const perUserCents = useMemo(() => {
        return splitEqualCents(amountCents, includedIds);
    }, [amountCents, includedIds]);

    const canSubmit =
        description.trim().length > 0 &&
        amountCents > 0 &&
        includedIds.length > 0 &&
        Boolean(payerId);

    async function onSubmit() {
        try {
            setSubmitting(true);
            const allocations = includedIds.map((uid, idx) => ({
                userId: uid,
                amountCents: perUserCents[idx],
            }));

            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: description.trim(),
                    amountCents,
                    currency,
                    groupId,
                    payerId,
                    allocations, // [{ userId, amountCents }]
                }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || "Failed to create expense");
            }

            toast.success("Expense added", { description: "Equal split recorded ✨" });
            setOpen(false);
            setDescription("");
            setAmount("");
            setIncludedIds(members.map((m) => m.id));
            setPayerId(currentUserId);
            onCreated?.();
            router.refresh();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            toast.error("Couldn’t add expense", { description: message });
        } finally {
            setSubmitting(false);
        }
    }

    function toggleIncluded(id: string) {
        setIncludedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button className={cn("crayon-btn lemon", className)}>
                        Add expense
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="scribble">
                        Add expense (equal split)
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="desc">Description</Label>
                        <Input
                            id="desc"
                            placeholder="e.g. Woolies groceries"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="amt">Amount ({currency})</Label>
                        <Input
                            id="amt"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <p className="text-xs opacity-70">
                            Total in cents: {amountCents.toLocaleString()}
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label>Participants</Label>
                        <div className="crayon-card mint p-3 max-h-48 overflow-auto space-y-2">
                            {members.map((m) => {
                                const idx = includedIds.indexOf(m.id);
                                const share = idx >= 0 ? perUserCents[idx] : 0;
                                return (
                                    <label
                                        key={m.id}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <Checkbox
                                                checked={includedIds.includes(m.id)}
                                                onCheckedChange={() => toggleIncluded(m.id)}
                                            />
                                            <span>{m.name}</span>
                                        </span>
                                        <span className="text-sm opacity-70">
                                            {share > 0 ? `≈ $${(share / 100).toFixed(2)}` : "-"}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                        <p className="text-xs opacity-70">
                            Splitting equally between {includedIds.length} people.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        className="crayon-btn peach"
                        onClick={onSubmit}
                        disabled={!canSubmit || submitting}
                    >
                        {submitting ? "Adding…" : "Add expense"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
