// src/app/api/groups/route.ts  (POST)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const callerId = session?.user?.id;
    if (!callerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, currency = "AUD", memberIds = [] } = body;

    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: { name, currency, createdById: callerId },
      });

      // include creator as owner
      await tx.groupMember.create({
        data: { groupId: g.id, userId: callerId, role: "owner" },
      });

      // add any invited members (dedupe creator if included)
      const invitations = memberIds
        .filter((uid: string) => uid && uid !== callerId)
        .map((uid: string) => ({ groupId: g.id, userId: uid, role: "member" }));

      if (invitations.length) {
        await tx.groupMember.createMany({ data: invitations, skipDuplicates: true });
      }

      return g;
    });

    return NextResponse.json({ ok: true, groupId: group.id });
  } catch (e: any) {
    console.error("POST /api/groups failed:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
