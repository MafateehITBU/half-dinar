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

const PAYMENT_STATUS_AR: Record<string, string> = {
  paid: 'مدفوع',
  pending: 'غير مدفوع',
  failed: 'فشل الدفع',
  refunded: 'مسترد',
};

function paymentMethodLabel(method: string): string {
  if (method === 'cod') return 'الدفع عند الاستلام';
  if (method === 'meps') return 'بطاقة Visa / Mastercard';
  if (method === 'stripe') return 'بطاقة ائتمان';
  return method;
}

function paymentMethodIcon(method: string): string {
  if (method === 'cod') return 'mdi:cash';
  if (method === 'meps' || method === 'stripe') return 'mdi:credit-card-outline';
  return 'mdi:wallet-outline';
}

function paymentBlurb(method: string, status: string): string {
  if (method === 'cod') {
    return status === 'paid'
      ? 'تم تحصيل المبلغ عند التسليم'
      : 'ستدفع نقداً عند استلام الطلب';
  }
  if (method === 'meps' || method === 'stripe') {
    return status === 'paid'
      ? 'تم الدفع بالبطاقة بنجاح'
      : status === 'failed'
        ? 'لم يكتمل الدفع بالبطاقة'
        : 'بانتظار تأكيد الدفع بالبطاقة';
  }
  return '';
}

function addressLines(addr: Record<string, unknown> | null | undefined): string[] {
  if (!addr) return [];
  return [addr.label, addr.governorate, addr.city, addr.street, addr.building, addr.phone]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean);
}

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
  const addr = addressLines(order.shippingAddress);
  const paidByCard = (order.paymentMethod === 'meps' || order.paymentMethod === 'stripe') && order.paymentStatus === 'paid';

  return (
    <Layout>
      <Container narrow className="space-y-8">
        <PageHero
          compact
          title={`طلب ${order.orderNumber}`}
          subtitle={`${STATUS_AR[order.status] ?? order.status} · ${new Date(order.createdAt).toLocaleString('ar-JO')}`}
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

        <section className="summary-panel space-y-3">
          <h2 className="font-display text-base font-extrabold text-brand-ink">تفاصيل الدفع</h2>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
              <Icon icon={paymentMethodIcon(order.paymentMethod)} className="text-xl" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-brand-ink">{paymentMethodLabel(order.paymentMethod)}</p>
              <p className="mt-0.5 text-sm text-brand-muted">{paymentBlurb(order.paymentMethod, order.paymentStatus)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
                    order.paymentStatus === 'paid'
                      ? 'bg-green-50 text-green-800 ring-green-200'
                      : order.paymentStatus === 'failed'
                        ? 'bg-red-50 text-red-800 ring-red-200'
                        : 'bg-amber-50 text-amber-800 ring-amber-200'
                  }`}
                >
                  {PAYMENT_STATUS_AR[order.paymentStatus] ?? order.paymentStatus}
                </span>
                {paidByCard && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-2.5 py-0.5 text-xs font-bold text-brand-green ring-1 ring-brand-green/20">
                    <Icon icon="logos:visa" className="text-sm" />
                    مدفوع بالبطاقة
                  </span>
                )}
              </div>
              {order.paytabsTranRef && (
                <p className="mt-2 break-all font-mono text-[11px] text-brand-muted">
                  مرجع العملية: {order.paytabsTranRef}
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="space-y-3">
          <h2 className="font-display text-base font-extrabold text-brand-ink">المنتجات</h2>
          {order.items.map((item) => (
            <div key={item.id} className="list-row justify-between">
              <div>
                <p className="font-medium text-brand-ink">{item.name}</p>
                <p className="text-xs text-brand-muted">
                  {item.quantity} × {item.unitPrice.toFixed(2)} د.أ
                  {item.sku ? ` · ${item.sku}` : ''}
                </p>
              </div>
              <span className="font-extrabold text-brand-green">{item.total.toFixed(2)} د.أ</span>
            </div>
          ))}
        </div>

        <div className="summary-panel space-y-2">
          <div className="flex justify-between text-sm"><span className="text-brand-muted">المجموع الفرعي</span><span>{order.subtotal.toFixed(2)} د.أ</span></div>
          <div className="flex justify-between text-sm">
            <span className="text-brand-muted">التوصيل</span>
            <span>{order.shippingAmount === 0 ? 'مجاني' : `${order.shippingAmount.toFixed(2)} د.أ`}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-700">
              <span>الخصم</span>
              <span>-{order.discountAmount.toFixed(2)} د.أ</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-3 text-lg font-extrabold" style={{ borderColor: 'var(--brand-sand)' }}>
            <span>الإجمالي</span>
            <span className="text-brand-green">{order.total.toFixed(2)} د.أ</span>
          </div>
        </div>

        {addr.length > 0 && (
          <section className="summary-panel">
            <h2 className="font-display text-base font-extrabold text-brand-ink">عنوان التوصيل</h2>
            <p className="mt-2 leading-relaxed text-sm text-brand-muted">{addr.join(' · ')}</p>
          </section>
        )}

        {order.notes && (
          <section className="summary-panel">
            <h2 className="font-display text-base font-extrabold text-brand-ink">ملاحظات</h2>
            <p className="mt-2 text-sm text-brand-muted">{order.notes}</p>
          </section>
        )}

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
