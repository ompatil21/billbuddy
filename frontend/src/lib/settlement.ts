// src/lib/settlement.ts
export type Allocation = { userId: string; share_cents: number };
export type ExpenseLite = {
  id: string;
  payerId: string;
  amount_cents: number;
  allocations: Allocation[];
};

export type Net = Record<string, number>; // userId -> cents (pos = to receive, neg = to pay)
export type Transfer = { fromUserId: string; toUserId: string; amount_cents: number };

export function computeNetBalances(expenses: ExpenseLite[]): Net {
  const net: Net = {};
  for (const e of expenses) {
    net[e.payerId] = (net[e.payerId] ?? 0) + e.amount_cents;
    for (const a of e.allocations) {
      net[a.userId] = (net[a.userId] ?? 0) - a.share_cents;
    }
  }
  // snap tiny rounding noise to zero (1 cent)
  for (const k of Object.keys(net)) if (Math.abs(net[k]) < 1) net[k] = 0;
  return net;
}

export function settleBalances(net: Net): Transfer[] {
  const creditors: Array<{ userId: string; amt: number }> = [];
  const debtors: Array<{ userId: string; amt: number }> = [];

  for (const [userId, amt] of Object.entries(net)) {
    if (amt > 0) creditors.push({ userId, amt });
    else if (amt < 0) debtors.push({ userId, amt: -amt });
  }

  // deterministic ordering (largest first)
  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);

  const transfers: Transfer[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    if (pay > 0) {
      transfers.push({
        fromUserId: debtors[i].userId,
        toUserId: creditors[j].userId,
        amount_cents: pay,
      });
    }
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt === 0) i++;
    if (creditors[j].amt === 0) j++;
  }
  return transfers;
}
