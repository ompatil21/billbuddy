// src/app/api/users/search/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const me = session?.user ? (session.user as { id: string }).id : null;
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? "10"), 25);

  const where = {
    AND: [
      { id: { not: me } },
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, image: true },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    take: limit,
  });

  return NextResponse.json(users);
}

