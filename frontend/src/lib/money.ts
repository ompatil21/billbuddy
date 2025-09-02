export function formatCentsAUD(cents: number) {
  const dollars = (cents ?? 0) / 100;
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(dollars);
}
