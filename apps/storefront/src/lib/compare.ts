const KEY = 'compare_products';
const MAX = 4;

export function getCompareIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleCompare(productId: string): string[] {
  const ids = getCompareIds();
  const idx = ids.indexOf(productId);
  if (idx >= 0) {
    ids.splice(idx, 1);
  } else if (ids.length < MAX) {
    ids.push(productId);
  }
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event('compare-updated'));
  return ids;
}

export function removeFromCompare(productId: string) {
  const ids = getCompareIds().filter((id) => id !== productId);
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event('compare-updated'));
  return ids;
}
