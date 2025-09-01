// src/lib/prisma.ts
// -------------------------------------------------------------
// Creates exactly one PrismaClient in dev (Next.js hot reload
// can otherwise create many and exhaust DB connections).
// In prod, each serverless instance gets its own client.
// -------------------------------------------------------------
import { PrismaClient } from "@prisma/client";

// Re-use the client across dev hot-reloads by stashing it on global
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Verbose logs in dev make debugging easier
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Only cache on global in dev
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
