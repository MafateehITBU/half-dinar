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
import { useCart } from '../context/CartContext';
import { api, isLoggedIn, type PublicConfig, type SavedAddress } from '../lib/api';
import { formatZodErrors } from '../lib/errors';
import { showError, showSuccess } from '../lib/toast';

const STEPS = ['العنوان', 'الشحن', 'الدفع'];

export function CheckoutPage() {
  const { cart } = useCart();
  const [step, setStep] = useState(0);
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [governorateCode, setGovernorateCode] = useState('AM');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'meps'>('cod');
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
  const [mepsEnabled, setMepsEnabled] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [saveAddress, setSaveAddress] = useState(true);
  const loggedIn = isLoggedIn();

  const applySavedAddress = (a: SavedAddress) => {
    const gov = JORDAN_GOVERNORATES.find(
      (g) => g.nameAr === a.governorate || g.nameEn.toLowerCase() === a.governorate.toLowerCase(),
    );
    if (gov) setGovernorateCode(gov.code);
    setAddress({
      label: a.label || 'المنزل',
      governorate: a.governorate,
      city: a.city,
      street: a.street,
      building: a.building || '',
      phone: a.phone,
    });
  };

  useEffect(() => {
    if (!loggedIn) return;
    api.getPublicConfig().then((r) => {
      const cfg = r.data as PublicConfig;
      if (cfg.meps?.enabled) setMepsEnabled(true);
    });
    api
      .getAddresses()
      .then((r) => {
        setSavedAddresses(r.data);
        const def = r.data.find((a) => a.isDefault) ?? r.data[0];
        if (def) {
          setSelectedAddressId(def.id);
          applySavedAddress(def);
        }
      })
      .catch(() => {});
  }, [loggedIn]);

  const fetchQuote = () => {
    setQuoteLoading(true);
    setQuoteError('');
    api
      .getCheckoutQuote(governorateCode, couponCode || undefined, loyaltyPoints || undefined)
      .then((r) => {
        setQuote(r.data as CheckoutQuote);
        setQuoteError('');
      })
      .catch((err) => {
        setQuote(null);
        setQuoteError(err instanceof Error ? err.message : 'تعذر حساب الشحن');
      })
      .finally(() => setQuoteLoading(false));
  };

  useEffect(() => {
    if (!loggedIn) return;
    if (step >= 1 && governorateCode) fetchQuote();
  }, [step, governorateCode, cart?.subtotal, loggedIn]);

  if (!loggedIn) return <Navigate to="/login?redirect=checkout" replace />;

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
    if (paymentMethod === 'meps' && !mepsEnabled) {
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
        saveAddress: selectedAddressId === 'new' ? saveAddress : false,
      });
      const data = result.data as { order: OrderDetail; redirectUrl?: string };
      if (paymentMethod === 'meps' && data.redirectUrl) {
        sessionStorage.setItem('mepsPendingOrderId', data.order.id);
        window.location.href = data.redirectUrl;
        return;
      }
      showSuccess('تم إنشاء الطلب بنجاح');
      window.location.href = `/order-success/${data.order.id}`;
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
          subtitle="أدخل عنوان التوصيل واختر طريقة الدفع"
        />

        <div className="flex flex-wrap justify-center gap-2">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                i === step ? 'bg-primary text-white' : i < step ? 'bg-primary/20 text-primary' : 'bg-brand-sand text-brand-muted'
              }`}
            >
              {i + 1}. {label}
            </span>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card space-y-4 p-6"
          >
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">عنوان التوصيل</h2>

                {savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-brand-ink">عناوين محفوظة</p>
                    <div className="grid gap-2">
                      {savedAddresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setSelectedAddressId(a.id);
                            applySavedAddress(a);
                            setFieldErrors({});
                          }}
                          className={`rounded-xl border p-3 text-start transition ${
                            selectedAddressId === a.id
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-brand-sand bg-white'
                          }`}
                        >
                          <span className="font-semibold text-brand-ink">
                            {a.label || 'عنوان'}
                            {a.isDefault ? ' · افتراضي' : ''}
                          </span>
                          <span className="mt-1 block text-xs text-brand-muted">
                            {a.governorate} · {a.city} · {a.street}
                          </span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSelectedAddressId('new')}
                        className={`rounded-xl border border-dashed p-3 text-start text-sm font-medium ${
                          selectedAddressId === 'new'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-brand-sand text-brand-muted'
                        }`}
                      >
                        + عنوان جديد
                      </button>
                    </div>
                  </div>
                )}

                {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
                  <>
                <div>
                  <label className="label-field">المحافظة</label>
                  <select
                    className="input-field text-base"
                    value={governorateCode}
                    onChange={(e) => onGovernorateChange(e.target.value)}
                  >
                    {JORDAN_GOVERNORATES.map((g) => (
                      <option key={g.code} value={g.code}>{g.nameAr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-field">المدينة</label>
                  <input className={`input-field text-base ${fieldErrors.city ? 'border-red-400' : ''}`} value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} />
                  {fieldErrors.city && <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>}
                </div>
                <div>
                  <label className="label-field">الشارع</label>
                  <input className={`input-field text-base ${fieldErrors.street ? 'border-red-400' : ''}`} value={address.street} onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))} />
                  {fieldErrors.street && <p className="mt-1 text-xs text-red-600">{fieldErrors.street}</p>}
                </div>
                <div>
                  <label className="label-field">البناية / الطابق (اختياري)</label>
                  <input className="input-field text-base" value={address.building} onChange={(e) => setAddress((a) => ({ ...a, building: e.target.value }))} />
                </div>
                <div>
                  <label className="label-field">رقم الهاتف</label>
                  <input className={`input-field text-base ${fieldErrors.phone ? 'border-red-400' : ''}`} inputMode="tel" dir="ltr" value={address.phone} onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))} />
                  {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
                </div>
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                  />
                  حفظ العنوان لحين الطلبات القادمة
                </label>
                  </>
                )}

                {selectedAddressId !== 'new' && savedAddresses.length > 0 && (
                  <button
                    type="button"
                    className="text-sm font-medium text-primary-700 underline"
                    onClick={() => setSelectedAddressId('new')}
                  >
                    تعديل كعنوان جديد
                  </button>
                )}

                <button type="button" onClick={goToShipping} className="btn-primary w-full py-3.5 text-base">متابعة للشحن</button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">الشحن والكوبون</h2>
                {quoteLoading ? (
                  <p className="text-brand-muted">جاري حساب الشحن...</p>
                ) : quoteError ? (
                  <div className="space-y-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    <p>{quoteError}</p>
                    <button type="button" className="btn-secondary text-xs" onClick={fetchQuote}>
                      إعادة المحاولة
                    </button>
                  </div>
                ) : quote ? (
                  <div className="space-y-2 rounded-xl bg-brand-cream/60 p-4 text-sm">
                    <div className="flex justify-between"><span>المجموع الفرعي</span><span>{quote.subtotal.toFixed(2)} د.أ</span></div>
                    <div className="flex justify-between">
                      <span>الشحن ({quote.shippingZone.nameAr})</span>
                      <span>
                        {quote.shippingAmount === 0 || quote.freeShippingApplied
                          ? 'مجاني'
                          : `${quote.shippingAmount.toFixed(2)} د.أ`}
                      </span>
                    </div>
                    {quote.discountAmount > 0 && (
                      <div className="flex justify-between text-green-700"><span>خصم</span><span>-{quote.discountAmount.toFixed(2)} د.أ</span></div>
                    )}
                    {(quote.loyaltyDiscount ?? 0) > 0 && (
                      <div className="flex justify-between text-green-700"><span>ولاء</span><span>-{(quote.loyaltyDiscount ?? 0).toFixed(2)} د.أ</span></div>
                    )}
                    <div className="flex justify-between border-t pt-2 font-bold"><span>الإجمالي</span><span>{quote.total.toFixed(2)} د.أ</span></div>
                  </div>
                ) : (
                  <p className="text-brand-muted">اختر المحافظة ثم انتظر حساب الشحن</p>
                )}
                <div>
                  <label className="label-field">كود الخصم (اختياري)</label>
                  <div className="flex gap-2">
                    <input className="input-field" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                    <button type="button" className="btn-secondary shrink-0" onClick={fetchQuote}>تطبيق</button>
                  </div>
                </div>
                {(quote?.loyaltyBalance ?? 0) > 0 && (
                  <div>
                    <label className="label-field">نقاط الولاء (المتاح: {quote?.loyaltyBalance})</label>
                    <input
                      type="number"
                      min={0}
                      max={quote?.loyaltyBalance}
                      className="input-field"
                      value={loyaltyPoints}
                      onChange={(e) => setLoyaltyPoints(Number(e.target.value) || 0)}
                      onBlur={fetchQuote}
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(0)} className="btn-secondary flex-1">رجوع</button>
                  <button type="button" onClick={() => setStep(2)} className="btn-primary flex-1" disabled={!quote}>متابعة للدفع</button>
                </div>
              </div>
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
                {mepsEnabled ? (
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition ${paymentMethod === 'meps' ? 'border-primary bg-primary-50' : 'border-brand-sand'}`}>
                    <input type="radio" name="pay" checked={paymentMethod === 'meps'} onChange={() => setPaymentMethod('meps')} />
                    <div className="flex flex-wrap gap-1">
                      <Icon icon="logos:visa" className="text-2xl" />
                      <Icon icon="logos:visaelectron" className="text-2xl" />
                      <Icon icon="logos:mastercard" className="text-2xl" />
                      <Icon icon="logos:maestro" className="text-2xl" />
                    </div>
                    <div>
                      <span className="font-medium">بطاقة Visa / Mastercard</span>
                      <p className="text-xs text-brand-muted">دفع آمن عبر MEPS</p>
                    </div>
                  </label>
                ) : (
                  <p className="rounded-lg bg-brand-cream p-3 text-xs text-brand-muted">
                    الدفع بالبطاقة غير مفعّل. أضف PAYTABS_PROFILE_ID و PAYTABS_SERVER_KEY في apps/api/.env ثم أعد تشغيل الـ API.
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
                    {loading ? 'جاري التأكيد...' : paymentMethod === 'meps' ? 'الدفع بالبطاقة' : 'تأكيد الطلب'}
                  </button>
                </div>
              </div>
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
