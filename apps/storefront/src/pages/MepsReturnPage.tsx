import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Layout } from '../components/Layout';
import { Container } from '../components/ui/Container';
import { api, isLoggedIn } from '../lib/api';

type Status = 'loading' | 'success' | 'failed';

export function MepsReturnPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const loginRedirect = `/login?redirect=${encodeURIComponent(
    `/checkout/meps/return${typeof window !== 'undefined' ? window.location.search : ''}`,
  )}`;

  useEffect(() => {
    if (!isLoggedIn()) return;

    const fromStorage = sessionStorage.getItem('mepsPendingOrderId');
    const fromQuery = params.get('cartId') || params.get('cart_id') || params.get('orderId');
    const id = fromStorage || fromQuery;
    if (!id) {
      setStatus('failed');
      setMessage('تعذر تحديد الطلب بعد الدفع');
      return;
    }
    setOrderId(id);

    api
      .confirmMepsPayment(id)
      .then(() => {
        sessionStorage.removeItem('mepsPendingOrderId');
        setStatus('success');
        window.location.replace(`/order-success/${id}`);
      })
      .catch((err: unknown) => {
        setStatus('failed');
        setMessage(err instanceof Error ? err.message : 'لم يكتمل الدفع');
      });
  }, [params]);

  if (!isLoggedIn()) return <Navigate to={loginRedirect} replace />;

  return (
    <Layout>
      <Container className="mx-auto max-w-lg py-16 text-center">
        {status === 'loading' && (
          <>
            <Icon icon="mdi:loading" className="mx-auto animate-spin text-5xl text-primary" />
            <p className="mt-4 text-lg font-medium">جاري تأكيد الدفع...</p>
          </>
        )}
        {status === 'failed' && (
          <>
            <Icon icon="mdi:alert-circle-outline" className="mx-auto text-5xl text-amber-600" />
            <p className="mt-4 text-lg font-bold">لم يتم تأكيد الدفع</p>
            <p className="mt-2 text-sm text-brand-muted">{message}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {orderId && (
                <Link to={`/orders/${orderId}`} className="btn-secondary">عرض الطلب</Link>
              )}
              <Link to="/checkout" className="btn-primary">العودة للدفع</Link>
            </div>
          </>
        )}
      </Container>
    </Layout>
  );
}
