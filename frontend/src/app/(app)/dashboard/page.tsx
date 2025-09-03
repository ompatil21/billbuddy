// server gate + data fetch
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";

export default async function DashboardPage() {
  // --- Auth gate ---
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/signin");

  // --- Current user ---
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true },
  });
  if (!user) redirect("/signin");

  // --- Groups (recent 5, with member counts) ---
  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      currency: true,
      createdAt: true,
      _count: { select: { members: true } },
    },
  });

  const groupCount = await prisma.group.count({
    where: { members: { some: { userId: user.id } } },
  });

  // --- Dashboard totals (in cents) ---
  const youAreOwedAgg = await prisma.allocation.aggregate({
    _sum: { amountCents: true },
    where: {
      userId: { not: user.id },        // others' shares
      expense: { payerId: user.id },   // you paid
    },
  });

  const youOweAgg = await prisma.allocation.aggregate({
    _sum: { amountCents: true },
    where: {
      userId: user.id,                 // your share
      expense: { payerId: { not: user.id } }, // someone else paid
    },
  });

  const youAreOwedCents = youAreOwedAgg._sum.amountCents ?? 0;
  const youOweCents = youOweAgg._sum.amountCents ?? 0;
  const totalBalanceCents = youAreOwedCents - youOweCents; // +ve => net credit

  // --- Recent expenses (group or direct) ---
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

  // Enrich with groupName / counterpartyName for the UI
  const recentExpenses = recentExpensesRaw.map((e) => {
    let counterpartyName: string | undefined;

    if (!e.group) {
      // direct expense: find the other participant (not the current user)
      const other = e.allocations.find((a) => a.user.id !== user.id)?.user;
      if (other?.name) {
        counterpartyName = other.name;
      } else if (e.payer.id !== user.id) {
        counterpartyName = e.payer.name ?? "Someone";
      }
    }

    return {
      id: e.id,
      description: e.description,
      amountCents: e.amountCents,
      date: e.createdAt.toISOString(),
      currency: e.currency,
      group: e.group ? { id: e.group.id, name: e.group.name } : null,
      groupName: e.group?.name,
      counterpartyName,
      payer: e.payer,
      allocations: e.allocations.map((a) => ({
        id: a.id,
        amountCents: a.amountCents,
        user: a.user,
      })),
    };
  });

  return (
    <DashboardClient
      name={user.name ?? user.email ?? "Unknown User"}
      groupCount={groupCount}
      groups={groups.map((g) => ({
        id: g.id,
        name: g.name,
        currency: g.currency,
        createdAt: g.createdAt.toISOString(),
        membersCount: g._count.members,
      }))}
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
