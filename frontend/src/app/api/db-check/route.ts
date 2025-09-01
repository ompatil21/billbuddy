// src/app/api/db-check/route.ts
// -------------------------------------------------------------
// Simple health-check endpoint to verify DB connectivity.
// Runs a trivial count on the Group table.
// -------------------------------------------------------------

// Prisma needs the Node.js runtime (not Edge)
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Will be 0 until we insert something
    const groupCount = await prisma.group.count();

    return Response.json({ ok: true, groupCount });
  } catch (e: any) {
    console.error("[DB-CHECK ERROR]", e);
    return new Response("DB error: " + e.message, { status: 500 });
  }
}
