import { env } from '../config/env.js';

/** Stripe minor-unit multiplier (e.g. cents, fils). */
const MINOR_UNIT_MULTIPLIER: Record<string, number> = {
  jod: 1000,
  bhd: 1000,
  kwd: 1000,
  omr: 1000,
  tnd: 1000,
  jpy: 1,
};

const DEFAULT_MINOR_MULTIPLIER = 100;

/** Convert storefront total (JOD) into charge amount in the configured Stripe currency. */
export function jodTotalToStripeCharge(totalJod: number): {
  amount: number;
  currency: string;
  chargeTotal: number;
} {
  const currency = env.stripeChargeCurrency;
  const chargeTotal =
    currency === 'jod'
      ? totalJod
      : Math.round(totalJod * env.stripeJodToUsd * 100) / 100;
  const multiplier = MINOR_UNIT_MULTIPLIER[currency] ?? DEFAULT_MINOR_MULTIPLIER;
  const amount = Math.max(1, Math.round(chargeTotal * multiplier));
  return { amount, currency, chargeTotal };
}
