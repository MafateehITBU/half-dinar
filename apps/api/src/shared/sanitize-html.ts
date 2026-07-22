import sanitizeHtml from 'sanitize-html';

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'h1',
    'h2',
    'h3',
    'h4',
    'hr',
    'span',
    'ul',
    'ol',
    'li',
    'blockquote',
  ],
  allowedAttributes: {
    span: ['style'],
    p: ['style'],
    h1: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    li: ['style'],
  },
  allowedStyles: {
    '*': {
      color: [
        /^#(0x)?[0-9a-f]+$/i,
        /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i,
        /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/i,
      ],
    },
  },
  // Disallow all URLs in attributes (no links from CMS editor yet)
  allowedSchemes: [],
  disallowedTagsMode: 'discard',
};

/** Sanitize rich-text HTML before persisting (defense in depth with storefront DOMPurify). */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html?.trim()) return '';
  return sanitizeHtml(html, RICH_TEXT_OPTIONS).trim();
}

export function sanitizeRichTextFields<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[],
): T {
  const next = { ...data };
  for (const field of fields) {
    const value = next[field];
    if (typeof value === 'string') {
      (next as Record<string, unknown>)[field as string] = sanitizeRichText(value);
    }
  }
  return next;
}
