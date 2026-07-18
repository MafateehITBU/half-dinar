import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import type { OrderDetail } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { Container } from '../components/ui/Container';
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

export function OrderSuccessPage() {
  const loggedIn = isLoggedIn();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);

  useEffect(() => {
    if (loggedIn && id) api.getOrder(id).then((r) => setOrder(r.data as OrderDetail));
  }, [loggedIn, id]);

  if (!loggedIn) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Container narrow className="py-12">
        <div className="surface-elevated flex flex-col items-center px-6 py-14 text-center md:px-12">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-green text-5xl text-brand-gold-light shadow-glow">
            <Icon icon="mdi:check-bold" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-extrabold text-brand-ink">تم استلام طلبك!</h1>
          <p className="mt-2 text-brand-muted">شكراً لثقتك — سنتواصل معك عند تحديث حالة الطلب</p>

          {order && (
            <div className="mt-8 w-full max-w-sm rounded-2xl border bg-brand-cream p-5 text-right" style={{ borderColor: 'var(--brand-sand)' }}>
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">رقم الطلب</span>
                <span className="font-bold text-brand-ink">{order.orderNumber}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-brand-muted">الحالة</span>
                <span className="font-bold text-brand-green">{STATUS_AR[order.status] ?? order.status}</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2" style={{ borderColor: 'var(--brand-sand)' }}>
                <span className="text-brand-muted">المجموع</span>
                <span className="text-xl font-extrabold text-brand-green">{order.total.toFixed(2)} د.أ</span>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/orders" className="btn-primary">
              <Icon icon="mdi:clipboard-list-outline" />
              طلباتي
            </Link>
            <Link to="/store" className="btn-secondary">
              <Icon icon="mdi:store-outline" />
              متابعة التسوق
            </Link>
          </div>
        </div>
      </Container>
    </Layout>
  );
}
