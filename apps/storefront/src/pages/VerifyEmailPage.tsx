import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Layout } from '../components/Layout';
import { Container } from '../components/ui/Container';
import { api } from '../lib/api';
import { showError, showSuccess } from '../lib/toast';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'missing'>('loading');
  const [message, setMessage] = useState('');
  const verifyStarted = useRef(false);

  useEffect(() => {
    if (!token.trim()) {
      setStatus('missing');
      return;
    }
    if (verifyStarted.current) return;
    verifyStarted.current = true;

    api
      .verifyEmail(token.trim())
      .then(() => {
        setStatus('success');
        showSuccess('تم تفعيل بريدك الإلكتروني بنجاح');
      })
      .catch((err) => {
        setStatus('error');
        const msg = err instanceof Error ? err.message : 'فشل التفعيل';
        setMessage(msg);
        showError(msg);
      });
  }, [token]);

  const config = {
    loading: { icon: 'mdi:email-sync', color: 'text-brand-green', title: 'جاري التفعيل...', desc: 'انتظر لحظة بينما نتحقق من حسابك' },
    success: { icon: 'mdi:check-circle', color: 'text-brand-green', title: 'تم التفعيل!', desc: 'بريدك الإلكتروني مفعّل. يمكنك التسوق الآن.' },
    error: { icon: 'mdi:alert-circle', color: 'text-red-600', title: 'فشل التفعيل', desc: message },
    missing: { icon: 'mdi:link-off', color: 'text-amber-600', title: 'رابط غير صالح', desc: 'لم يُعثر على رمز التفعيل. افتح الرابط من البريد مباشرة.' },
  }[status];

  return (
    <Layout>
      <Container narrow className="py-12">
        <div className="surface-elevated flex flex-col items-center px-6 py-14 text-center md:px-12">
          <Icon icon={config.icon} className={`text-6xl ${config.color} ${status === 'loading' ? 'animate-pulse' : ''}`} />
          <h1 className="mt-6 font-display text-2xl font-extrabold text-brand-ink">{config.title}</h1>
          <p className="mt-2 max-w-sm text-sm text-brand-muted">{config.desc}</p>
          {status === 'success' && (
            <Link to="/store" className="btn-primary mt-8">
              <Icon icon="mdi:store-outline" />
              تصفح المتجر
            </Link>
          )}
          {status === 'error' && (
            <Link to="/login" className="btn-primary mt-8">
              <Icon icon="mdi:login" />
              تسجيل الدخول
            </Link>
          )}
          {status === 'missing' && (
            <Link to="/" className="btn-secondary mt-8">
              الرئيسية
            </Link>
          )}
        </div>
      </Container>
    </Layout>
  );
}
