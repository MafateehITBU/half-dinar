import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Layout } from '../components/Layout';
import { Container } from '../components/ui/Container';
import { RichText } from '../components/RichText';
import { api } from '../lib/api';

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<{ titleAr: string; bodyAr: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      api.getBlogPost(slug).then((r) => setPost(r.data as typeof post)).finally(() => setLoading(false));
    }
  }, [slug]);

  return (
    <Layout>
      <Container narrow className="py-8 md:py-12">
        {loading ? (
          <div className="h-96 animate-pulse rounded-[var(--radius-panel)] bg-brand-sand/60" />
        ) : post ? (
          <article>
            <Link to="/blog" className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-brand-green hover:underline">
              <Icon icon="mdi:arrow-right" />
              العودة للمدونة
            </Link>
            <header className="panel-dark p-8 md:p-10">
              <span className="hero-badge">
                <Icon icon="mdi:post-outline" />
                مقال
              </span>
              <h1 className="hero-text-shadow mt-4 font-display text-3xl font-extrabold text-white md:text-4xl">{post.titleAr}</h1>
            </header>
            <div className="surface-elevated mt-6 p-8 md:p-10">
              <RichText html={post.bodyAr} />
            </div>
          </article>
        ) : (
          <div className="py-16 text-center text-brand-muted">المقال غير موجود</div>
        )}
      </Container>
    </Layout>
  );
}
