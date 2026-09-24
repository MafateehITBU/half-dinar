import { BRAND } from '@half-dinar/shared';

const primary = '#0d9488';
const dark = '#0f172a';

function layout(title: string, body: string, cta?: { label: string; href: string }) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Cairo,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,${primary},#0f766e);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;">${BRAND.nameAr}</h1>
            <p style="margin:8px 0 0;color:#ccfbf1;font-size:13px;">${BRAND.nameEn}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;color:${dark};font-size:15px;line-height:1.7;">
            ${body}
            ${
              cta
                ? `<p style="margin:28px 0 0;text-align:center;">
              <a href="${cta.href}" style="display:inline-block;background:${primary};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:bold;font-size:15px;">${cta.label}</a>
            </p>`
                : ''
            }
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#f8fafc;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">
            © ${new Date().getFullYear()} ${BRAND.nameAr} — الأردن
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function welcomeEmail(firstName: string, verifyLink: string | null) {
  const body = `
    <h2 style="margin:0 0 16px;color:${dark};">مرحباً ${firstName} 👋</h2>
    <p>شكراً لتسجيلك في <strong>${BRAND.nameAr}</strong>. نحن سعداء بانضمامك إلينا.</p>
    <p>فعّل بريدك الإلكتروني لتتمكن من استلام تأكيدات الطلبات والعروض الحصرية.</p>
    ${!verifyLink ? '<p style="color:#64748b;font-size:13px;">يمكنك تسجيل الدخول والتسوق مباشرة.</p>' : ''}`;
  return layout(
    `مرحباً بك في ${BRAND.nameAr}`,
    body,
    verifyLink ? { label: 'تفعيل الحساب', href: verifyLink } : undefined,
  );
}

export function passwordResetEmail(link: string) {
  const body = `
    <h2 style="margin:0 0 16px;color:${dark};">إعادة تعيين كلمة المرور</h2>
    <p>تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في ${BRAND.nameAr}.</p>
    <p>إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>
    <p style="color:#64748b;font-size:13px;">ينتهي الرابط خلال <strong>ساعة واحدة</strong>.</p>`;
  return layout('إعادة تعيين كلمة المرور', body, { label: 'إعادة تعيين كلمة المرور', href: link });
}

export function orderConfirmationEmail(
  firstName: string,
  orderNumber: string,
  total: number,
  orderLink: string,
) {
  const body = `
    <h2 style="margin:0 0 16px;color:${dark};">شكراً ${firstName}! 🎉</h2>
    <p>تم استلام طلبك بنجاح.</p>
    <table width="100%" style="margin:20px 0;background:#f0fdfa;border-radius:12px;padding:16px;">
      <tr><td style="font-size:14px;color:#64748b;">رقم الطلب</td></tr>
      <tr><td style="font-size:20px;font-weight:bold;color:${primary};">${orderNumber}</td></tr>
      <tr><td style="padding-top:12px;font-size:14px;color:#64748b;">الإجمالي</td></tr>
      <tr><td style="font-size:18px;font-weight:bold;">${Number(total).toFixed(2)} ${BRAND.currency}</td></tr>
    </table>
    <p>سنرسل لك بريداً عند كل تحديث على حالة الطلب.</p>`;
  return layout(`تأكيد الطلب ${orderNumber}`, body, { label: 'عرض الطلب', href: orderLink });
}

type StatusKey =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

const STATUS_META: Record<
  StatusKey,
  { label: string; headline: string; message: string; badgeBg: string; badgeColor: string }
