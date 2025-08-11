export type ID = string;
export type User = { id: ID; name: string; email: string; image?: string };
export type Group = { id: ID; name: string; currency: string; memberIds: ID[] };
export type ExpenseItem = { name: string; qty: number; cents: number };
