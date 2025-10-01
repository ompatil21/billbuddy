// src/app/(app)/groups/page.tsx
"use client";

import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import GroupCard from "@/features/groups/GroupCard";
import { useGroups } from "@/features/groups/useGroups";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { PlusCircle, X, Search, UserPlus, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

/** ---------- Types & adapters (TS-safe) ---------- **/
type MinimalGroup = { id: string; name: string };
type CreateGroupDraft = { name: string; currency?: string; memberIds?: string[] };

// Accept both legacy and modern create signatures; sync or async.
type CreateGroupFn =
  | ((input: { name: string; currency: string; memberIds?: string[] }) => Promise<MinimalGroup> | MinimalGroup)
  | ((input: { name: string; currency: string }) => Promise<MinimalGroup> | MinimalGroup);

/**
 * Normalizes to a Promise and gracefully handles legacy signatures.
 * - Uppercases/defaults currency (AUD).
 * - Tries passing memberIds; if unsupported, falls back.
 */
async function createGroupSafe(fn: CreateGroupFn, draft: CreateGroupDraft): Promise<MinimalGroup> {
  const base = { name: draft.name, currency: (draft.currency ?? "AUD").toUpperCase() };

  try {
    // Try modern path first (may be the same as legacy if it ignores memberIds)
    const maybe = await Promise.resolve(
      // @ts-expect-error allow memberIds for newer API; legacy may ignore/throw
      fn(draft.memberIds && draft.memberIds.length ? { ...base, memberIds: draft.memberIds } : base)
    );
    return maybe as MinimalGroup;
  } catch {
    // Strict legacy fallback
    const fallback = await Promise.resolve((fn as (i: { name: string; currency: string }) => MinimalGroup)(base));
    return fallback as MinimalGroup;
  }
}

/** ---------- Lightweight Member Picker (search friends/users) ---------- **/
type LiteUser = { id: string; name: string | null; email: string | null; image?: string | null };

function usePeopleSearch() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LiteUser[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Prefer friends search; fall back to users search
        const url1 = `/api/friends/search?q=${encodeURIComponent(q.trim())}`;
        const res1 = await fetch(url1);
        if (res1.ok) {
          const data = (await res1.json()) as { users: LiteUser[] } | LiteUser[];
          setResults(Array.isArray(data) ? data : data.users ?? []);
        } else {
          const url2 = `/api/users/search?q=${encodeURIComponent(q.trim())}`;
          const res2 = await fetch(url2);
          if (res2.ok) {
            const data = (await res2.json()) as { users: LiteUser[] } | LiteUser[];
            setResults(Array.isArray(data) ? data : data.users ?? []);
          } else {
            setResults([]);
          }
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  return { q, setQ, loading, results };
}

function MemberChip({ u, onRemove }: { u: LiteUser; onRemove: (id: string) => void }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs crayon-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {u.image ? <img src={u.image} alt="" className="h-4 w-4 rounded-full" /> : <span className="h-4 w-4 rounded-full bg-pastel-ink/10" />}
      {u.name ?? u.email ?? "User"}
      <button
        type="button"
        onClick={() => onRemove(u.id)}
        className="ml-1 rounded-full px-1 leading-none text-pastel-ink/70 hover:text-pastel-ink/100"
        aria-label={`Remove ${u.name ?? u.email ?? "user"}`}
        title="Remove"
      >
        ×
      </button>
    </span>
  );
}

function MemberPicker({
  selected,
  setSelected,
}: {
  selected: LiteUser[];
  setSelected: (users: LiteUser[]) => void;
}) {
  const { q, setQ, loading, results } = usePeopleSearch();

  const addUser = useCallback(
    (u: LiteUser) => {
      if (selected.some((s) => s.id === u.id)) return;
      setSelected([...selected, u]);
      setQ(""); // clear search
    },
    [selected, setSelected, setQ]
  );

  const removeUser = useCallback(
    (id: string) => setSelected(selected.filter((s) => s.id !== id)),
    [selected, setSelected]
  );

  const visible = useMemo(() => {
    if (!results.length) return [];
    const existing = new Set(selected.map((s) => s.id));
    return results.filter((r) => !existing.has(r.id));
  }, [results, selected]);

  return (
    <div className="space-y-2">
      <label htmlFor="member-search" className="text-xs font-medium text-pastel-ink/80">
        Add members
      </label>
      <div className="relative">
        <input
          id="member-search"
          type="search"
          placeholder="Search friends by name or email…"
          className="w-full pl-8 pr-10 py-2 text-sm rounded-xl crayon-card outline-none focus:ring-2 focus:ring-pastel-blue/50"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
        <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
        {loading && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin opacity-70" aria-hidden="true" />}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((u) => (
            <MemberChip key={u.id} u={u} onRemove={removeUser} />
          ))}
        </div>
      )}

      {/* Results popover-ish list */}
      {q.trim() && (
        <div className="max-h-56 overflow-auto mt-2 rounded-xl border bg-white/70 backdrop-blur-sm">
          {visible.length === 0 && !loading ? (
            <div className="p-3 text-xs text-pastel-ink/70">No matching users.</div>
          ) : (
            <ul className="divide-y" role="listbox" aria-label="Search results">
              {visible.map((u) => (
                <li key={u.id} className="p-2 hover:bg-pastel-ink/5 flex items-center justify-between">
                  <div className="min-w-0 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {u.image ? <img src={u.image} alt="" className="h-6 w-6 rounded-full" /> : <span className="h-6 w-6 rounded-full bg-pastel-ink/10" />}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{u.name ?? u.email ?? "User"}</div>
                      {u.email && <div className="text-xs text-pastel-ink/70 truncate">{u.email}</div>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addUser(u)}
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                    aria-label={`Add ${u.name ?? u.email ?? "user"}`}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** ---------- Page ---------- **/
export default function GroupsPage() {
  const router = useRouter();

  // Don’t assume shapes from the hook; guard everything.
  const groupsHook = useGroups();
  const groups = groupsHook?.groups ?? [];
  const createGroupFn = groupsHook?.createGroup as CreateGroupFn | undefined;
  const removeGroup = (groupsHook?.removeGroup as ((id: string) => Promise<void>) | undefined) ?? undefined;

  // UI state
  const [showForm, setShowForm] = useState<boolean>(groups.length === 0);
  const [creating, setCreating] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");

  // Member picker state (used in the New Group form)
  const [selected, setSelected] = useState<LiteUser[]>([]);
  const [groupName, setGroupName] = useState("");
  const [currency, setCurrency] = useState("AUD");

  // If the groups array becomes empty (e.g., initial load or user deleted last group), open the form.
  useEffect(() => {
    if (groups.length === 0) setShowForm(true);
  }, [groups.length]);

  // Client-side search for existing groups
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => (g?.name ?? "").toLowerCase().includes(q));
  }, [groups, query]);

  const handleCreate = useCallback(async () => {
    if (!createGroupFn) return;
    if (!groupName.trim()) {
      toast.error("Group name required");
      return;
    }
    try {
      setCreating(true);
      const created = await createGroupSafe(createGroupFn, {
        name: groupName.trim(),
        currency,
        memberIds: selected.map((s) => s.id),
      });
      toast.success("Group created", {
        description: `“${created.name}” is ready.`,
      });
      setShowForm(false);
      setGroupName("");
      setSelected([]);
      router.push(`/groups/${created.id}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Please try again.";
      toast.error("Couldn’t create group", { description: message });
    } finally {
      setCreating(false);
    }
  }, [createGroupFn, groupName, currency, selected, router]);

  return (
    <div className="pastel-page min-h-screen p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Groups"
        subtitle="Trips, flats, or projects — organise expenses by group."
      />

      {/* Actions row */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="crayon-btn pastel-blue flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium shadow-sm hover:shadow transition"
          onClick={() => setShowForm((v) => !v)}
          aria-expanded={showForm}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" aria-hidden="true" /> Close
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" aria-hidden="true" /> New Group
            </>
          )}
        </button>

        {/* Search existing groups */}
        <div className="relative w-full sm:w-64">
          <label htmlFor="group-search" className="sr-only">
            Search groups
          </label>
          <input
            id="group-search"
            type="search"
            placeholder="Search groups…"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl crayon-card pastel-ink/90 outline-none focus:ring-2 focus:ring-pastel-blue/50"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search groups"
          />
          <Search
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Create form (enhanced with member picker) */}
      {showForm && (
        <div
          className="mb-8 crayon-card sky rounded-2xl p-4 shadow-soft relative"
          aria-busy={creating}
          aria-live="polite"
        >
          <div className="absolute -top-2 -left-2 scribble scribble-yellow pointer-events-none" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label htmlFor="group-name" className="text-xs font-medium text-pastel-ink/80">
                  Group name
                </label>
                <input
                  id="group-name"
                  autoFocus
                  type="text"
                  placeholder="e.g., Euro Trip, Flat 12B, Project Phoenix"
                  className="mt-1 w-full rounded-xl crayon-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pastel-blue/50"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="currency" className="text-xs font-medium text-pastel-ink/80">
                  Currency
                </label>
                <select
                  id="currency"
                  className="mt-1 w-full rounded-xl crayon-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pastel-blue/50"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                >
                  <option value="AUD">AUD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="INR">INR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !groupName.trim()}
                className="crayon-btn pastel-blue inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Create group
              </button>
            </div>

            <div className="space-y-3">
              <MemberPicker selected={selected} setSelected={setSelected} />
              <p className="text-[11px] text-pastel-ink/70">
                Tip: You can create the group now and invite more members later.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state (no groups) */}
      {filtered.length === 0 && groups.length === 0 && (
        <EmptyState subtitle="You don’t have any groups yet. Create your first group above." />
      )}

      {/* No search results (has groups) */}
      {groups.length > 0 && filtered.length === 0 && (
        <EmptyState title="No matches" subtitle={`No groups match “${query}”.`} />
      )}

      {/* Grid of groups */}
      {filtered.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          role="list"
          aria-label="Your groups"
        >
          {filtered.map((g) => (
            <GroupCard
              key={g.id}
              g={g}
              onDelete={
                removeGroup
                  ? async (id) => {
                    try {
                      await removeGroup(id);
                      toast.success("Group removed", {
                        description: "It will no longer appear in your list.",
                      });
                    } catch (e) {
                      const message = e instanceof Error ? e.message : "Please try again.";
                      toast.error("Couldn’t remove group", { description: message });
                    }
                  }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Footer hint */}
      <p className="mt-6 text-xs text-pastel-ink/70">
        Tip: Use the “New Group” button to add flatmates or trip buddies. You
        can add expenses for a group or split directly with people.
      </p>
    </div>
  );
}