> = {
  pending: {
    label: 'قيد الانتظار',
    headline: 'طلبك قيد الانتظار',
    message: 'استلمنا طلبك وهو بانتظار المراجعة.',
    badgeBg: '#fef3c7',
    badgeColor: '#b45309',
  },
  processing: {
    label: 'قيد المعالجة',
    headline: 'جارٍ تجهيز طلبك',
    message: 'فريقنا يعمل على تجهيز طلبك الآن.',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
  },
  paid: {
    label: 'مدفوع',
    headline: 'تم تأكيد الدفع',
    message: 'تم استلام الدفع بنجاح. سنبدأ بتجهيز طلبك فوراً.',
    badgeBg: '#d1fae5',
    badgeColor: '#047857',
  },
  shipped: {
    label: 'تم الشحن',
    headline: 'طلبك في الطريق إليك',
    message: 'تم شحن طلبك وهو في طريقه للتوصيل.',
    badgeBg: '#ede9fe',
    badgeColor: '#6d28d9',
  },
  delivered: {
    label: 'تم التسليم',
    headline: 'تم تسليم طلبك',
    message: 'نتمنى أن تكون راضياً عن مشترياتك. شكراً لتسوقك معنا!',
    badgeBg: '#d1fae5',
    badgeColor: '#047857',
  },
  completed: {
    label: 'مكتمل',
    headline: 'اكتمل طلبك',
    message: 'تم إكمال طلبك بنجاح. يسعدنا خدمتك مجدداً.',
    badgeBg: '#d1fae5',
    badgeColor: '#047857',
  },
  cancelled: {
    label: 'ملغي',
    headline: 'تم إلغاء الطلب',
    message: 'تم إلغاء طلبك. إذا كان لديك استفسار، تواصل معنا عبر الموقع.',
    badgeBg: '#fee2e2',
    badgeColor: '#b91c1c',
  },
  refunded: {
    label: 'مسترد',
    headline: 'تم استرداد المبلغ',
    message: 'تم استرداد مبلغ طلبك وفق سياسة المتجر.',
    badgeBg: '#ffedd5',
    badgeColor: '#c2410c',
  },
};

export function orderStatusUpdateEmail(input: {
  firstName: string;
  orderNumber: string;
  status: string;
  total: number;
  orderLink: string;
  note?: string | null;
  previousStatus?: string | null;
}) {
  const meta = STATUS_META[input.status as StatusKey] ?? {
    label: input.status,
    headline: 'تحديث على طلبك',
    message: 'تم تحديث حالة طلبك.',
    badgeBg: '#e2e8f0',
    badgeColor: dark,
  };
  const prevLabel =
    input.previousStatus && STATUS_META[input.previousStatus as StatusKey]
      ? STATUS_META[input.previousStatus as StatusKey].label
      : null;

  const body = `
    <h2 style="margin:0 0 12px;color:${dark};">${meta.headline}</h2>
    <p style="margin:0 0 20px;">مرحباً <strong>${input.firstName}</strong>،</p>
    <p style="margin:0 0 20px;">${meta.message}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:20px 22px;">
          <p style="margin:0 0 6px;font-size:12px;color:#64748b;letter-spacing:0.02em;">رقم الطلب</p>
          <p style="margin:0 0 16px;font-size:20px;font-weight:800;color:${primary};">${input.orderNumber}</p>

          <p style="margin:0 0 8px;font-size:12px;color:#64748b;">الحالة الحالية</p>
          <span style="display:inline-block;background:${meta.badgeBg};color:${meta.badgeColor};font-weight:700;font-size:13px;padding:8px 14px;border-radius:999px;">
            ${meta.label}
          </span>

          ${
            prevLabel
              ? `<p style="margin:14px 0 0;font-size:13px;color:#64748b;">من: <strong style="color:${dark};">${prevLabel}</strong> ← إلى: <strong style="color:${dark};">${meta.label}</strong></p>`
              : ''
          }

          <p style="margin:16px 0 0;font-size:12px;color:#64748b;">الإجمالي</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:${dark};">${Number(input.total).toFixed(2)} ${BRAND.currency}</p>

          ${
            input.note
              ? `<p style="margin:16px 0 0;padding:12px;background:#ffffff;border-radius:10px;border:1px dashed #cbd5e1;font-size:13px;color:#475569;"><strong>ملاحظة:</strong> ${input.note}</p>`
              : ''
          }
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#64748b;">يمكنك متابعة تفاصيل الطلب من حسابك في أي وقت.</p>`;

  return layout(`تحديث الطلب ${input.orderNumber} — ${meta.label}`, body, {
    label: 'عرض الطلب',
    href: input.orderLink,
  });
}
