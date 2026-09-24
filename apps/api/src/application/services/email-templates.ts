import { BRAND } from '@half-dinar/shared';
import { env } from '../../config/env.js';

/** Brand palette (matches storefront CSS) */
const green = '#0b4745';
const greenDark = '#062e2d';
const greenLight = '#0e5c59';
const gold = '#dcbb87';
const goldLight = '#ede4c9';
const ink = '#1a2e2d';
const muted = '#5c6f6e';
const cream = '#f7f4ee';
const white = '#ffffff';

function logoUrl() {
  const base = env.storefrontUrl.replace(/\/$/, '');
  return `${base}/brand/logo-email.png`;
}

function siteUrl(path = '/') {
  const base = env.storefrontUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Shared branded shell — logo header, cream body, gold CTA, footer.
 * Table-based for Gmail / Outlook compatibility.
 */
function layout(title: string, body: string, cta?: { label: string; href: string }) {
  const logo = logoUrl();
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${cream};font-family:'Segoe UI',Tahoma,Arial,Cairo,sans-serif;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(title)} — ${BRAND.nameAr}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${cream};padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${white};border-radius:20px;overflow:hidden;border:1px solid #e8e2d6;box-shadow:0 12px 40px rgba(6,46,45,0.08);">

          <!-- Header with logo -->
          <tr>
            <td style="background:linear-gradient(145deg,${greenDark} 0%,${green} 55%,${greenLight} 100%);padding:28px 28px 24px;text-align:center;">
              <a href="${siteUrl('/')}" style="text-decoration:none;display:inline-block;">
                <img
                  src="${logo}"
                  alt="${escapeHtml(BRAND.nameAr)}"
                  width="168"
                  style="display:block;margin:0 auto;width:168px;max-width:70%;height:auto;border:0;outline:none;"
                />
              </a>
              <p style="margin:14px 0 0;color:${goldLight};font-size:12px;letter-spacing:0.04em;font-weight:600;">
                ${escapeHtml(BRAND.nameEn)} · الأردن
              </p>
            </td>
          </tr>

          <!-- Gold accent line -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,${goldLight},${gold},${goldLight});font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 28px 8px;color:${ink};font-size:15px;line-height:1.75;text-align:right;">
              ${body}
            </td>
          </tr>

          ${
            cta
              ? `<!-- CTA -->
          <tr>
            <td style="padding:8px 28px 32px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:12px;background:linear-gradient(135deg,${gold} 0%,#c4a063 100%);">
                    <a href="${cta.href}" style="display:inline-block;padding:14px 36px;color:${greenDark};text-decoration:none;font-weight:800;font-size:15px;border-radius:12px;">
                      ${escapeHtml(cta.label)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : `<tr><td style="padding-bottom:28px;"></td></tr>`
          }

          <!-- Footer -->
          <tr>
            <td style="padding:22px 28px;background:${greenDark};text-align:center;">
              <img
                src="${logo}"
                alt=""
                width="96"
                style="display:block;margin:0 auto 12px;width:96px;height:auto;opacity:0.95;border:0;"
              />
              <p style="margin:0 0 8px;color:${goldLight};font-size:13px;font-weight:700;">${escapeHtml(BRAND.nameAr)}</p>
              <p style="margin:0 0 12px;color:rgba(237,228,201,0.75);font-size:12px;line-height:1.6;">
                تسوق يومي موثوق · توصيل داخل الأردن
              </p>
              <p style="margin:0;">
                <a href="${siteUrl('/')}" style="color:${gold};font-size:12px;text-decoration:none;margin:0 8px;">المتجر</a>
                <span style="color:rgba(237,228,201,0.35);">|</span>
                <a href="${siteUrl('/orders')}" style="color:${gold};font-size:12px;text-decoration:none;margin:0 8px;">طلباتي</a>
                <span style="color:rgba(237,228,201,0.35);">|</span>
                <a href="${siteUrl('/contact')}" style="color:${gold};font-size:12px;text-decoration:none;margin:0 8px;">تواصل معنا</a>
              </p>
              <p style="margin:16px 0 0;color:rgba(237,228,201,0.45);font-size:11px;">
                © ${year} ${escapeHtml(BRAND.nameAr)}. جميع الحقوق محفوظة.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:16px 0 0;color:${muted};font-size:11px;text-align:center;max-width:480px;">
          وصلك هذا البريد لأن لديك حساباً أو طلباً لدى ${escapeHtml(BRAND.nameAr)}.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function infoCard(rows: Array<{ label: string; value: string; emphasize?: boolean }>) {
  const cells = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee8dc;font-size:12px;color:${muted};width:38%;">${r.label}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee8dc;font-size:${r.emphasize ? '18px' : '14px'};font-weight:${r.emphasize ? '800' : '700'};color:${r.emphasize ? green : ink};text-align:left;" dir="ltr">${r.value}</td>
      </tr>`,
    )
    .join('');
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:${cream};border-radius:14px;border:1px solid #e8e2d6;">
      <tr><td style="padding:8px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cells}</table>
      </td></tr>
    </table>`;
}

export function welcomeEmail(firstName: string, verifyLink: string | null) {
  const body = `
    <h1 style="margin:0 0 12px;font-size:22px;color:${green};font-weight:800;">مرحباً ${escapeHtml(firstName)}</h1>
    <p style="margin:0 0 12px;color:${ink};">أهلاً بك في <strong>${BRAND.nameAr}</strong> — يسعدنا انضمامك.</p>
    <p style="margin:0;color:${muted};">فعّل بريدك لتستلم تأكيدات الطلبات وتحديثات الشحن والعروض.</p>
    ${!verifyLink ? `<p style="margin:16px 0 0;color:${muted};font-size:13px;">يمكنك البدء بالتسوق مباشرة من المتجر.</p>` : ''}`;
  return layout(
    `مرحباً بك في ${BRAND.nameAr}`,
    body,
    verifyLink ? { label: 'تفعيل الحساب', href: verifyLink } : { label: 'تصفح المتجر', href: siteUrl('/') },
  );
}

export function passwordResetEmail(link: string) {
  const body = `
    <h1 style="margin:0 0 12px;font-size:22px;color:${green};font-weight:800;">إعادة تعيين كلمة المرور</h1>
    <p style="margin:0 0 12px;color:${ink};">تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في ${BRAND.nameAr}.</p>
    <p style="margin:0;color:${muted};">إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان.</p>
    <p style="margin:16px 0 0;font-size:13px;color:${muted};">الرابط صالح لمدة <strong style="color:${ink};">ساعة واحدة</strong>.</p>`;
  return layout('إعادة تعيين كلمة المرور', body, { label: 'تعيين كلمة مرور جديدة', href: link });
}

export function orderConfirmationEmail(
  firstName: string,
  orderNumber: string,
  total: number,
  orderLink: string,
) {
  const body = `
    <h1 style="margin:0 0 12px;font-size:22px;color:${green};font-weight:800;">شكراً لطلبك، ${escapeHtml(firstName)}</h1>
    <p style="margin:0;color:${ink};">تم استلام طلبك بنجاح وسنُبقيك على اطلاع بكل تحديث.</p>
    ${infoCard([
      { label: 'رقم الطلب', value: escapeHtml(orderNumber), emphasize: true },
      { label: 'الإجمالي', value: `${Number(total).toFixed(2)} ${BRAND.currency}` },
    ])}
    <p style="margin:0;color:${muted};font-size:13px;">ستصلك رسالة عند كل تغيير في حالة الطلب (تجهيز، شحن، تسليم…).</p>`;
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
    badgeBg: '#d8f3f1',
    badgeColor: green,
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
    badgeBg: goldLight,
    badgeColor: '#8a6a2f',
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
    badgeBg: '#e8e2d6',
    badgeColor: ink,
  };
  const prevLabel =
    input.previousStatus && STATUS_META[input.previousStatus as StatusKey]
      ? STATUS_META[input.previousStatus as StatusKey].label
      : null;

  const body = `
    <h1 style="margin:0 0 10px;font-size:22px;color:${green};font-weight:800;">${escapeHtml(meta.headline)}</h1>
    <p style="margin:0 0 8px;color:${ink};">مرحباً <strong>${escapeHtml(input.firstName)}</strong>،</p>
    <p style="margin:0 0 18px;color:${muted};">${escapeHtml(meta.message)}</p>

    <div style="margin:0 0 18px;">
      <span style="display:inline-block;background:${meta.badgeBg};color:${meta.badgeColor};font-weight:800;font-size:13px;padding:8px 16px;border-radius:999px;">
        ${escapeHtml(meta.label)}
      </span>
    </div>

    ${infoCard([
      { label: 'رقم الطلب', value: escapeHtml(input.orderNumber), emphasize: true },
      ...(prevLabel
        ? [{ label: 'التحديث', value: `${prevLabel} ← ${meta.label}` }]
        : []),
      { label: 'الإجمالي', value: `${Number(input.total).toFixed(2)} ${BRAND.currency}` },
    ])}

    ${
      input.note
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:${white};border-radius:12px;border:1px dashed ${gold};">
            <tr><td style="padding:14px 16px;font-size:13px;color:${muted};">
              <strong style="color:${green};">ملاحظة:</strong> ${escapeHtml(input.note)}
            </td></tr>
          </table>`
        : ''
    }

    <p style="margin:0;font-size:13px;color:${muted};">تابع تفاصيل الطلب من حسابك في أي وقت.</p>`;

  return layout(`تحديث الطلب ${input.orderNumber} — ${meta.label}`, body, {
    label: 'عرض الطلب',
    href: input.orderLink,
  });
}
