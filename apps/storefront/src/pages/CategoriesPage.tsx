import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import type { CategoryTree } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { SEOHead } from '../components/SEOHead';
import { CategoryCard, CategoryCardSkeleton } from '../components/home/CategoryCard';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHero } from '../components/ui/PageHero';
import { api } from '../lib/api';

function countProducts(nodes: CategoryTree[]): number {
  return nodes.reduce((sum, n) => sum + n.productCount + countProducts(n.children), 0);
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCategories()
      .then((res) => setCategories((res.data as CategoryTree[]).filter((c) => c.isActive)))
      .finally(() => setLoading(false));
  }, []);

  const rootCategories = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  const totalProducts = useMemo(() => countProducts(rootCategories), [rootCategories]);
  const subCount = useMemo(
    () => rootCategories.reduce((n, c) => n + c.children.length, 0),
    [rootCategories],
  );

  return (
    <Layout>
      <SEOHead
        title="جميع التصنيفات — النص أونلاين"
        description="تصفّح أقسام المتجر: منزل، مطبخ، نظافة، وأكثر — اختر التصنيف المناسب واطلب التوصيل في الأردن."
      />

      <Container className="space-y-10">
        <PageHero
          title="جميع التصنيفات"
          subtitle="كل أقسام المتجر في مكان واحد — اختر التصنيف الرئيسي أو تصفّح الأقسام الفرعية"
          breadcrumbs={[{ label: 'الرئيسية', to: '/' }]}
          stats={
            !loading && rootCategories.length > 0
              ? [
                  { label: 'تصنيف رئيسي', value: String(rootCategories.length) },
                  { label: 'أقسام فرعية', value: String(subCount) },
                  { label: 'منتج', value: totalProducts > 0 ? String(totalProducts) : '—' },
                ]
              : undefined
          }
        />

        {!loading && rootCategories.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-brand-muted">
              {rootCategories.length} تصنيف — اضغط على أي بطاقة للدخول إلى المتجر
            </p>
            <Link to="/store" className="btn-secondary gap-2 px-4 py-2 text-sm">
              <Icon icon="mdi:store-outline" />
              المتجر الكامل
            </Link>
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        ) : rootCategories.length > 0 ? (
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {rootCategories.map((cat, i) => (
              <CategoryCard key={cat.id} category={cat} index={i} showChildren />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="mdi:folder-outline"
            title="لا توجد تصنيفات بعد"
            description="يمكنك تصفّح جميع المنتجات من المتجر مباشرة"
            action={{ label: 'المتجر', to: '/store' }}
          />
        )}
      </Container>
    </Layout>
  );
}
