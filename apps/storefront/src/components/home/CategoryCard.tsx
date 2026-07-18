import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { CategoryTree } from '@half-dinar/shared';
import { ProductImage } from '../ProductImage';

const FALLBACK_ICONS = [
  'mdi:food-apple-outline',
  'mdi:spray-bottle',
  'mdi:pot-outline',
  'mdi:paper-roll-outline',
  'mdi:bottle-soda-outline',
  'mdi:lightbulb-outline',
];

interface CategoryCardProps {
  category: CategoryTree;
  index: number;
  /** Show subcategory chips (categories listing page) */
  showChildren?: boolean;
}

export function CategoryCard({ category, index, showChildren = false }: CategoryCardProps) {
  const icon = category.icon ?? FALLBACK_ICONS[index % FALLBACK_ICONS.length];
  const indexLabel = String(index + 1).padStart(2, '0');
  const metaParts: string[] = [];
  if (category.productCount > 0) metaParts.push(`${category.productCount} منتج`);
  if (category.children.length > 0) metaParts.push(`${category.children.length} قسم فرعي`);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="category-card"
    >
      <Link to={`/store?category=${category.slug}`} className="category-card-main group">
        <div className="category-card-visual">
          {category.imageUrl ? (
            <ProductImage
              src={category.imageUrl}
              alt={category.nameAr}
              aspectClass="aspect-[4/5] w-full"
              className="h-full w-full"
              imgClassName="category-card-img h-full w-full object-cover"
            />
          ) : (
            <div className="category-card-fallback" aria-hidden>
              <Icon icon={icon} />
            </div>
          )}
          <div className="category-card-overlay" />
          <span className="category-card-index">{indexLabel}</span>
          <div className="category-card-content">
            <h3 className="category-card-title">{category.nameAr}</h3>
            {metaParts.length > 0 && <p className="category-card-meta">{metaParts.join(' · ')}</p>}
            <span className="category-card-cta">
              تصفّح القسم
              <Icon icon="mdi:arrow-left" />
            </span>
          </div>
        </div>
      </Link>

      {showChildren && category.children.length > 0 && (
        <div className="category-card-subs">
          {category.children.map((child) => (
            <Link key={child.id} to={`/store?category=${child.slug}`} className="category-chip">
              {child.nameAr}
            </Link>
          ))}
        </div>
      )}
    </motion.article>
  );
}

/** Skeleton placeholder matching category card proportions */
export function CategoryCardSkeleton() {
  return <div className="category-card-skeleton" aria-hidden />;
}
