import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { CartItem } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { ProductImage } from '../components/ProductImage';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHero } from '../components/ui/PageHero';
import { useCart } from '../context/CartContext';

function itemId(item: CartItem) {
  return item.type === 'package' ? item.packageId! : item.productId!;
}

function itemLink(item: CartItem) {
  return item.type === 'package' ? `/packages/${item.slug}` : `/products/${item.slug}`;
}

export function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart();
  const campaignSavings = cart?.items.reduce((sum, i) => sum + (i.savings ?? 0), 0) ?? 0;

  return (
    <Layout>
      <Container narrow className="space-y-8">
        <PageHero compact title="سلة التسوق" subtitle="راجع منتجاتك قبل إتمام الطلب" breadcrumbs={[{ label: 'الرئيسية', to: '/' }]} />

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-[var(--radius-panel)] bg-brand-sand/60" />
            ))}
          </div>
        ) : !cart?.items.length ? (
          <EmptyState icon="mdi:cart-off" title="سلتك فارغة" description="ابدأ بإضافة منتجات من المتجر" action={{ label: 'ابدأ التسوق', to: '/store' }} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {cart.items.map((item, i) => (
                <motion.div
                  key={`${item.type}-${itemId(item)}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="cart-row"
                >
                  <Link to={itemLink(item)} className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl ring-2 ring-brand-sand">
                    <ProductImage src={item.imageUrl} alt={item.nameAr} aspectClass="h-24 w-24" className="rounded-2xl" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    {item.type === 'package' && (
                      <span className="badge-gold mb-1">
                        <Icon icon="mdi:gift-outline" />
                        باقة
                      </span>
                    )}
                    <Link to={itemLink(item)} className="block font-bold text-brand-ink hover:text-brand-green">
                      {item.nameAr}
                    </Link>
                    <div className="flex flex-wrap items-baseline gap-2 text-sm">
                      {item.originalUnitPrice && item.originalUnitPrice > item.unitPrice && (
                        <span className="text-brand-muted line-through">{item.originalUnitPrice.toFixed(2)} د.أ</span>
                      )}
                      <span className="font-semibold text-brand-green">{item.unitPrice.toFixed(2)} د.أ / وحدة</span>
                      {item.savings && item.savings > 0 && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-200">
                          وفّرت {(item.savings).toFixed(2)} د.أ
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div className="flex items-center rounded-2xl border-2 bg-brand-cream" style={{ borderColor: 'var(--brand-sand)' }}>
                        <button type="button" onClick={() => updateItem(item.type, itemId(item), Math.max(1, item.quantity - 1))} className="px-3 py-1.5 text-brand-green">−</button>
                        <span className="min-w-[2rem] text-center text-sm font-bold">{item.quantity}</span>
                        <button type="button" onClick={() => updateItem(item.type, itemId(item), Math.min(item.maxQuantity, item.quantity + 1))} className="px-3 py-1.5 text-brand-green">+</button>
                      </div>
                      <button type="button" onClick={() => removeItem(item.type, itemId(item))} className="btn-ghost text-red-600 hover:bg-red-50">
                        <Icon icon="mdi:trash-can-outline" />
                        حذف
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0 self-start text-lg font-extrabold text-brand-green">{item.lineTotal.toFixed(2)} <span className="text-xs">د.أ</span></p>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="summary-panel lg:sticky lg:top-28">
              <h2 className="font-display text-lg font-extrabold text-brand-ink">ملخص الطلب</h2>
              <div className="mt-5 flex justify-between rounded-2xl bg-brand-cream p-4">
                <span className="text-sm text-brand-muted">المجموع الفرعي</span>
                <span className="text-xl font-extrabold text-brand-green">{cart.subtotal.toFixed(2)} د.أ</span>
              </div>
              {campaignSavings > 0 && (
                <p className="mt-3 flex items-center justify-between rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 ring-1 ring-red-200">
                  <span className="flex items-center gap-1.5">
                    <Icon icon="mdi:flash" />
                    خصم العروض
                  </span>
                  <span>-{campaignSavings.toFixed(2)} د.أ</span>
                </p>
              )}
              <p className="mt-3 flex items-center gap-2 text-xs text-brand-muted">
                <Icon icon="mdi:information-outline" />
                الشحن والخصم يُحسبان في صفحة الدفع
              </p>
              <Link to="/checkout" className="btn-primary mt-6 w-full py-3.5 text-center text-base">
                <Icon icon="mdi:lock-outline" />
                متابعة الدفع
              </Link>
              <Link to="/store" className="btn-ghost mt-3 w-full justify-center">
                متابعة التسوق
              </Link>
            </motion.div>
          </div>
        )}
      </Container>
    </Layout>
  );
}
