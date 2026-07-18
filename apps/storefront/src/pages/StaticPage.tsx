import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Container } from '../components/ui/Container';
import { PageHero } from '../components/ui/PageHero';
import { api } from '../lib/api';

export function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<{ titleAr: string; bodyAr: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      api.getCmsPage(slug).then((r) => setPage(r.data as typeof page)).finally(() => setLoading(false));
    }
  }, [slug]);

  return (
    <Layout>
      <Container narrow className="space-y-8">
        {loading ? (
          <div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-brand-sand/60" />
        ) : page ? (
          <>
            <PageHero compact title={page.titleAr} breadcrumbs={[{ label: 'الرئيسية', to: '/' }]} />
            <div className="surface-elevated prose-content p-8 md:p-10">
              <div className="whitespace-pre-wrap">{page.bodyAr}</div>
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-brand-muted">الصفحة غير موجودة</div>
        )}
      </Container>
    </Layout>
  );
}
