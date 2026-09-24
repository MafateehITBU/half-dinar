import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { forgotPasswordSchema } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { BrandLogo } from '../components/brand/BrandLogo';
import { Container } from '../components/ui/Container';
import { api } from '../lib/api';
import { formatZodErrors } from '../lib/errors';
import { showError, showSuccess } from '../lib/toast';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      showError(formatZodErrors(parsed.error));
      return;
    }
    setLoading(true);
    try {
      await api.forgotPassword(parsed.data.email);
      setSent(true);
      showSuccess('إذا كان البريد مسجّلاً، ستصلك رسالة خلال لحظات');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'تعذّر إرسال الرسالة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Container narrow className="py-10 md:py-14">
        <div className="surface-elevated overflow-hidden md:grid md:grid-cols-5">
          <div className="panel-dark relative hidden flex-col justify-between p-8 md:col-span-2 md:flex">
            <BrandLogo linked={false} onDark size="md" />
            <div className="mt-8 rounded-2xl border border-white/10 bg-brand-green-dark/85 p-5">
              <Icon icon="mdi:email-lock" className="text-4xl text-brand-gold" />
              <h2 className="hero-text-shadow mt-3 font-display text-xl font-extrabold text-white">
                استعادة الحساب
              </h2>
              <p className="hero-subtitle mt-2 text-sm leading-relaxed">
                سنرسل رابطاً لإعادة تعيين كلمة المرور إلى بريدك.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 md:col-span-3 md:p-10">
            <div className="mb-6 md:hidden">
              <BrandLogo linked={false} />
            </div>

            {sent ? (
              <div className="text-center sm:text-start">
                <Icon icon="mdi:email-check-outline" className="mx-auto text-5xl text-brand-green sm:mx-0" />
                <h1 className="mt-4 font-display text-2xl font-extrabold text-brand-ink">
                  تحقق من بريدك
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                  إن وُجد حساب مرتبط بـ{' '}
                  <span className="font-medium text-brand-ink" dir="ltr">
                    {email.trim()}
                  </span>
                  ، ستصلك رسالة فيها رابط إعادة التعيين. راجع الوارد ومجلد الرسائل غير المرغوب فيها.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to="/login" className="btn-primary flex-1 justify-center py-3">
                    <Icon icon="mdi:login" />
                    تسجيل الدخول
                  </Link>
                  <button
                    type="button"
                    className="btn-ghost flex-1 justify-center py-3"
                    onClick={() => setSent(false)}
                  >
                    إعادة الإرسال
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-2xl font-extrabold text-brand-ink">
                  نسيت كلمة المرور؟
                </h1>
                <p className="mt-1 text-sm text-brand-muted">
                  أدخل بريدك المسجّل وسنرسل لك رابط الاستعادة.
                </p>
                <form onSubmit={onSubmit} className="mt-8 space-y-4">
                  <div>
                    <label className="label-field" htmlFor="forgot-email">
                      البريد الإلكتروني
                    </label>
                    <input
                      id="forgot-email"
                      required
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field text-base"
                      dir="ltr"
                      placeholder="you@example.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3.5 text-base disabled:opacity-60"
                  >
                    <Icon icon="mdi:email-fast-outline" />
                    {loading ? 'جاري الإرسال…' : 'إرسال رابط الاستعادة'}
                  </button>
                </form>
                <Link
                  to="/login"
                  className="mt-6 flex min-h-11 items-center justify-center gap-1 text-sm font-medium text-primary-700"
                >
                  <Icon icon="mdi:arrow-right" />
                  العودة لتسجيل الدخول
                </Link>
              </>
            )}
          </div>
        </div>
      </Container>
    </Layout>
  );
}
