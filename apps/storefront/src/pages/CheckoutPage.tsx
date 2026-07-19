import { Link, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { JORDAN_GOVERNORATES, shippingAddressSchema } from '@half-dinar/shared';
import type { CheckoutQuote, OrderDetail } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { ProductImage } from '../components/ProductImage';
import { Container } from '../components/ui/Container';
import { PageHero } from '../components/ui/PageHero';
import { StripePaymentStep } from '../components/StripePaymentStep';
import { useCart } from '../context/CartContext';
import { api, isLoggedIn, type PublicConfig } from '../lib/api';
import { formatZodErrors } from '../lib/errors';
import { showError, showInfo, showSuccess } from '../lib/toast';

const STEPS = ['العنوان', 'الشحن', 'الدفع', 'تأكيد'];

export function CheckoutPage() {
  const { cart } = useCart();
  const [step, setStep] = useState(0);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [governorateCode, setGovernorateCode] = useState('AM');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'stripe'>('cod');
  const [address, setAddress] = useState({
    label: 'المنزل',
    governorate: 'عمان',
    city: '',
    street: '',
    building: '',
    phone: '',
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [orderResult, setOrderResult] = useState<{ order: OrderDetail; clientSecret?: string } | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() ?? '',
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isLoggedIn()) return <Navigate to="/login?redirect=checkout" replace />;

  useEffect(() => {
    api.getPublicConfig().then((r) => {
      const cfg = r.data as PublicConfig & { stripe?: { enabled: boolean; publishableKey: string } };
      if (cfg.stripe?.enabled && cfg.stripe.publishableKey) {
        setStripeEnabled(true);
        setStripePublishableKey((prev: string) => prev || cfg.stripe!.publishableKey);
      }
    });
  }, []);

  const fetchQuote = () => {
    api
      .getCheckoutQuote(governorateCode, couponCode || undefined, loyaltyPoints || undefined)
      .then((r) => setQuote(r.data as CheckoutQuote));
  };

  useEffect(() => {
    if (step >= 1 && governorateCode) fetchQuote();
  }, [step, governorateCode, cart?.subtotal]);

  const onGovernorateChange = (code: string) => {
    setGovernorateCode(code);
    const gov = JORDAN_GOVERNORATES.find((g) => g.code === code);
    if (gov) setAddress((a) => ({ ...a, governorate: gov.nameAr }));
  };

  const validateAddress = () => {
    const parsed = shippingAddressSchema.safeParse(address);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const key = i.path[0]?.toString() ?? 'form';
        errs[key] = i.message;
      });
      setFieldErrors(errs);
      showError(formatZodErrors(parsed.error));
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const goToShipping = () => {
    if (!validateAddress()) return;
    setStep(1);
    fetchQuote();
  };

  const placeOrder = async () => {
    if (!validateAddress()) {
      setStep(0);
      return;
    }
    if (paymentMethod === 'stripe' && !stripeEnabled) {
      showError('الدفع بالبطاقة غير متاح. اختر الدفع عند الاستلام.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.placeOrder({
        governorateCode,
        shippingAddress: address,
        paymentMethod,
        couponCode: couponCode || undefined,
        loyaltyPointsToUse: loyaltyPoints || undefined,
        notes: notes || undefined,
        saveAddress: true,
      });
      const data = result.data as { order: OrderDetail; clientSecret?: string };
      if (paymentMethod === 'stripe' && data.clientSecret) {
        setOrderResult(data);
        setStep(3);
        showInfo('أكمل الدفع بالبطاقة في الخطوة التالية');
      } else {
        showSuccess('تم إنشاء الطلب بنجاح');
        window.location.href = `/order-success/${data.order.id}`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل إنشاء الطلب';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!cart?.items.length) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-lg text-brand-muted">السلة فارغة</p>
          <Link to="/store" className="btn-primary mt-6 inline-flex">العودة للمتجر</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container className="space-y-8">
        <PageHero
          compact
          title="إتمام الطلب"
          subtitle="أكمل العنوان والشحن والدفع"
          breadcrumbs={[{ label: 'الرئيسية', to: '/' }, { label: 'السلة', to: '/cart' }]}
        />

        <div className="flex gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-2">
              <motion.div
                animate={{ scale: i === step ? 1.05 : 1 }}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  i <= step
                    ? 'bg-primary-600 text-white shadow-glow'
                    : 'bg-brand-sand text-brand-muted'
                }`}
              >
                {i + 1}
              </motion.div>
              <span className={`text-xs font-medium ${i <= step ? 'text-primary-700' : 'text-brand-muted'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 md:p-8"
          >
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">عنوان التوصيل</h2>
                <div>
                  <label className="label-field">المحافظة</label>
                  <select
                    value={governorateCode}
                    onChange={(e) => onGovernorateChange(e.target.value)}
                    className="input-field"
                  >
                    {JORDAN_GOVERNORATES.map((g) => (
                      <option key={g.code} value={g.code}>{g.nameAr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-field">المدينة *</label>
                  <input
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className={`input-field ${fieldErrors.city ? 'border-red-500' : ''}`}
                    placeholder="مثال: عبدون"
                  />
                  {fieldErrors.city && <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>}
                </div>
                <div>
                  <label className="label-field">الشارع *</label>
                  <input
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className={`input-field ${fieldErrors.street ? 'border-red-500' : ''}`}
                    placeholder="اسم الشارع"
                  />
                  {fieldErrors.street && <p className="mt-1 text-xs text-red-600">{fieldErrors.street}</p>}
                </div>
                <div>
                  <label className="label-field">المبنى / الشقة</label>
                  <input
                    value={address.building}
                    onChange={(e) => setAddress({ ...address, building: e.target.value })}
                    className="input-field"
                    placeholder="اختياري"
                  />
                </div>
                <div>
                  <label className="label-field">رقم الهاتف *</label>
                  <input
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className={`input-field ${fieldErrors.phone ? 'border-red-500' : ''}`}
                    placeholder="07XXXXXXXX"
                    dir="ltr"
                  />
                  {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
                </div>
                <button type="button" onClick={goToShipping} className="btn-primary w-full py-3">
                  التالي
                </button>
              </div>
            )}

            {step === 1 && quote && (
              <div>
                <h2 className="mb-4 text-lg font-bold">الشحن والخصومات</h2>
                <div className="mb-4 flex gap-2">
                  <input
                    placeholder="كود الخصم"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="input-field flex-1 uppercase"
                  />
                  <button type="button" onClick={fetchQuote} className="btn-secondary shrink-0">
                    تطبيق
                  </button>
                </div>
                <div className="space-y-2 rounded-xl bg-brand-cream p-4 text-sm">
                  <p>منطقة الشحن: <strong>{quote.shippingZone.nameAr}</strong></p>
                  {quote.discountAmount > 0 && (
                    <p className="text-green-600">خصم كوبون: -{quote.discountAmount.toFixed(2)} د.أ</p>
                  )}
                  {quote.loyaltyBalance !== undefined && quote.loyaltyBalance > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <p>رصيد النقاط: {quote.loyaltyBalance}</p>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="number"
                          min={0}
                          max={quote.loyaltyBalance}
                          value={loyaltyPoints}
                          onChange={(e) => setLoyaltyPoints(Number(e.target.value))}
                          className="input-field w-28 py-2"
                        />
                        <button type="button" onClick={fetchQuote} className="btn-secondary text-xs">
                          تطبيق النقاط
                        </button>
                      </div>
                    </div>
                  )}
                  {(quote.loyaltyDiscount ?? 0) > 0 && (
                    <p className="text-green-600">خصم نقاط: -{quote.loyaltyDiscount!.toFixed(2)} د.أ</p>
                  )}
                  <p>
                    التوصيل:{' '}
                    {quote.freeShippingApplied ? (
                      <span className="font-bold text-green-600">مجاني</span>
                    ) : (
                      `${quote.shippingAmount.toFixed(2)} د.أ`
                    )}
                  </p>
                  <p className="text-lg font-bold text-primary-700">المجموع: {quote.total.toFixed(2)} د.أ</p>
                </div>
                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setStep(0)} className="btn-secondary flex-1">رجوع</button>
                  <button type="button" onClick={() => setStep(2)} className="btn-primary flex-1">التالي</button>
                </div>
              </div>
            )}

            {step === 1 && !quote && (
              <p className="text-brand-muted">جاري حساب الشحن...</p>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">طريقة الدفع</h2>
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition ${paymentMethod === 'cod' ? 'border-primary bg-primary-50' : 'border-brand-sand'}`}>
                  <input type="radio" name="pay" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <Icon icon="mdi:cash" className="text-3xl text-green-600" />
                  <div>
                    <span className="font-medium">الدفع عند الاستلام</span>
                    <p className="text-xs text-brand-muted">ادفع نقداً عند استلام الطلب</p>
                  </div>
                </label>
                {stripeEnabled ? (
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition ${paymentMethod === 'stripe' ? 'border-primary bg-primary-50' : 'border-brand-sand'}`}>
                    <input type="radio" name="pay" checked={paymentMethod === 'stripe'} onChange={() => setPaymentMethod('stripe')} />
                    <div className="flex gap-1">
                      <Icon icon="mdi:credit-card-outline" className="text-3xl text-primary" />
                      <Icon icon="logos:visa" className="text-2xl" />
                      <Icon icon="logos:mastercard" className="text-2xl" />
                    </div>
                    <div>
                      <span className="font-medium">بطاقة Visa / Mastercard</span>
                      <p className="text-xs text-brand-muted">دفع آمن عبر Stripe</p>
                    </div>
                  </label>
                ) : (
                  <p className="rounded-lg bg-brand-cream p-3 text-xs text-brand-muted">
                    الدفع بالبطاقة غير مفعّل. أضف STRIPE_SECRET_KEY و STRIPE_PUBLISHABLE_KEY في apps/api/.env و
                    VITE_STRIPE_PUBLISHABLE_KEY في apps/storefront/.env
                  </p>
                )}
                <div>
                  <label className="label-field">ملاحظات (اختياري)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows={2} />
                </div>
                <p className="text-xs leading-relaxed text-brand-muted">
                  بإتمام الطلب فإنك توافق على{' '}
                  <Link to="/pages/terms-and-conditions" className="text-primary underline" target="_blank">
                    الشروط والأحكام
                  </Link>
                  ،{' '}
                  <Link to="/pages/privacy-policy" className="text-primary underline" target="_blank">
                    سياسة الخصوصية
                  </Link>
                  ،{' '}
                  <Link to="/pages/shipping-policy" className="text-primary underline" target="_blank">
                    سياسة الشحن
                  </Link>
                  ، و
                  <Link to="/pages/cancellation-policy" className="text-primary underline" target="_blank">
                    سياسة الإلغاء
                  </Link>
                  .
                </p>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">رجوع</button>
                  <button type="button" disabled={loading} onClick={placeOrder} className="btn-primary flex-1 disabled:opacity-50">
                    {loading ? 'جاري التأكيد...' : 'تأكيد الطلب'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && orderResult?.clientSecret && (
              <StripePaymentStep
                clientSecret={orderResult.clientSecret}
                orderId={orderResult.order.id}
                publishableKey={stripePublishableKey}
              />
            )}
          </motion.div>

          <aside className="glass-card h-fit p-5 lg:sticky lg:top-24">
            <h3 className="mb-4 font-bold">ملخص الطلب</h3>
            <ul className="max-h-64 space-y-3 overflow-y-auto">
              {cart.items.map((item) => (
                <li key={`${item.type}-${item.productId ?? item.packageId}`} className="flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                    <ProductImage src={item.imageUrl} alt={item.nameAr} aspectClass="h-14 w-14" showSkeleton={false} />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="line-clamp-2 font-medium">{item.nameAr}</p>
                    <p className="text-brand-muted">× {item.quantity}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold">{item.lineTotal.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t pt-4 flex justify-between font-bold">
              <span>المجموع الفرعي</span>
              <span>{cart.subtotal.toFixed(2)} د.أ</span>
            </div>
          </aside>
        </div>
      </Container>
    </Layout>
  );
}
