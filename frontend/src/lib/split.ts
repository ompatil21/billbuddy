export function splitEqualCents(totalCents: number, userIds: string[]) {
  if (!Number.isInteger(totalCents) || totalCents <= 0) {
    throw new Error("totalCents must be a positive integer.");
  }
  if (!userIds?.length) throw new Error("No participants to split.");

  const n = userIds.length;
  const base = Math.floor(totalCents / n);
  let remainder = totalCents - base * n;

  // Deterministic extra-cent distribution
  const sorted = [...userIds].sort();
  return sorted.map((userId, idx) => ({
    userId,
    amountCents: base + (idx < remainder ? 1 : 0),
  }));
}
