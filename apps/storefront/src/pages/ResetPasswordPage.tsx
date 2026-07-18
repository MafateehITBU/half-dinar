import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { resetPasswordSchema } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { Container } from '../components/ui/Container';
import { api } from '../lib/api';
import { formatZodErrors } from '../lib/errors';
import { showError, showSuccess } from '../lib/toast';

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="surface-elevated overflow-hidden md:grid md:grid-cols-5">
      <div className="panel-dark hidden flex-col justify-center p-10 md:col-span-2 md:flex">
        <Icon icon="mdi:lock-reset" className="text-5xl text-brand-gold" />
        <h2 className="hero-text-shadow mt-4 font-display text-xl font-extrabold text-white">أمان حسابك</h2>
        <p className="hero-subtitle mt-2 text-sm">اختر كلمة مرور قوية لحماية طلباتك وبياناتك</p>
      </div>
      <div className="p-8 md:col-span-3 md:p-10">{children}</div>
    </div>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      showError('كلمتا المرور غير متطابقتين');
      return;
    }
    const parsed = resetPasswordSchema.safeParse({ token: token.trim(), password });
    if (!parsed.success) {
      showError(formatZodErrors(parsed.error));
      return;
    }
    try {
      await api.resetPassword(parsed.data.token, parsed.data.password);
      setDone(true);
      showSuccess('تم تغيير كلمة المرور');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'فشل إعادة التعيين');
    }
  };

  if (!token.trim()) {
    return (
      <Layout>
        <Container narrow className="py-12">
          <AuthCard>
            <Icon icon="mdi:link-off" className="text-5xl text-amber-600" />
            <h1 className="mt-4 font-display text-xl font-extrabold">رابط غير صالح</h1>
            <Link to="/login" className="btn-primary mt-6 inline-flex">تسجيل الدخول</Link>
          </AuthCard>
        </Container>
      </Layout>
    );
  }

  if (done) {
    return (
      <Layout>
        <Container narrow className="py-12">
          <AuthCard>
            <Icon icon="mdi:check-circle" className="text-5xl text-brand-green" />
            <h1 className="mt-4 font-display text-xl font-extrabold text-brand-ink">تم بنجاح</h1>
            <p className="mt-2 text-sm text-brand-muted">يمكنك تسجيل الدخول بكلمة المرور الجديدة</p>
            <Link to="/login" className="btn-primary mt-6 inline-flex">
              <Icon icon="mdi:login" />
              تسجيل الدخول
            </Link>
          </AuthCard>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container narrow className="py-10 md:py-14">
        <AuthCard>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink">كلمة مرور جديدة</h1>
          <p className="mt-1 text-sm text-brand-muted">أدخل كلمة مرور قوية جديدة</p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label-field">كلمة المرور الجديدة</label>
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
              <p className="mt-1 text-xs text-brand-muted">8 أحرف على الأقل، حرف كبير وصغير ورقم</p>
            </div>
            <div>
              <label className="label-field">تأكيد كلمة المرور</label>
              <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field" />
            </div>
            <button type="submit" className="btn-primary w-full py-3">
              <Icon icon="mdi:content-save-outline" />
              حفظ
            </button>
          </form>
        </AuthCard>
      </Container>
    </Layout>
  );
}
