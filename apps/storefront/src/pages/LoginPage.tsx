import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { loginSchema, registerSchema } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { BrandLogo } from '../components/brand/BrandLogo';
import { Container } from '../components/ui/Container';
import { api, saveAuthTokens } from '../lib/api';
import { useCart } from '../context/CartContext';
import { formatZodErrors } from '../lib/errors';
import { showError, showSuccess } from '../lib/toast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') ?? '');
  const { refresh } = useCart();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          showError(formatZodErrors(parsed.error));
          return;
        }
        const res = await api.login(parsed.data.email, parsed.data.password);
        saveAuthTokens(res.tokens.accessToken, res.tokens.refreshToken);
        try {
          await api.mergeCart();
          await refresh();
        } catch {
          /* empty */
        }
        showSuccess('مرحباً بعودتك!');
      } else {
        const parsed = registerSchema.safeParse({
          email,
          password,
          firstName,
          lastName,
          locale: 'ar',
          ageConfirmed: true,
          referralCode: referralCode.trim() || undefined,
        });
        if (!parsed.success) {
          showError(formatZodErrors(parsed.error));
          return;
        }
        const res = await api.register(parsed.data);
        saveAuthTokens(
          (res as { tokens: { accessToken: string; refreshToken: string } }).tokens.accessToken,
          (res as { tokens: { accessToken: string; refreshToken: string } }).tokens.refreshToken,
        );
        showSuccess('تم إنشاء الحساب! تحقق من بريدك لتفعيل الحساب.');
      }
      const redirect = searchParams.get('redirect');
      navigate(redirect === 'checkout' ? '/checkout' : '/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل تسجيل الدخول';
      setError(msg);
      showError(msg);
    }
  };

  return (
    <Layout>
      <Container narrow className="py-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-elevated overflow-hidden md:grid md:grid-cols-2"
        >
          <div className="panel-dark relative hidden flex-col justify-between p-10 md:flex">
            <div className="relative z-10">
              <BrandLogo linked={false} onDark size="lg" />
            </div>
            <div className="relative z-10 mt-8 rounded-2xl border border-white/10 bg-brand-green-dark/85 p-6 backdrop-blur-sm">
              <h2 className="hero-text-shadow font-display text-2xl font-extrabold">مرحباً بك</h2>
              <p className="hero-subtitle mt-3 text-sm font-semibold leading-relaxed">
                سجّل دخولك لمتابعة الطلبات والمفضلة والدفع السريع.
              </p>
            </div>
            <ul className="relative z-10 space-y-3 rounded-2xl border border-white/10 bg-brand-green-dark/75 p-5 text-sm font-medium text-brand-gold-light">
              <li className="flex items-center gap-2">
                <Icon icon="mdi:check-circle" className="text-brand-gold" />
                دفع آمن
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="mdi:check-circle" className="text-brand-gold" />
                تتبع الطلبات
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="mdi:check-circle" className="text-brand-gold" />
                قائمة المفضلة
              </li>
            </ul>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6 md:hidden">
              <BrandLogo linked={false} />
            </div>
            <div className="mb-6 tab-bar">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`tab-item ${mode === 'login' ? 'tab-item-active' : ''}`}
              >
                دخول
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`tab-item ${mode === 'register' ? 'tab-item-active' : ''}`}
              >
                حساب جديد
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label-field">الاسم الأول *</label>
                      <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="label-field">اسم العائلة *</label>
                      <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="label-field">كود الإحالة (اختياري)</label>
                    <input value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="input-field uppercase" />
                  </div>
                </>
              )}
              <div>
                <label className="label-field">البريد الإلكتروني *</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="label-field">كلمة المرور *</label>
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
                {mode === 'register' && <p className="mt-1 text-xs text-brand-muted">8+ أحرف، حرف كبير وصغير ورقم</p>}
              </div>
              {mode === 'register' && (
                <label className="flex items-center gap-2 text-sm text-brand-ink">
                  <input type="checkbox" required defaultChecked className="rounded border-brand-sand text-primary-600" />
                  أؤكد أن عمري 13 سنة أو أكثر
                </label>
              )}
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">{error}</p>}
              <button type="submit" className="btn-primary w-full py-3.5">
                <Icon icon={mode === 'login' ? 'mdi:login' : 'mdi:account-plus'} />
                {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
              </button>
            </form>

            <Link to="/" className="btn-ghost mt-6 w-full justify-center">
              العودة للرئيسية
            </Link>
          </div>
        </motion.div>
      </Container>
    </Layout>
  );
}
