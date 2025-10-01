// src/app/api/groups/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// New Next.js requires awaiting params.
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const callerId = session?.user?.id;
    if (!callerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // 1) Find the group (no membership gate yet)
    const base = await prisma.group.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        currency: true,
        createdAt: true,
        _count: { select: { members: true, expenses: true } },
      },
    });

    if (!base) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // 2) Check membership (return 403 if you’re not a member)
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: callerId },
      select: { role: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3) Load members (include user profile)
    const members = await prisma.groupMember.findMany({
      where: { groupId: id },
      select: {
        userId: true,
        role: true,
        user: { select: { id: true, name: true, email: true, image: true } },
        // Add joinedAt/createdAt here if your model actually has them
      },
      // If your join table lacks timestamps, skip orderBy
      // orderBy: { createdAt: "asc" },
    });

    const payload = {
      id: base.id,
      name: base.name,
      currency: base.currency,
      createdAt:
        typeof (base as any).createdAt?.toISOString === "function"
          ? (base as any).createdAt.toISOString()
          : (base as any).createdAt ?? null,
      _count: base._count,
      currentUserRole: (membership.role as "owner" | "member") ?? "member",
      members: members.map((m) => ({
        user: m.user,
        role: m.role ?? "member",
        joinedAt: undefined as string | undefined, // populate if you have a field
      })),
    };

    return NextResponse.json({ group: payload });
  } catch (e) {
    console.error("GET /api/groups/[id] failed:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
