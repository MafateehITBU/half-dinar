import { FormEvent, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { contactSubmitSchema } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { Container } from '../components/ui/Container';
import { PageHero } from '../components/ui/PageHero';
import { RichText } from '../components/RichText';
import { api } from '../lib/api';
import { formatZodErrors } from '../lib/errors';
import { showError, showSuccess } from '../lib/toast';

interface Faq {
  id: string;
  questionAr: string;
  answerAr: string;
}

const SUBJECT_OPTIONS = [
  { value: '', label: 'اختر الموضوع (اختياري)' },
  { value: 'استفسار عام', label: 'استفسار عام' },
  { value: 'طلب وتوصيل', label: 'طلب وتوصيل' },
  { value: 'استرداد', label: 'استرداد' },
  { value: 'منتج', label: 'سؤال عن منتج' },
  { value: 'أخرى', label: 'أخرى' },
];

export function ContactPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [contact, setContact] = useState<Record<string, string>>({});
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.getContact().then((res) => {
      const data = res.data as { faqs: Faq[]; contact: Record<string, string> };
      setFaqs(data.faqs);
      setContact(data.contact);
    });
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = contactSubmitSchema.safeParse({
      name,
      email,
      phone: phone || undefined,
      subject: subject || undefined,
      message,
    });
    if (!parsed.success) {
      showError(formatZodErrors(parsed.error));
      return;
    }
    setSubmitting(true);
    try {
      await api.submitContact(parsed.data);
      showSuccess('تم إرسال رسالتك — سنتواصل معك قريباً');
      setSent(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'فشل إرسال الرسالة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Container narrow className="space-y-10">
        <PageHero
          title="اتصل بنا"
          subtitle="أرسل رسالتك أو تواصل مباشرة — نرد في أقرب وقت"
          breadcrumbs={[{ label: 'الرئيسية', to: '/' }]}
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-card p-6 md:p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                <Icon icon="mdi:email-edit-outline" className="text-2xl" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-brand-ink">أرسل رسالة</h2>
                <p className="text-sm text-brand-muted">جميع الحقول المطلوبة مميزة بـ *</p>
              </div>
            </div>

            {sent ? (
              <div className="rounded-2xl border border-primary/20 bg-primary-50 p-6 text-center">
                <Icon icon="mdi:check-circle" className="mx-auto text-5xl text-primary-600" />
                <p className="mt-3 font-bold text-brand-ink">شكراً لتواصلك!</p>
                <p className="mt-1 text-sm text-brand-muted">استلمنا رسالتك وسنرد على بريدك أو هاتفك.</p>
                <button type="button" className="btn-secondary mt-4" onClick={() => setSent(false)}>
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label-field">الاسم *</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                      placeholder="اسمك الكامل"
                    />
                  </div>
                  <div>
                    <label className="label-field">البريد الإلكتروني *</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      dir="ltr"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label-field">الهاتف</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field"
                      dir="ltr"
                      placeholder="+962..."
                    />
                  </div>
                  <div>
                    <label className="label-field">الموضوع</label>
                    <select value={subject} onChange={(e) => setSubject(e.target.value)} className="select-field">
                      {SUBJECT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label-field">الرسالة *</label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input-field min-h-[120px] resize-y"
                    placeholder="اكتب استفسارك أو تفاصيل طلبك..."
                  />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
                  <Icon icon="mdi:send" />
                  {submitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                </button>
              </form>
            )}
          </motion.section>

          <div className="space-y-4">
            {contact.footer_phone && (
              <motion.a
                href={`tel:${contact.footer_phone}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="surface-card-interactive flex items-center gap-3 p-5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                  <Icon icon="mdi:phone-outline" className="text-2xl" />
                </span>
                <div>
                  <p className="text-xs text-brand-muted">هاتف</p>
                  <p className="font-bold text-brand-ink" dir="ltr">
                    {String(contact.footer_phone)}
                  </p>
                </div>
              </motion.a>
            )}
            {contact.footer_email && (
              <motion.a
                href={`mailto:${contact.footer_email}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="surface-card-interactive flex items-center gap-3 p-5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                  <Icon icon="mdi:email-outline" className="text-2xl" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-brand-muted">بريد</p>
                  <p className="truncate font-bold text-brand-ink" dir="ltr">
                    {String(contact.footer_email)}
                  </p>
                </div>
              </motion.a>
            )}
            {contact.footer_address_ar && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="surface-card flex items-center gap-3 p-5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                  <Icon icon="mdi:map-marker-outline" className="text-2xl" />
                </span>
                <div>
                  <p className="text-xs text-brand-muted">العنوان</p>
                  <p className="font-bold text-brand-ink">{String(contact.footer_address_ar)}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <section>
          <h2 className="mb-6 font-display text-xl font-bold text-brand-ink">أسئلة شائعة</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => {
              const isOpen = openFaq === f.id;
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="surface-card overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : f.id)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-right font-semibold text-brand-ink transition hover:bg-brand-cream"
                  >
                    {f.questionAr}
                    <Icon
                      icon="mdi:chevron-down"
                      className={`shrink-0 text-xl text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-brand-sand"
                      >
                        <div className="p-5 text-sm leading-relaxed text-brand-muted">
                          <RichText html={f.answerAr} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>
      </Container>
    </Layout>
  );
}
