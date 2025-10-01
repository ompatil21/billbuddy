

// src/features/groups/CreateGroupForm.tsx 
"use client";
import { useState } from "react";
import MemberPicker, { UserLite } from "./MemberPicker";

export type CreateGroupDraft = {
    name: string;
    currency?: string;
    memberIds?: string[];
};

export default function CreateGroupForm({ onCreate, autoFocus = false }: { onCreate: (draft: CreateGroupDraft) => Promise<any> | any; autoFocus?: boolean; }) {
    const [name, setName] = useState("");
    const [currency, setCurrency] = useState("AUD");
    const [members, setMembers] = useState<UserLite[]>([]);
    const [submitting, setSubmitting] = useState(false);

    return (
        <form
            className="space-y-4"
            onSubmit={async (e) => {
                e.preventDefault();
                if (!name.trim()) return;
                setSubmitting(true);
                try {
                    await onCreate({ name: name.trim(), currency, memberIds: members.map(m => m.id) });
                    setName("");
                    setMembers([]);
                } finally {
                    setSubmitting(false);
                }
            }}
            aria-busy={submitting}
        >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                    <label htmlFor="group-name" className="block text-xs mb-1 text-pastel-ink/70">Group name</label>
                    <input
                        id="group-name"
                        autoFocus={autoFocus}
                        type="text"
                        placeholder="e.g. Europe Trip, Flat 12A, Project Apollo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full crayon-card rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pastel-blue/50"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="group-currency" className="block text-xs mb-1 text-pastel-ink/70">Currency</label>
                    <select
                        id="group-currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                        className="w-full crayon-card rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pastel-blue/50"
                    >
                        {(["AUD", "USD", "EUR", "GBP", "INR"] as const).map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            <MemberPicker initial={[]} onChange={setMembers} />

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={submitting}
                    className="crayon-btn pastel-blue rounded-xl px-3 py-2 text-sm"
                >
                    {submitting ? "Creating…" : "Create group"}
                </button>
            </div>
        </form>
    );
}
