import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import type { OrderDetail } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { Container } from '../components/ui/Container';
import { PageHero } from '../components/ui/PageHero';
import { api, isLoggedIn, openOrderInvoice } from '../lib/api';

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

const REFUND_ELIGIBLE = ['delivered', 'completed'];

export function OrderDetailPage() {
  const loggedIn = isLoggedIn();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [showRefund, setShowRefund] = useState(false);
  const [reason, setReason] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [refundMsg, setRefundMsg] = useState('');
  const [refundError, setRefundError] = useState('');

  useEffect(() => {
    if (loggedIn && id) api.getOrder(id).then((r) => setOrder(r.data as OrderDetail));
  }, [loggedIn, id]);

  const submitRefund = async (e: FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setRefundError('');
    setRefundMsg('');
    try {
      await api.createRefund({
        orderId: order.id,
        reason,
        imageUrls: imageUrls.split('\n').map((s) => s.trim()).filter(Boolean),
      });
      setRefundMsg('تم إرسال طلب الاسترداد. سنراجعه خلال 14 يوماً.');
      setShowRefund(false);
    } catch (err) {
      setRefundError(err instanceof Error ? err.message : 'فشل الإرسال');
    }
  };

  if (!loggedIn) return <Navigate to="/login" replace />;

  if (!order) {
    return (
      <Layout>
        <Container narrow className="py-16">
          <div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-brand-sand/60" />
        </Container>
      </Layout>
    );
  }

  const canRefund = REFUND_ELIGIBLE.includes(order.status);

  return (
    <Layout>
      <Container narrow className="space-y-8">
        <PageHero
          compact
          title={`طلب ${order.orderNumber}`}
          subtitle={`الحالة: ${STATUS_AR[order.status] ?? order.status}`}
          breadcrumbs={[{ label: 'الرئيسية', to: '/' }, { label: 'طلباتي', to: '/orders' }]}
          action={
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => openOrderInvoice(order.id, 'html')} className="btn-secondary !border-white/30 !bg-white/10 !text-white text-xs">
                <Icon icon="mdi:printer" />
                طباعة
              </button>
              <button type="button" onClick={() => openOrderInvoice(order.id, 'pdf')} className="btn-accent text-xs">
                <Icon icon="mdi:download" />
                PDF
              </button>
            </div>
          }
        />

        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="list-row justify-between">
              <span className="font-medium text-brand-ink">{item.name} × {item.quantity}</span>
              <span className="font-extrabold text-brand-green">{item.total.toFixed(2)} د.أ</span>
            </div>
          ))}
        </div>

        <div className="summary-panel space-y-2">
          <div className="flex justify-between text-sm"><span className="text-brand-muted">المجموع الفرعي</span><span>{order.subtotal.toFixed(2)} د.أ</span></div>
          <div className="flex justify-between text-sm"><span className="text-brand-muted">التوصيل</span><span>{order.shippingAmount.toFixed(2)} د.أ</span></div>
          <div className="flex justify-between border-t pt-3 text-lg font-extrabold" style={{ borderColor: 'var(--brand-sand)' }}>
            <span>الإجمالي</span>
            <span className="text-brand-green">{order.total.toFixed(2)} د.أ</span>
          </div>
        </div>

        {canRefund && order.status !== 'refunded' && (
          <div className="rounded-[var(--radius-panel)] border border-amber-200 bg-amber-50 p-5">
            <p className="flex items-start gap-2 text-sm text-amber-900">
              <Icon icon="mdi:information-outline" className="mt-0.5 shrink-0" />
              يمكنك طلب استرداد خلال 14 يوماً من تاريخ الطلب
            </p>
            {!showRefund ? (
              <button type="button" onClick={() => setShowRefund(true)} className="btn-accent mt-4 text-sm">
                طلب استرداد
              </button>
            ) : (
              <form onSubmit={submitRefund} className="mt-4 space-y-3">
                <textarea required minLength={10} placeholder="سبب الاسترداد..." value={reason} onChange={(e) => setReason(e.target.value)} className="input-field" rows={4} />
                <textarea placeholder="روابط صور الدليل (سطر لكل رابط)" value={imageUrls} onChange={(e) => setImageUrls(e.target.value)} className="input-field" rows={2} />
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">إرسال</button>
                  <button type="button" onClick={() => setShowRefund(false)} className="btn-ghost">إلغاء</button>
                </div>
                {refundError && <p className="text-sm text-red-600">{refundError}</p>}
              </form>
            )}
            {refundMsg && <p className="mt-2 text-sm text-green-700">{refundMsg}</p>}
          </div>
        )}

        <section>
          <h2 className="font-display text-lg font-extrabold text-brand-ink">سجل الحالة</h2>
          <ol className="relative mt-4 space-y-0 border-r-2 pr-6" style={{ borderColor: 'var(--brand-green)' }}>
            {order.timeline.map((t) => (
              <li key={t.id} className="relative pb-6 last:pb-0">
                <span className="absolute -right-[1.65rem] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-green ring-4 ring-brand-cream">
                  <Icon icon="mdi:check" className="text-[10px] text-brand-gold-light" />
                </span>
                <p className="font-bold text-brand-ink">{STATUS_AR[t.toStatus] ?? t.toStatus}</p>
                {t.note && <p className="text-sm text-brand-muted">{t.note}</p>}
                <p className="mt-0.5 text-xs text-brand-muted">{new Date(t.createdAt).toLocaleString('ar-JO')}</p>
              </li>
            ))}
          </ol>
        </section>

        <Link to="/orders" className="btn-secondary inline-flex">
          <Icon icon="mdi:arrow-right" />
          العودة للطلبات
        </Link>
      </Container>
    </Layout>
  );
}
