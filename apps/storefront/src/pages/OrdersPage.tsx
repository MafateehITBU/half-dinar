import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import type { OrderSummary } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHero } from '../components/ui/PageHero';
import { api, isLoggedIn } from '../lib/api';

const STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  processing: 'قيد المعالجة',
  paid: 'مدفوع',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  refunded: 'مسترد',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  processing: 'bg-blue-50 text-blue-800 ring-blue-200',
  paid: 'bg-brand-green/10 text-brand-green ring-brand-green/20',
  shipped: 'bg-purple-50 text-purple-800 ring-purple-200',
  delivered: 'bg-green-50 text-green-800 ring-green-200',
  completed: 'bg-green-50 text-green-800 ring-green-200',
  cancelled: 'bg-red-50 text-red-800 ring-red-200',
  refunded: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export function OrdersPage() {
  const loggedIn = isLoggedIn();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loggedIn) {
      api.getOrders().then((r) => setOrders(r.data as OrderSummary[])).finally(() => setLoading(false));
    }
  }, [loggedIn]);

  if (!loggedIn) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Container narrow className="space-y-8">
        <PageHero compact title="طلباتي" subtitle="تابع حالة طلباتك وتاريخ الشراء" breadcrumbs={[{ label: 'الرئيسية', to: '/' }]} />

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-[var(--radius-panel)] bg-brand-sand/60" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon="mdi:clipboard-text-outline" title="لا توجد طلبات بعد" description="عند إتمام أول طلب سيظهر هنا" action={{ label: 'تسوق الآن', to: '/store' }} />
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <Link key={o.id} to={`/orders/${o.id}`} className="order-card group">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-display text-lg font-bold text-brand-ink group-hover:text-brand-green">
                      <Icon icon="mdi:package-variant" className="text-brand-green" />
                      {o.orderNumber}
                    </p>
                    <p className="mt-1 text-sm text-brand-muted">{new Date(o.createdAt).toLocaleDateString('ar-JO', { dateStyle: 'medium' })}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${STATUS_COLOR[o.status] ?? STATUS_COLOR.pending}`}>
                    {STATUS_AR[o.status] ?? o.status}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4" style={{ borderColor: 'var(--brand-sand)' }}>
                  <div className="text-sm text-brand-muted">
                    <span className="font-semibold text-brand-ink">
                      {o.paymentMethod === 'cod'
                        ? 'عند الاستلام'
                        : o.paymentMethod === 'meps'
                          ? 'بطاقة Visa / Mastercard'
                          : o.paymentMethod}
                    </span>
                    <span className="mx-1.5">·</span>
                    <span>
                      {o.paymentStatus === 'paid'
                        ? 'مدفوع'
                        : o.paymentStatus === 'failed'
                          ? 'فشل الدفع'
                          : 'غير مدفوع'}
                    </span>
                  </div>
                  <span className="text-xl font-extrabold text-brand-green">{o.total.toFixed(2)} <span className="text-xs font-medium">د.أ</span></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </Layout>
  );
}
