/** Guaranteed image URL for catalog display (broken/missing URLs fall back to Picsum). */
export function resolveProductImageUrl(url: string | null | undefined, slug: string): string {
  const trimmed = url?.trim();
  if (trimmed) return trimmed;
  return `https://picsum.photos/seed/abounas-${slug}/800/800`;
}
