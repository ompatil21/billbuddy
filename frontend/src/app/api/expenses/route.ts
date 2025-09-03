/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { splitEqualCents } from "@/lib/split"; // keep if you have it

// ----- Schemas -----
// A) Equal-split input (participants only)
const EqualSplitSchema = z.object({
  description: z.string().min(1).max(120),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default("AUD"),
  groupId: z.string().cuid().optional().nullable(),
  // client may send payerId but we will ignore it server-side
  payerId: z.string().cuid().optional(),
  participantIds: z.array(z.string().cuid()).min(1),
});

// B) Explicit allocations input
const AllocationSchema = z.object({
  userId: z.string().cuid(),
  amountCents: z.number().int().nonnegative(),
});
const ExplicitAllocSchema = z.object({
  description: z.string().min(1).max(120),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default("AUD"),
  groupId: z.string().cuid().optional().nullable(),
  payerId: z.string().cuid().optional(), // ignored
  allocations: z.array(AllocationSchema).min(1),
});

// Accept either shape
const CreateExpenseSchema = z.union([EqualSplitSchema, ExplicitAllocSchema]);

// ------------------ POST ------------------
export async function POST(req: Request) {
  // 1) Auth
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2) Parse body (supports both shapes)
  const json = await req.json().catch(() => null);
  const parsed = CreateExpenseSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.format() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const description = data.description;
  const amountCents = data.amountCents;
  const currency = data.currency ?? "AUD";
  const groupId = (data as any).groupId ?? null;

  
  // 3) Normalize to allocations[]
  let allocations: Array<{ userId: string; amountCents: number }>;
  if ("allocations" in data) {
    allocations = data.allocations;
  } else {
    // equal split from participantIds
    const uniqueIds = Array.from(new Set(data.participantIds));
  const n = uniqueIds.length;
  const base = Math.floor(amountCents / n);
  const rem  = amountCents - base * n;

allocations = uniqueIds.map((userId, i) => ({
  userId,
  amountCents: i < rem ? base + 1 : base,
}));
  }

  // 4) Validate allocations sum = amountCents
  const sum = allocations.reduce((acc, a) => acc + a.amountCents, 0);
  if (sum !== amountCents) {
    return NextResponse.json(
      { error: "Allocations must sum to amountCents", sum, amountCents },
      { status: 400 }
    );
  }

  // 5) Validate users exist
  const allUserIds = Array.from(new Set(allocations.map(a => a.userId).concat(me.id)));
  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    select: { id: true },
  });
  const foundIds = new Set(users.map(u => u.id));
  const missing = allUserIds.filter(id => !foundIds.has(id));
  if (missing.length) {
    return NextResponse.json({ error: "Some users not found", missing }, { status: 400 });
  }

  // 6) If group expense, everyone (including the payer/me) must be group members
  if (groupId) {
    const members = await prisma.groupMember.findMany({
      where: { groupId, userId: { in: allUserIds } },
      select: { userId: true },
    });
    const memberIds = new Set(members.map(m => m.userId));
    const notMembers = allUserIds.filter(id => !memberIds.has(id));
    if (notMembers.length) {
      return NextResponse.json({ error: "Users not in group", notMembers }, { status: 400 });
    }
  }

  // 7) Create expense with session user as payer (ignore client payerId)
  try {
    const created = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          description,
          amountCents,
          currency,
          payerId: me.id,
          groupId, // may be null for direct expenses
          // Remove if your schema doesn't have it:
          splitType: "EQUAL",
        },
        select: { id: true },
      });

      await tx.allocation.createMany({
        data: allocations.map(a => ({
          expenseId: expense.id,
          userId: a.userId,
          amountCents: a.amountCents,
        })),
      });

      return tx.expense.findUnique({
        where: { id: expense.id },
        include: {
          payer: { select: { id: true, name: true, image: true } },
          group: { select: { id: true, name: true } },
          allocations: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
        },
      });
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create expense";
    console.error("Create expense error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ------------------ GET (recent) ------------------
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "10"), 50);

  const items = await prisma.expense.findMany({
    where: {
      OR: [{ payerId: me.id }, { allocations: { some: { userId: me.id } } }],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      payer: { select: { id: true, name: true, image: true } },
      group: { select: { id: true, name: true } },
      allocations: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  return NextResponse.json(items);
}
