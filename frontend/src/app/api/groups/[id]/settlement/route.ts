// src/app/api/groups/[id]/settlement/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeNetBalances, settleBalances } from "@/lib/settlement";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const callerId = session?.user?.id;
    if (!callerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    // Guard: must be a member to view settlement
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: callerId },
      select: { userId: true },
    });
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Load all expenses with allocations for this group
    const expenses = await prisma.expense.findMany({
      where: { groupId: id },
      select: {
        id: true,
        payerId: true,
        amount_cents: true,
        allocations: {
          select: {
            userId: true,
            share_cents: true,
          },
        },
      },
    });

    // Compute net + transfers
    const net = computeNetBalances(expenses as any);
    const transfers = settleBalances(net);

    // For nicer UI, include a minimal user dictionary (name/email)
    const userIds = Array.from(new Set(Object.keys(net)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json({ net, transfers, users });
  } catch (e) {
    console.error("GET /api/groups/[id]/settlement failed:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
