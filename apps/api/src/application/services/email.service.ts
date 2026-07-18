import nodemailer from 'nodemailer';
import { BRAND } from '@half-dinar/shared';
import { env } from '../../config/env.js';
import {
  welcomeEmail,
  passwordResetEmail,
  orderConfirmationEmail,
} from './email-templates.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!env.isSmtpConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: false,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

async function sendMail(to: string, subject: string, html: string) {
  const transport = getTransporter();
  if (!transport) {
    if (env.NODE_ENV === 'development') {
      console.log(`[dev] Email skipped (SMTP not configured) → ${to}: ${subject}`);
    }
    return false;
  }
  await transport.sendMail({
    from: env.SMTP_FROM ?? `noreply@${BRAND.nameEn.toLowerCase().replace(/\s/g, '')}.local`,
    to,
    subject,
    html,
  });
  return true;
}

export const emailService = {
  isConfigured: () => env.isSmtpConfigured,

  async sendWelcome(email: string, firstName: string, verifyToken?: string) {
    const verifyLink = verifyToken
      ? `${env.storefrontUrl}/verify-email?token=${encodeURIComponent(verifyToken)}`
      : null;
    const html = welcomeEmail(firstName, verifyLink);
    return sendMail(email, `مرحباً بك في ${BRAND.nameAr}`, html);
  },

  async sendPasswordReset(email: string, token: string) {
    const link = `${env.storefrontUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const html = passwordResetEmail(link);
    return sendMail(email, `إعادة تعيين كلمة المرور — ${BRAND.nameAr}`, html);
  },

  async sendOrderConfirmation(
    email: string,
    firstName: string,
    orderNumber: string,
    total: number,
    orderId: string,
  ) {
    const link = `${env.storefrontUrl}/orders/${orderId}`;
    const html = orderConfirmationEmail(firstName, orderNumber, total, link);
    return sendMail(email, `تأكيد الطلب ${orderNumber} — ${BRAND.nameAr}`, html);
  },
};
