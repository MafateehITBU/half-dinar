import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { api } from '../lib/api';
import { showError, showSuccess } from '../lib/toast';

function StripeCheckoutForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setError('');

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (submitError) {
      const msg = submitError.message ?? 'فشل الدفع';
      setError(msg);
      showError(msg);
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      await api.confirmStripePayment(orderId, paymentIntent.id);
      showSuccess('تم الدفع بنجاح');
      window.location.href = `/order-success/${orderId}`;
      return;
    }

    setPaying(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-brand-muted">
        <Icon icon="mdi:credit-card-outline" className="text-xl text-primary" />
        <span>Visa · Mastercard · مدعوم عبر Stripe</span>
      </div>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={!stripe || paying}
        onClick={handlePay}
        className="btn-primary mt-6 w-full py-3 disabled:opacity-50"
      >
        {paying ? 'جاري الدفع...' : 'ادفع الآن'}
      </button>
    </div>
  );
}

export function StripePaymentStep({
  clientSecret,
  orderId,
  publishableKey,
}: {
  clientSecret: string;
  orderId: string;
  publishableKey: string;
}) {
  const stripePromise = useMemo(() => {
    const key = publishableKey?.trim();
    if (!key) return null;
    return loadStripe(key);
  }, [publishableKey]);

  if (!publishableKey?.trim()) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-bold">الدفع بالبطاقة غير مفعّل</p>
        <p className="mt-2">
          أضف <code className="rounded bg-amber-100 px-1">STRIPE_PUBLISHABLE_KEY</code> و{' '}
          <code className="rounded bg-amber-100 px-1">VITE_STRIPE_PUBLISHABLE_KEY</code> (نفس قيمة pk_test_...)
        </p>
        <p className="mt-2">رقم الطلب: {orderId}</p>
      </div>
    );
  }

  if (!stripePromise) {
    return <p className="text-brand-muted">جاري تحميل Stripe...</p>;
  }

  return (
    <div className="glass-card p-6">
      <p className="mb-4 font-bold">أكمل الدفع بالبطاقة</p>
      <Elements stripe={stripePromise} options={{ clientSecret, locale: 'ar' }}>
        <StripeCheckoutForm orderId={orderId} />
      </Elements>
    </div>
  );
}
