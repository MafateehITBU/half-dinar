import DOMPurify from 'dompurify';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Legacy plain text → safe HTML; already-HTML passes through (then sanitized). */
export function toDisplayHtml(value: string): string {
  if (!value) return '';
  // Handle accidentally double-escaped HTML from older saves/clients
  let html = value;
  if (/&lt;\/?[a-z]/i.test(html) && !/<\/?[a-z][\s\S]*>/i.test(html)) {
    html = decodeBasicEntities(html);
  }
  if (/<\/?[a-z][\s\S]*>/i.test(html)) return html;
  return escapeHtml(html).replace(/\n/g, '<br>');
}

/** Strip tags for meta / lead snippets. */
export function stripHtml(value: string): string {
  if (!value) return '';
  const decoded = /&lt;\/?[a-z]/i.test(value) ? decodeBasicEntities(value) : value;
  return decoded
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const ALLOWED_TAGS = [
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
];

const ALLOWED_ATTR = ['style', 'class'];

type RichTextProps = {
  html: string;
  className?: string;
  dir?: 'rtl' | 'ltr';
  as?: 'div' | 'span';
};

export function RichText({ html, className = '', dir, as: Tag = 'div' }: RichTextProps) {
  if (!html?.trim()) return null;

  const clean = DOMPurify.sanitize(toDisplayHtml(html), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });

  // Only allow inline color styles (block XSS via style)
  const withSafeStyles = clean.replace(/style="([^"]*)"/gi, (_m, style: string) => {
    const colors = style.match(/color\s*:\s*[^;]+/gi);
    if (!colors?.length) return '';
    return `style="${colors.join(';')}"`;
  });

  return (
    <Tag
      className={`rich-text prose-content ${className}`.trim()}
      dir={dir}
      dangerouslySetInnerHTML={{ __html: withSafeStyles }}
    />
  );
}
