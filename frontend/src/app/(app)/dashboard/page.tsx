console.log("[SSR] /dashboard rendering…");

// server gate + data fetch
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);          // server-side session
  if (!session?.user?.email) redirect("/signin");                // gate

  const user = await prisma.user.findUnique({                   // current user
    where: { email: session.user.email },
    select: { id: true, name: true, email: true },
  });
  if (!user) redirect("/signin");

  const groups = await prisma.group.findMany({                  // recent groups
    where: { members: { some: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, currency: true, createdAt: true },
  });

  const groupCount = await prisma.group.count({
    where: { members: { some: { userId: user.id } } },
  });

  // -------- NEW: dashboard totals (in cents) --------
  // others owe you (you are payer)
  const youAreOwedAgg = await prisma.allocation.aggregate({
    _sum: { amountCents: true },
    where: {
      userId: { not: user.id },                  // exclude yourself
      expense: { payerId: user.id },             // you paid
    },
  });

  // you owe others (you are participant, someone else paid)
  const youOweAgg = await prisma.allocation.aggregate({
    _sum: { amountCents: true },
    where: {
      userId: user.id,                           // your share
      expense: { payerId: { not: user.id } },    // someone else paid
    },
  });

  const youAreOwedCents = youAreOwedAgg._sum.amountCents ?? 0;
  const youOweCents = youOweAgg._sum.amountCents ?? 0;
  const totalBalanceCents = youAreOwedCents - youOweCents;      // +ve means net credit

  // -------- NEW: recent expenses (group or direct) --------
  const recentExpensesRaw = await prisma.expense.findMany({
    where: {
      OR: [
        { payerId: user.id },
        { allocations: { some: { userId: user.id } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      payer: { select: { id: true, name: true, image: true } },
      group: { select: { id: true, name: true } },
      allocations: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  const recentExpenses = recentExpensesRaw.map(e => ({
    id: e.id,
    description: e.description,
    amountCents: e.amountCents,
    date: e.createdAt.toISOString(), // add 'date' property
    currency: e.currency,
    createdAt: e.createdAt.toISOString(),
    group: e.group ? { id: e.group.id, name: e.group.name } : null, // null = direct
    payer: e.payer,
    allocations: e.allocations.map(a => ({
      id: a.id,
      amountCents: a.amountCents,
      user: a.user,
    })),
  }));

  return (
    <DashboardClient

      name={user.name ?? user.email ?? "Unknown User"}
      groupCount={groupCount}
      groups={groups.map(group => ({
        ...group,
        createdAt: group.createdAt.toISOString(),
      }))}

      // NEW: pass stats + recent expenses
      stats={{
        youAreOwedCents,
        youOweCents,
        totalBalanceCents,
        currency: "AUD",
      }}
      recentExpenses={recentExpenses}
    />
  );
}
