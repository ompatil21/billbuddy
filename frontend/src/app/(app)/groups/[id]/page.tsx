// src/app/(app)/groups/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import ExpenseQuickAdd from "@/features/expenses/ExpenseQuickAdd";
import ExpenseChips from "@/features/expenses/ExpenseChips";
import { useGroups } from "@/features/groups/useGroups";
import { useExpenses } from "@/features/expenses/useExpenses";
import { formatMoney } from "@/lib/currency";
import {
  ArrowLeft,
  PlusCircle,
  Users,
  RefreshCw,
  Search,
  UserPlus,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ----------------------------- Types ----------------------------- */
type DetailMember = {
  user: { id: string; name: string | null; email: string | null; image: string | null };
  role?: string;
  joinedAt?: string;
};
type GroupDetail = {
  id: string;
  name: string;
  currency: string;
  createdAt: string;
  _count: { members: number; expenses?: number };
  members: DetailMember[];
  currentUserRole?: "owner" | "member";
};

/* ----------------------- People Search hook ---------------------- */
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
        const url1 = `/api/friends/search?q=${encodeURIComponent(q.trim())}`;
        const r1 = await fetch(url1);
        if (r1.ok) {
          const data = (await r1.json()) as { users: LiteUser[] } | LiteUser[];
          setResults(Array.isArray(data) ? data : data.users ?? []);
        } else {
          const url2 = `/api/users/search?q=${encodeURIComponent(q.trim())}`;
          const r2 = await fetch(url2);
          if (r2.ok) {
            const data = (await r2.json()) as { users: LiteUser[] } | LiteUser[];
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

/* --------------------------- Page --------------------------- */
export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();

  // Resolve gid once; this hook order never changes.
  const gid = useMemo(() => {
    const raw = (params as Record<string, unknown>)?.id;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
    return "";
  }, [params]);

  // Single return; we conditionally mount the heavy body below.
  return (
    <div className="pastel-page p-4 sm:p-6 lg:p-8">
      {/* Header bar always visible */}
      <div className="mb-3 flex items-center justify-between">
        <button
          className="crayon-btn pastel-blue rounded-xl px-3 py-2 text-sm inline-flex items-center gap-2"
          onClick={() => router.push("/groups")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to groups
        </button>
      </div>

      {/* If gid not ready, just show skeleton and don't mount the hook-heavy body */}
      {!gid && (
        <div className="animate-pulse">
          <div className="h-7 w-48 rounded-md bg-pastel-ink/10 mb-2" />
          <div className="h-4 w-80 rounded-md bg-pastel-ink/10 mb-6" />
        </div>
      )}

      {/* Mount the main body ONLY when gid is available */}
      {gid && <GroupBody gid={gid} />}
    </div>
  );
}

/* --------------------------- Body (all hooks live here) --------------------------- */
function GroupBody({ gid }: { gid: string }) {
  const router = useRouter();

  // Expenses (safe: gid is stable when this component mounts)
  const expensesHook = useExpenses(gid);
  const expenses = expensesHook?.expenses ?? [];
  const addExpense = expensesHook?.add ?? (async () => { });
  const removeExpense: undefined | ((id: string) => Promise<void>) =
    (expensesHook as any)?.remove;

  // From list cache for name/currency fallback (no _count)
  const { groups } = useGroups();
  const cached = useMemo(() => groups.find((g) => g.id === gid), [groups, gid]);

  // Detail
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Add/remove members
  const [adding, setAdding] = useState<boolean>(false);
  const [mutatingMembers, setMutatingMembers] = useState<boolean>(false);

  // People search
  const { q, setQ, loading: searchLoading, results } = usePeopleSearch();

  // Settlement
  type Settlement = {
    net: Record<string, number>;
    transfers: { fromUserId: string; toUserId: string; amount_cents: number }[];
    users: { id: string; name: string | null; email: string | null; image: string | null }[];
  };
  const [settle, setSettle] = useState<Settlement | null>(null);
  const [settleLoading, setSettleLoading] = useState(false);
  const [settleError, setSettleError] = useState<string | null>(null);

  const fetchSettlement = useCallback(async () => {
    setSettleLoading(true);
    setSettleError(null);
    try {
      const res = await fetch(`/api/groups/${gid}/settlement`);
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in");
          router.push("/login");
          return;
        }
        if (res.status === 403) throw new Error("Forbidden");
        if (res.status === 404) throw new Error("Group not found");
        throw new Error(`Failed (${res.status})`);
      }
      const data = (await res.json()) as Settlement;
      setSettle(data);
    } catch (e) {
      setSettleError(e instanceof Error ? e.message : "Error");
    } finally {
      setSettleLoading(false);
    }
  }, [gid, router]);

  useEffect(() => {
    if (expenses.length > 0) void fetchSettlement();
    else setSettle(null);
  }, [expenses, fetchSettlement]);

  const fetchDetail = useCallback(async () => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await fetch(`/api/groups/${gid}`);
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in to view this group");
          router.push("/login");
          return;
        }
        if (res.status === 403) throw new Error("Forbidden");
        if (res.status === 404) throw new Error("Group not found");
        throw new Error(`Failed to load group (${res.status})`);
      }
      const data = (await res.json()) as { group: GroupDetail };
      setDetail(data.group);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Error");
    } finally {
      setDetailLoading(false);
    }
  }, [gid, router]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  // Derived UI labels
  const name = detail?.name ?? cached?.name ?? "Group";
  const currency = detail?.currency ?? cached?.currency ?? "AUD";
  const memberCount = detail?._count?.members ?? 0; // only trust detail for counts
  const memberLabel = `${memberCount} member${memberCount !== 1 ? "s" : ""}`;
  const isOwner = detail?.currentUserRole === "owner";

  /* ---------------------- Members mutate helpers ---------------------- */
  const addMember = useCallback(
    async (userId: string) => {
      try {
        setMutatingMembers(true);
        const res = await fetch(`/api/groups/${gid}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (!res.ok) {
          const msg = (await res.json().catch(() => ({})))?.error ?? `Failed (${res.status})`;
          throw new Error(msg);
        }
        toast.success("Member added");
        setQ("");
        await fetchDetail();
      } catch (e) {
        toast.error("Couldn’t add member", {
          description: e instanceof Error ? e.message : "Please try again.",
        });
      } finally {
        setMutatingMembers(false);
      }
    },
    [gid, fetchDetail, setQ]
  );

  const removeMember = useCallback(
    async (userId: string) => {
      try {
        setMutatingMembers(true);
        const res = await fetch(`/api/groups/${gid}/members`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (!res.ok) {
          const msg = (await res.json().catch(() => ({})))?.error ?? `Failed (${res.status})`;
          throw new Error(msg);
        }
        toast.success("Member removed");
        await fetchDetail();
      } catch (e) {
        toast.error("Couldn’t remove member", {
          description: e instanceof Error ? e.message : "Please try again.",
        });
      } finally {
        setMutatingMembers(false);
      }
    },
    [gid, fetchDetail]
  );

  return (
    <>
      {/* Top header */}
      <div className="mb-3 flex items-center justify-between">
        <div />
        <button
          onClick={() => fetchDetail()}
          className="crayon-btn rounded-xl px-3 py-2 text-sm inline-flex items-center gap-2"
          aria-busy={detailLoading}
        >
          {detailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      <PageHeader title={name} subtitle={`${currency} • ${memberLabel}`} />

      {/* Error banners (no early returns) */}
      {detailError === "Group not found" && (
        <div className="crayon-card rounded-2xl p-4 mb-4">
          <div className="font-medium">Group not found</div>
          <button
            className="mt-3 crayon-btn pastel-blue rounded-xl px-3 py-2 text-sm inline-flex items-center gap-2"
            onClick={() => router.push("/groups")}
          >
            <ArrowLeft className="h-4 w-4" /> Back to groups
          </button>
        </div>
      )}
      {detailError === "Forbidden" && (
        <div className="crayon-card rounded-2xl p-4 mb-4">
          <div className="font-medium">You don’t have access to this group</div>
          <p className="text-sm text-pastel-ink/70 mt-1">Ask the owner to add you as a member.</p>
          <button
            className="mt-3 crayon-btn pastel-blue rounded-xl px-3 py-2 text-sm inline-flex items-center gap-2"
            onClick={() => router.push("/groups")}
          >
            <ArrowLeft className="h-4 w-4" /> Back to groups
          </button>
        </div>
      )}

      {/* Members */}
      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="crayon-card rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs text-pastel-ink/70 mb-3">
            <Users className="h-4 w-4" /> Members
          </div>

          {detailLoading ? (
            <div className="animate-pulse grid gap-2">
              <div className="h-4 w-40 bg-pastel-ink/10 rounded" />
              <div className="h-8 w-full bg-pastel-ink/10 rounded" />
            </div>
          ) : (detail?.members?.length ?? 0) > 0 ? (
            <ul className="grid gap-2">
              {detail!.members!.map((m) => (
                <li
                  key={m.user.id}
                  className="flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-pastel-ink/5"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {m.user.image ? (
                      <img src={m.user.image} alt="" className="h-6 w-6 rounded-full" />
                    ) : (
                      <span className="h-6 w-6 rounded-full bg-pastel-ink/10" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {m.user.name ?? m.user.email ?? "Member"}
                      </div>
                      <div className="text-[11px] text-pastel-ink/70">{m.role ?? "member"}</div>
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      className="inline-flex items-center gap-1 text-xs rounded-md px-2 py-1 hover:bg-red-50 text-red-600"
                      onClick={() => removeMember(m.user.id)}
                      disabled={mutatingMembers}
                      aria-label={`Remove ${m.user.name ?? m.user.email ?? "member"}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-pastel-ink/70">No members.</div>
          )}
        </div>

        {/* Add members */}
        <div className="crayon-card rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs text-pastel-ink/70 mb-3">
            <UserPlus className="h-4 w-4" /> Add members
          </div>

          <div className="relative mb-2">
            <input
              type="search"
              placeholder="Search friends by name or email…"
              className="w-full pl-8 pr-10 py-2 text-sm rounded-xl crayon-card outline-none focus:ring-2 focus:ring-pastel-blue/50"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
            />
            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
            {searchLoading && (
              <Loader2
                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin opacity-70"
                aria-hidden="true"
              />
            )}
          </div>

          {q.trim() ? (
            <div className="max-h-56 overflow-auto rounded-xl border bg-white/70 backdrop-blur-sm">
              {results.length === 0 && !searchLoading ? (
                <div className="p-3 text-xs text-pastel-ink/70">No matching users.</div>
              ) : (
                <ul className="divide-y" role="listbox" aria-label="Search results">
                  {results.map((u) => (
                    <li key={u.id} className="p-2 hover:bg-pastel-ink/5 flex items-center justify-between">
                      <div className="min-w-0 flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {u.image ? (
                          <img src={u.image} alt="" className="h-6 w-6 rounded-full" />
                        ) : (
                          <span className="h-6 w-6 rounded-full bg-pastel-ink/10" />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{u.name ?? u.email ?? "User"}</div>
                          {u.email && <div className="text-xs text-pastel-ink/70 truncate">{u.email}</div>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addMember(u.id)}
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
                        disabled={mutatingMembers}
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
          ) : (
            <p className="text-[11px] text-pastel-ink/70">Tip: You can invite people later too.</p>
          )}
        </div>
      </section>

      {/* Quick Add + Expenses */}
      <section className="space-y-4">
        <div className="crayon-card pastel-yellow rounded-2xl p-4 shadow-soft relative" aria-busy={adding} aria-live="polite">
          <div className="absolute -top-2 -left-2 scribble scribble-yellow pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Add expense</h3>
            <span className="inline-flex items-center gap-2 text-xs text-pastel-ink/70">
              <PlusCircle className="h-4 w-4" /> {currency}
            </span>
          </div>
          <ExpenseQuickAdd
            currency={currency}
            onAdd={async (payload) => {
              try {
                setAdding(true);
                await addExpense(payload);
                toast.success("Expense added", { description: payload.description });
              } catch (e) {
                const msg = e instanceof Error ? e.message : "Please try again.";
                toast.error("Couldn’t add expense", { description: msg });
              } finally {
                setAdding(false);
              }
            }}
          />
        </div>

        {Array.isArray(expenses) && expenses.length > 0 ? (
          <>
            <ul className="grid gap-2" role="list" aria-label="Group expenses">
              {expenses.map((e: any) => (
                <li key={e.id} className="crayon-card rounded-2xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{e.description}</div>
                      <div className="text-xs text-pastel-ink/70">{new Date(e.dateISO).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-3 pl-3 shrink-0">
                      <div className="text-sm font-semibold">{formatMoney(e.amount_cents, e.currency)}</div>
                      {typeof removeExpense === "function" && (
                        <button
                          className="text-xs underline opacity-70 hover:opacity-100"
                          onClick={async () => {
                            try {
                              await removeExpense(e.id);
                              toast.success("Expense deleted");
                            } catch (err) {
                              const msg = err instanceof Error ? err.message : "Please try again.";
                              toast.error("Couldn’t delete", { description: msg });
                            }
                          }}
                          aria-label={`Delete ${e.description}`}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <ExpenseChips
                    // @ts-expect-error optional depending on your hook shape
                    payer={e.payer}
                    // @ts-expect-error
                    allocations={e.allocations}
                    currency={e.currency}
                  />
                </li>
              ))}
            </ul>

            {/* Settlement */}
            <section className="space-y-3 mt-4">
              <div className="crayon-card rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Settle up</h3>
                  <button
                    onClick={fetchSettlement}
                    className="crayon-btn rounded-xl px-3 py-2 text-sm inline-flex items-center gap-2"
                    aria-busy={settleLoading}
                  >
                    {settleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Calculate
                  </button>
                </div>

                {settleError && <div className="mt-2 text-sm text-red-600">{settleError}</div>}

                {settle && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-xs text-pastel-ink/70 mb-2">Net positions</div>
                      <ul className="grid gap-1">
                        {Object.entries(settle.net).map(([uid, cents]) => {
                          const u = settle.users.find((x) => x.id === uid);
                          const label = u?.name ?? u?.email ?? uid;
                          const val = (cents / 100).toFixed(2);
                          return (
                            <li key={uid} className="flex items-center justify-between text-sm">
                              <span className="truncate">{label}</span>
                              <span className={cents >= 0 ? "text-green-700" : "text-red-700"}>
                                {cents >= 0 ? "+" : "-"}${Math.abs(Number(val)).toFixed(2)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div>
                      <div className="text-xs text-pastel-ink/70 mb-2">Suggested transfers</div>
                      {settle.transfers.length === 0 ? (
                        <div className="text-sm text-pastel-ink/70">All settled 🎉</div>
                      ) : (
                        <ul className="grid gap-1">
                          {settle.transfers.map((t, i) => {
                            const from = settle.users.find((x) => x.id === t.fromUserId);
                            const to = settle.users.find((x) => x.id === t.toUserId);
                            const amt = (t.amount_cents / 100).toFixed(2);
                            return (
                              <li key={i} className="text-sm">
                                <span className="font-medium">
                                  {from?.name ?? from?.email ?? t.fromUserId}
                                </span>
                                {" → "}
                                <span className="font-medium">
                                  {to?.name ?? to?.email ?? t.toUserId}
                                </span>
                                {": "} ${amt}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="crayon-card rounded-2xl p-4 text-sm text-pastel-ink/70">
            No expenses yet. Add one above.
          </div>
        )}
      </section>
    </>
  );
}
