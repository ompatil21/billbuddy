
// src/features/groups/MemberPicker.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

export type UserLite = { id: string; name: string | null; email: string | null; image?: string | null };

export type MemberPickerProps = {
    /** Current user is auto-included server-side; you can also pass them here to show as selected */
    initial?: UserLite[];
    onChange?: (members: UserLite[]) => void;
    /** Optional async search. Should return a list of users by name/email. */
    searchApi?: (q: string) => Promise<UserLite[]>;
};

// Default search calls /api/users/search?q=<query> and expects [{id,name,email,image}]
async function defaultSearch(q: string): Promise<UserLite[]> {
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.users ?? []) as UserLite[];
}

export default function MemberPicker({ initial = [], onChange, searchApi }: MemberPickerProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<UserLite[]>([]);
    const [selected, setSelected] = useState<UserLite[]>(initial);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        onChange?.(selected);
    }, [selected, onChange]);

    useEffect(() => {
        let ignore = false;
        const run = async () => {
            const q = query.trim();
            if (!q) { setResults([]); return; }
            setLoading(true);
            try {
                const fn = searchApi ?? defaultSearch;
                const out = await fn(q);
                if (!ignore) setResults(out.filter(u => !selected.some(s => s.id === u.id)));
            } finally {
                if (!ignore) setLoading(false);
            }
        };
        const t = setTimeout(run, 200); // debounce
        return () => { ignore = true; clearTimeout(t); };
    }, [query, searchApi, selected]);

    const add = (u: UserLite) => {
        setSelected(prev => [...prev, u]);
        setQuery("");
        setResults([]);
    };
    const remove = (id: string) => setSelected(prev => prev.filter(p => p.id !== id));

    return (
        <div className="space-y-2">
            <div className="text-xs text-pastel-ink/70">Add members by name or email</div>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search people…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full crayon-card rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pastel-blue/50"
                    aria-label="Search people"
                    aria-busy={loading}
                    aria-autocomplete="list"
                />
                {results.length > 0 && (
                    <ul role="listbox" className="absolute z-10 mt-1 w-full max-h-56 overflow-auto crayon-card rounded-xl p-1">
                        {results.map((u) => (
                            <li
                                key={u.id}
                                role="option"
                                className="px-2 py-1.5 rounded-lg hover:bg-pastel-ink/5 cursor-pointer flex items-center gap-2"
                                onClick={() => add(u)}
                            >
                                {u.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={u.image} alt="" className="h-6 w-6 rounded-full" />
                                ) : (
                                    <div className="h-6 w-6 rounded-full bg-pastel-ink/10" />
                                )}
                                <div className="min-w-0">
                                    <div className="text-sm leading-5 truncate">{u.name ?? u.email ?? "Unknown"}</div>
                                    {u.email && <div className="text-xs text-pastel-ink/70 truncate">{u.email}</div>}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2" aria-label="Selected members">
                    {selected.map((u) => (
                        <span key={u.id} className="inline-flex items-center gap-2 text-xs crayon-card rounded-full px-2 py-1">
                            {u.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={u.image} alt="" className="h-4 w-4 rounded-full" />
                            ) : (
                                <div className="h-4 w-4 rounded-full bg-pastel-ink/10" />
                            )}
                            {u.name ?? u.email ?? "Member"}
                            <button className="opacity-60 hover:opacity-100" onClick={() => remove(u.id)} aria-label={`Remove ${u.name ?? u.email}`}>
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
