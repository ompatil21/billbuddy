/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { splitEqualCents } from "@/lib/split";

// ---- Validation schema (MVP: EQUAL split only) ----
const CreateExpenseSchema = z.object({
  description: z.string().min(1).max(120),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default("AUD"),
  payerId: z.string().cuid().optional(),          // defaults to current user
  participantIds: z.array(z.string().cuid()).min(1),
  groupId: z.string().cuid().optional().nullable() // nullable => direct expense if null/undefined
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const me = session && session.user ? (session.user as typeof session.user & { id?: string }).id : undefined;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof CreateExpenseSchema>;
  try {
    body = CreateExpenseSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", details: (e as Error).message }, { status: 400 });
  }

  const {
    description,
    amountCents,
    currency,
    participantIds,
    groupId: maybeGroupId,
  } = body;
  const payerId = body.payerId ?? me;
  const groupId = maybeGroupId ?? null;

  // Ensure participants are unique and include payer if desired (Splitwise allows payer to be participant)
  const uniqueParticipantIds = Array.from(new Set(participantIds));

  // --- Validate users exist
  const users = await prisma.user.findMany({ where: { id: { in: [payerId, ...uniqueParticipantIds] } }, select: { id: true } });
  const foundIds = new Set(users.map(u => u.id));
  const missing = [payerId, ...uniqueParticipantIds].filter(id => !foundIds.has(id));
  if (missing.length) {
    return NextResponse.json({ error: "Some users not found", missing }, { status: 400 });
  }

  // --- If groupId provided, validate membership for all participants + payer
  if (groupId) {
    const members = await prisma.groupMember.findMany({
      where: { groupId, userId: { in: [payerId, ...uniqueParticipantIds] } },
      select: { userId: true }
    });
    const memberIds = new Set(members.map(m => m.userId));
    const notMembers = [payerId, ...uniqueParticipantIds].filter(id => !memberIds.has(id));
    if (notMembers.length) {
      return NextResponse.json({ error: "Users not in group", notMembers }, { status: 400 });
    }
  }

  // --- Build allocations (equal split MVP)
  const allocations = splitEqualCents(amountCents, uniqueParticipantIds);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          description,
          amountCents,
          currency,
          payerId,
          groupId, // can be null for direct expense
          splitType: "EQUAL",
        }
      });

      await tx.allocation.createMany({
        data: allocations.map(a => ({
          expenseId: expense.id,
          userId: a.userId,
          amountCents: a.amountCents,
        }))
      });

      return await tx.expense.findUnique({
        where: { id: expense.id },
        include: {
          payer: { select: { id: true, name: true, image: true } },
          group: { select: { id: true, name: true } },
          allocations: {
            include: { user: { select: { id: true, name: true, image: true } } }
          }
        }
      });
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("Create expense error:", err);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

// (Optional) GET for recent expenses where you are payer or participant
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const me = session && session.user ? (session.user as typeof session.user & { id?: string }).id : undefined;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "10"), 50);

  const items = await prisma.expense.findMany({
    where: {
      OR: [
        { payerId: me },
        { allocations: { some: { userId: me } } }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      payer: { select: { id: true, name: true, image: true } },
      group: { select: { id: true, name: true } },
      allocations: { include: { user: { select: { id: true, name: true, image: true } } } }
    }
  });

  return NextResponse.json(items);
}
