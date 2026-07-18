import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Layout } from '../components/Layout';
import { ProductImage } from '../components/ProductImage';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHero } from '../components/ui/PageHero';
import { useCart } from '../context/CartContext';
import { api, isLoggedIn } from '../lib/api';
import { showInfo } from '../lib/toast';

interface WishlistItem {
  productId: string;
  nameAr: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  inStock: boolean;
}

export function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    if (!isLoggedIn()) return;
    api.getWishlist().then((res) => {
      const data = res.data as { items: WishlistItem[] };
      setItems(data.items ?? []);
    }).finally(() => setLoading(false));
  }, []);

  if (!isLoggedIn()) return <Navigate to="/login?redirect=wishlist" replace />;

  return (
    <Layout>
      <Container narrow className="space-y-8">
        <PageHero compact title="المفضلة" subtitle="المنتجات التي حفظتها للشراء لاحقاً" breadcrumbs={[{ label: 'الرئيسية', to: '/' }]} />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-brand-sand/60" />
            ))}
          </div>
        ) : !items.length ? (
          <EmptyState icon="mdi:heart-outline" title="قائمة المفضلة فارغة" description="اضغط على القلب في أي منتج لحفظه هنا" action={{ label: 'تصفّح المتجر', to: '/store' }} />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="list-row">
                <Link to={`/products/${item.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                  <ProductImage src={item.imageUrl} alt={item.nameAr} aspectClass="h-20 w-20" className="rounded-xl" showSkeleton={false} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/products/${item.slug}`} className="font-bold text-brand-ink hover:text-brand-green">
                    {item.nameAr}
                  </Link>
                  <p className="mt-0.5 text-lg font-extrabold text-brand-green">{item.price.toFixed(2)} د.أ</p>
                  {!item.inStock && <p className="text-xs text-red-600">غير متوفر</p>}
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  {item.inStock && (
                    <button
                      type="button"
                      onClick={() => addItem(item.productId).catch(() => {})}
                      className="btn-primary px-4 py-2 text-xs"
                    >
                      <Icon icon="mdi:cart-plus" />
                      أضف
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      api.toggleWishlist(item.productId).then(() => {
                        setItems((prev) => prev.filter((i) => i.productId !== item.productId));
                        showInfo(`حُذف «${item.nameAr}» من المفضلة`);
                      })
                    }
                    className="btn-ghost text-red-600 hover:bg-red-50"
                  >
                    <Icon icon="mdi:heart-off-outline" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </Layout>
  );
}
