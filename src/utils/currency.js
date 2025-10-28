export function formatNaira(amount = 0) {
  const n = Number(amount) || 0;
  return `₦${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
