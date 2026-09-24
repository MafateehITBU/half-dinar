/** Coerce Prisma Decimal / JSON string amounts to a finite number. */
export function toNum(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  if (value && typeof value === 'object' && 'toNumber' in value) {
    try {
      const n = (value as { toNumber: () => number }).toNumber();
      if (typeof n === 'number' && Number.isFinite(n)) return n;
    } catch {
      /* ignore */
    }
  }
  return fallback;
}

/** Format a money amount for display (JOD default 2 decimals). */
export function formatMoney(value: unknown, digits = 2): string {
  return toNum(value).toFixed(digits);
}
