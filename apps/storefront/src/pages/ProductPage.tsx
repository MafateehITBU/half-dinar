import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { ProductDetail, ProductReviews } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { Container } from '../components/ui/Container';
import { SEOHead } from '../components/SEOHead';
import { Icon } from '@iconify/react';
import { BRAND } from '@half-dinar/shared';
import { ProductCard } from '../components/ProductCard';
import { ProductGallery } from '../components/ProductGallery';
import { RichText, stripHtml } from '../components/RichText';
import { Skeleton } from '../components/ui/Skeleton';
import { useCart } from '../context/CartContext';
import { api, isLoggedIn } from '../lib/api';
import { getCompareIds, toggleCompare } from '../lib/compare';
import { showError, showInfo, showSuccess } from '../lib/toast';

function QtyStepper({
  value,
  max,
  onChange,
  compact,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={`pd-qty ${compact ? 'pd-qty-sm' : ''}`}>
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1} aria-label="تقليل">
        <Icon icon="mdi:minus" />
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="زيادة">
        <Icon icon="mdi:plus" />
      </button>
    </div>
  );
}

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<ProductReviews | null>(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [inCompare, setInCompare] = useState(false);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();
  const [jsonLd, setJsonLd] = useState<Record<string, unknown> | undefined>();

  useEffect(() => {
    if (!slug) return;
    api.getProduct(slug).then((res) => setProduct(res.data as ProductDetail));
    api.getProductReviews(slug).then((res) => setReviews(res.data as ProductReviews));
    api.getProductJsonLd(slug).then((res) => setJsonLd(res.data)).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    setInCompare(getCompareIds().includes(product.id));
    setQty(1);
    setJustAdded(false);
    if (isLoggedIn()) {
      api.checkWishlist(product.id).then((r) => setInWishlist(r.data.inWishlist));
    }
  }, [product]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addItem(product.id, qty);
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 2500);
    } catch {
      /* toast shown in CartContext */
    }
  };

  if (!product) {
    return (
      <Layout>
        <Container className="pd-page pb-36 lg:pb-12">
          <div className="pd-grid">
            <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
            <div className="space-y-4 py-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-4/5" />
              <Skeleton className="h-14 w-32" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
          </div>
        </Container>
      </Layout>
    );
  }

  const gallery =
    product.images.length > 0
      ? product.images.map((i) => i.url)
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const discountPct =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;

  const reviewCount = reviews?.reviews.length ?? product.reviewCount;

  return (
    <Layout>
      <SEOHead
        title={`${product.nameAr} — ${BRAND.nameAr}`}
        description={stripHtml(product.descriptionAr ?? '').slice(0, 160) || product.nameAr}
        jsonLd={jsonLd}
      />

      <Container className="pd-page pb-36 lg:pb-20">
        <Link to={`/store?category=${product.category.slug}`} className="pd-back">
          <Icon icon="mdi:arrow-right" />
          {product.category.nameAr}
        </Link>

        <div className="pd-grid">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <ProductGallery images={gallery} alt={product.nameAr} discountPct={discountPct} />
          </motion.div>

          <motion.div
            className="pd-info"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06 }}
          >
            <div className="pd-info-sticky">
              <div className="pd-info-top">
                <div className="pd-labels">
                  {discountPct && (
                    <span className="pd-sale-label">
                      <Icon icon="mdi:flash" />
                      -{discountPct}%
                    </span>
                  )}
                  {product.isFeatured && <span className="pd-featured-label">مميز</span>}
                  <span className={`pd-stock-dot ${product.inStock ? 'pd-stock-dot-in' : 'pd-stock-dot-out'}`} />
                  <span className="pd-stock-text">
                    {product.inStock ? `${product.stockQuantity} متوفر` : 'نفد'}
                  </span>
                </div>

                <div className="pd-actions">
                  {isLoggedIn() && (
                    <button
                      type="button"
                      className={`pd-action ${inWishlist ? 'pd-action-on' : ''}`}
                      onClick={() =>
                        api.toggleWishlist(product.id).then((r) => {
                          const d = r.data as { inWishlist?: boolean };
                          const next = d.inWishlist ?? !inWishlist;
                          setInWishlist(next);
                          showSuccess(next ? 'أُضيف للمفضلة' : 'حُذف من المفضلة');
                        }).catch((err) =>
                          showError(err instanceof Error ? err.message : 'تعذر تحديث المفضلة'),
                        )
                      }
                      aria-label="المفضلة"
                    >
                      <Icon icon={inWishlist ? 'mdi:heart' : 'mdi:heart-outline'} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`pd-action ${inCompare ? 'pd-action-on' : ''}`}
                    onClick={() => {
                      const wasIn = getCompareIds().includes(product.id);
                      const ids = toggleCompare(product.id);
                      const nowIn = ids.includes(product.id);
                      setInCompare(nowIn);
                      if (!wasIn && !nowIn) {
                        showError('يمكن مقارنة 4 منتجات كحد أقصى');
                      } else {
                        showInfo(nowIn ? 'أُضيف للمقارنة' : 'أُزيل من المقارنة');
                      }
                    }}
                    aria-label="قارن"
                  >
                    <Icon icon="mdi:scale-balance" />
                  </button>
                </div>
              </div>

              <span className="brand-divider pd-divider" />

              <h1 className="pd-title">{product.nameAr}</h1>
              <p className="pd-en" dir="ltr">
                {product.nameEn}
              </p>

              {product.reviewCount > 0 && (
                <a href="#reviews" className="pd-rating">
                  <Icon icon="mdi:star" />
                  {product.avgRating.toFixed(1)}
                  <span>({product.reviewCount})</span>
                </a>
              )}

              <div className="pd-price-wrap">
                <div className="pd-price-tag">
                  <span className="pd-price">{product.price.toFixed(2)}</span>
                  <span className="pd-currency">د.أ</span>
                </div>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="pd-was">{product.compareAtPrice.toFixed(2)} د.أ</span>
                )}
              </div>

              {product.inStock && (
                <div className="pd-buy hidden lg:flex">
                  <QtyStepper value={qty} max={product.stockQuantity} onChange={setQty} />
                  <button type="button" onClick={handleAddToCart} className="pd-buy-btn">
                    <Icon icon={justAdded ? 'mdi:check' : 'mdi:cart-outline'} />
                    {justAdded ? 'تمت الإضافة' : `أضف للسلة · ${(product.price * qty).toFixed(2)} د.أ`}
                  </button>
                </div>
              )}

              {!product.inStock && (
                <p className="pd-oos">غير متوفر — سنعود قريباً</p>
              )}

              <AnimatePresence>
                {justAdded && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pd-added"
                  >
                    <Link to="/cart">عرض السلة ←</Link>
                  </motion.p>
                )}
              </AnimatePresence>

              {product.descriptionAr && (
                <p className="pd-lead">{stripHtml(product.descriptionAr).slice(0, 180)}</p>
              )}

              {product.tags.length > 0 && (
                <div className="pd-tags">
                  {product.tags.map((t) => (
                    <Link key={t.id} to={`/store?tags=${t.slug}`}>
                      {t.nameAr}
                    </Link>
                  ))}
                </div>
              )}

              <ul className="pd-perks">
                <li><Icon icon="mdi:truck-fast-outline" /> توصيل سريع</li>
                <li><Icon icon="mdi:shield-check-outline" /> دفع آمن</li>
              </ul>

              <p className="pd-sku">SKU · {product.sku}</p>
            </div>
          </motion.div>
        </div>

        <div className="pd-below">
          <section id="description" className="pd-block">
            <header className="pd-block-head">
              <span className="pd-block-num">01</span>
              <h2>الوصف</h2>
            </header>
            <div className="pd-block-body">
              {product.descriptionAr ? (
                <RichText html={product.descriptionAr} />
              ) : (
                <p className="text-brand-muted">لا يوجد وصف إضافي.</p>
              )}
              {product.descriptionEn && (
                <RichText html={product.descriptionEn} className="mt-5 opacity-70" dir="ltr" />
              )}
            </div>
          </section>

          <section id="reviews" className="pd-block">
            <header className="pd-block-head">
              <span className="pd-block-num">02</span>
              <h2>التقييمات {reviewCount > 0 && <em>{reviewCount}</em>}</h2>
            </header>
            {reviews && reviews.reviews.length > 0 ? (
              <ul className="pd-reviews">
                {reviews.reviews.map((r) => (
                  <li key={r.id} className="pd-review">
                    <div className="pd-review-top">
                      <strong>{r.userName}</strong>
                      <span>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    {r.title && <p className="pd-review-title">{r.title}</p>}
                    {r.body && <p className="pd-review-body">{r.body}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pd-block-empty">لا توجد تقييمات بعد.</p>
            )}
          </section>

          {product.relatedProducts.length > 0 && (
            <section className="pd-block pd-block-wide">
              <header className="pd-block-head">
                <span className="pd-block-num">03</span>
                <h2>ذات صلة</h2>
              </header>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {product.relatedProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      </Container>

      {product.inStock && (
        <div className="pd-mobile-bar lg:hidden">
          <div className="pd-mobile-price">
            <strong>{product.price.toFixed(2)}</strong>
            <span>د.أ</span>
          </div>
          <QtyStepper value={qty} max={product.stockQuantity} onChange={setQty} compact />
          <button type="button" onClick={handleAddToCart} className="pd-mobile-cta">
            {justAdded ? '✓' : 'أضف'}
          </button>
        </div>
      )}
    </Layout>
  );
}
