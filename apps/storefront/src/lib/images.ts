/** Inline SVG placeholder when URL is missing or fails to load */
export function getPlaceholderDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d9488"/>
      <stop offset="100%" stop-color="#134e4a"/>
    </linearGradient>
  </defs>
  <rect fill="url(#g)" width="600" height="600"/>
  <circle cx="300" cy="240" r="72" fill="rgba(255,255,255,0.15)"/>
  <path d="M220 380h160l-40-100-40 60-40-60z" fill="rgba(255,255,255,0.2)"/>
  <text x="300" y="480" text-anchor="middle" fill="white" font-size="28" font-family="Cairo,sans-serif">النص أونلاين</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const PLACEHOLDER_IMAGE = getPlaceholderDataUrl();

/** Normalize CDN URLs and add Unsplash optimization params */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:')) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes('unsplash.com')) {
      if (!u.searchParams.has('auto')) u.searchParams.set('auto', 'format');
      if (!u.searchParams.has('fit')) u.searchParams.set('fit', 'crop');
      if (!u.searchParams.has('q')) u.searchParams.set('q', '80');
      if (!u.searchParams.has('w') && !u.pathname.includes('w=')) u.searchParams.set('w', '800');
    }
    return u.toString();
  } catch {
    return trimmed;
  }
}
