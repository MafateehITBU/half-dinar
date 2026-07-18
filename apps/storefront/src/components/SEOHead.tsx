import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  jsonLd?: Record<string, unknown>;
}

export function SEOHead({ title, description, jsonLd }: SEOHeadProps) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }
    const scriptId = 'json-ld-seo';
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [title, description, jsonLd]);

  return null;
}
