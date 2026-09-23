import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  MEILI_HOST: z.string().default('http://localhost:7700'),
  MEILI_MASTER_KEY: z.string().default('half_dinar_meili_dev_key'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  SEED_SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SEED_SUPER_ADMIN_PASSWORD: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  /** @deprecated Stripe — leftover optional; checkout uses MEPS/PayTabs. */
  STRIPE_CHARGE_CURRENCY: z.string().default('usd'),
  STRIPE_JOD_TO_USD: z.coerce.number().positive().default(1.41),
  /** MEPS / PayTabs Jordan */
  PAYTABS_PROFILE_ID: z.string().optional(),
  PAYTABS_SERVER_KEY: z.string().optional(),
  PAYTABS_CLIENT_KEY: z.string().optional(),
  PAYTABS_REGION: z.string().default('JOR'),
  PAYTABS_BASE_URL: z.string().url().default('https://secure-jordan.paytabs.com'),
  /** Override callback for local tunnels (ngrok). Defaults to API_URL/webhooks/paytabs */
  PAYTABS_CALLBACK_URL: z.string().url().optional(),
  STOREFRONT_URL: z.string().url().default('http://localhost:5173'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((o) => o.trim()),
  isProduction: parsed.data.NODE_ENV === 'production',
  isStripeConfigured: Boolean(parsed.data.STRIPE_SECRET_KEY),
  stripePublishableKey: parsed.data.STRIPE_PUBLISHABLE_KEY ?? '',
  isStripePublicReady: Boolean(
    parsed.data.STRIPE_SECRET_KEY && parsed.data.STRIPE_PUBLISHABLE_KEY,
  ),
  stripeChargeCurrency: parsed.data.STRIPE_CHARGE_CURRENCY.toLowerCase(),
  stripeJodToUsd: parsed.data.STRIPE_JOD_TO_USD,
  isMepsConfigured: Boolean(
    parsed.data.PAYTABS_PROFILE_ID && parsed.data.PAYTABS_SERVER_KEY,
  ),
  paytabsProfileId: parsed.data.PAYTABS_PROFILE_ID ?? '',
  paytabsServerKey: parsed.data.PAYTABS_SERVER_KEY ?? '',
  paytabsClientKey: parsed.data.PAYTABS_CLIENT_KEY ?? '',
  paytabsBaseUrl: parsed.data.PAYTABS_BASE_URL.replace(/\/$/, ''),
  isSmtpConfigured: Boolean(
    parsed.data.SMTP_HOST && parsed.data.SMTP_USER && parsed.data.SMTP_PASS,
  ),
  storefrontUrl: parsed.data.STOREFRONT_URL,
};
