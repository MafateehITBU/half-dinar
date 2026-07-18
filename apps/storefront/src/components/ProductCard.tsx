import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { ProductSummary } from '@half-dinar/shared';
import { useCart } from '../context/CartContext';
import { ProductImage } from './ProductImage';

export function ProductCard({
  product,
  index = 0,
  layout = 'grid',
}: {
  product: ProductSummary;
  index?: number;
  layout?: 'grid' | 'compact';
}) {
  const { addItem } = useCart();
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : 0;

  const add = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    addItem(product.id).catch(() => {});
  };

  if (layout === 'compact') {
    return (
      <motion.article
        initial={{ opacity: 0, x: -12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.04 }}
        className="list-row group"
      >
        <Link to={`/products/${product.slug}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 ring-brand-sand transition group-hover:ring-brand-gold">
          <ProductImage src={product.imageUrl} alt={product.nameAr} aspectClass="h-16 w-16" className="rounded-xl" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/products/${product.slug}`} className="line-clamp-1 font-bold text-brand-ink group-hover:text-brand-green">
            {product.nameAr}
          </Link>
          <p className="text-sm font-extrabold text-brand-green">{product.price.toFixed(2)} د.أ</p>
        </div>
        <button type="button" disabled={!product.inStock} onClick={add} className="btn-icon shrink-0">
          <Icon icon="mdi:cart-plus" />
        </button>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-24px' }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="product-card group"
    >
      {/* decorative back layer */}
      <div className="product-card-shadow" aria-hidden />

      <div className="product-card-inner">
        {/* image stage */}
        <div className="relative">
          <Link to={`/products/${product.slug}`} className="product-card-media block">
            <ProductImage
              src={product.imageUrl}
              alt={product.nameAr}
              aspectClass="aspect-[4/5]"
              className="rounded-[1.1rem]"
              imgClassName="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
            />

            {!product.inStock && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[1.1rem] bg-brand-green-dark/55 backdrop-blur-[2px]">
                <span className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-red-600 shadow-lg">نفذت الكمية</span>
              </div>
            )}
          </Link>

          {/* top badges */}
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5">
              {product.isFeatured && (
                <span className="product-card-badge product-card-badge-gold">
                  <Icon icon="mdi:sparkles" />
                  مميز
                </span>
              )}
              {discount > 0 && (
                <span className="product-card-badge product-card-badge-sale">
                  <Icon icon="mdi:tag" />
                  -{discount}%
                </span>
              )}
            </div>
            {product.avgRating > 0 && (
              <span className="product-card-badge product-card-badge-rating">
                <Icon icon="mdi:star" className="text-brand-gold" />
                {product.avgRating.toFixed(1)}
              </span>
            )}
          </div>

          {/* floating price tag */}
          <motion.div
            className="product-card-price-tag"
            whileHover={{ rotate: 0, scale: 1.04 }}
            initial={false}
          >
            <span className="text-[10px] font-bold uppercase tracking-wide text-brand-green-dark/70">السعر</span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-xl font-extrabold text-brand-green-dark">{product.price.toFixed(2)}</span>
              <span className="text-xs font-bold text-brand-green-dark/80">د.أ</span>
            </div>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[11px] text-brand-green-dark/60 line-through">{product.compareAtPrice.toFixed(2)}</span>
            )}
          </motion.div>

          {/* hover quick actions */}
          {product.inStock && (
            <div className="product-card-actions">
              <button type="button" onClick={add} className="product-card-action-btn product-card-action-primary" aria-label="أضف للسلة">
                <Icon icon="mdi:cart-plus" className="text-xl" />
              </button>
              <Link to={`/products/${product.slug}`} className="product-card-action-btn" aria-label="عرض المنتج">
                <Icon icon="mdi:arrow-left" className="text-xl" />
              </Link>
            </div>
          )}
        </div>

        {/* info */}
        <div className="px-4 pb-4 pt-3">
          <Link to={`/products/${product.slug}`} className="mb-1 inline-flex max-w-full">
            <span className="truncate rounded-full bg-brand-cream px-2.5 py-0.5 text-[10px] font-bold text-brand-green ring-1 ring-brand-sand">
              {product.category.nameAr}
            </span>
          </Link>

          <Link to={`/products/${product.slug}`}>
            <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-sm font-extrabold leading-snug text-brand-ink transition group-hover:text-brand-green">
              {product.nameAr}
            </h3>
          </Link>

          <p className="mt-0.5 line-clamp-1 text-[11px] text-brand-muted">{product.nameEn}</p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={!product.inStock}
              onClick={add}
              className="btn-primary flex-1 py-2.5 text-xs md:opacity-100 md:group-hover:shadow-glow"
            >
              <Icon icon="mdi:cart-outline" />
              {product.inStock ? 'أضف للسلة' : 'غير متوفر'}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
