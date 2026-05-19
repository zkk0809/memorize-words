export function formatNumber(n) {
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  return n.toString();
}