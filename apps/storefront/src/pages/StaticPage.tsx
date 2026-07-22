import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Container } from '../components/ui/Container';
import { PageHero } from '../components/ui/PageHero';
import { SEOHead } from '../components/SEOHead';
import { RichText, stripHtml } from '../components/RichText';
import { api } from '../lib/api';

type CmsPageData = {
  slug: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
};

function useLocale(): 'ar' | 'en' {
  if (typeof document === 'undefined') return 'ar';
  const lang = document.documentElement.lang?.toLowerCase() || 'ar';
  return lang.startsWith('en') ? 'en' : 'ar';
}

export function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const locale = useLocale();
  const [page, setPage] = useState<CmsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEn, setShowEn] = useState(locale === 'en');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .getCmsPage(slug)
      .then((r) => setPage(r.data as CmsPageData))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const title = page ? (showEn ? page.titleEn || page.titleAr : page.titleAr) : '';
  const body = page ? (showEn ? page.bodyEn || page.bodyAr : page.bodyAr) : '';

  return (
    <Layout>
      {page && <SEOHead title={title} description={stripHtml(body).slice(0, 160)} />}
      <Container narrow className="space-y-8">
        {loading ? (
          <div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-brand-sand/60" />
        ) : page ? (
          <>
            <PageHero compact title={title} breadcrumbs={[{ label: 'الرئيسية', to: '/' }]} />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEn(false)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  !showEn ? 'bg-brand-ink text-white' : 'bg-brand-sand/70 text-brand-ink'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setShowEn(true)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  showEn ? 'bg-brand-ink text-white' : 'bg-brand-sand/70 text-brand-ink'
                }`}
              >
                English
              </button>
            </div>
            <div className="surface-elevated p-8 md:p-10" dir={showEn ? 'ltr' : 'rtl'}>
              <RichText html={body} className="leading-relaxed" dir={showEn ? 'ltr' : 'rtl'} />
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-brand-muted">الصفحة غير موجودة</div>
        )}
      </Container>
    </Layout>
  );
}
