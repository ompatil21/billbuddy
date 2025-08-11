export const toCents = (n: number) => Math.round(n * 100);
export const fromCents = (c: number) => (c / 100).toFixed(2);
export const formatMoney = (cents: number, currency = 'AUD') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents/100);  
