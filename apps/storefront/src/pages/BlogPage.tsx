import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Layout } from '../components/Layout';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHero } from '../components/ui/PageHero';
import { api } from '../lib/api';

interface BlogPost {
  id: string;
  slug: string;
  titleAr: string;
  excerptAr?: string;
  publishedAt?: string;
}

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBlogPosts().then((res) => setPosts(res.data as BlogPost[])).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <Container className="space-y-8">
        <PageHero title="المدونة" subtitle="نصائح، عروض، وآخر أخبار المتجر" breadcrumbs={[{ label: 'الرئيسية', to: '/' }]} />

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-[var(--radius-panel)] bg-brand-sand/60" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState icon="mdi:post-outline" title="لا توجد مقالات بعد" description="تابعنا — محتوى جديد قريباً" action={{ label: 'الرئيسية', to: '/' }} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {posts.map((p) => (
              <article key={p.id} className="bento-cell group p-6 transition hover:shadow-float">
                <span className="badge-gold">
                  <Icon icon="mdi:post-outline" />
                  مقال
                </span>
                <Link to={`/blog/${p.slug}`} className="mt-3 block font-display text-xl font-extrabold text-brand-ink group-hover:text-brand-green">
                  {p.titleAr}
                </Link>
                {p.excerptAr && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-brand-muted">{p.excerptAr}</p>}
                <div className="mt-4 flex items-center justify-between">
                  {p.publishedAt && (
                    <span className="text-xs text-brand-muted">{new Date(p.publishedAt).toLocaleDateString('ar-JO')}</span>
                  )}
                  <Link to={`/blog/${p.slug}`} className="flex items-center gap-1 text-sm font-bold text-brand-green">
                    اقرأ
                    <Icon icon="mdi:arrow-left" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </Layout>
  );
}
