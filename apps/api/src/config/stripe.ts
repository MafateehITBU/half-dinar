import Stripe from 'stripe';
import { env } from './env.js';
import { AppError, ErrorCodes } from '../shared/errors.js';

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

export function requireStripe(): Stripe {
  if (!stripe) {
    throw new AppError(503, ErrorCodes.VALIDATION_ERROR, 'Stripe is not configured');
  }
  return stripe;
}

export function stripeErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'type' in err && (err as Stripe.errors.StripeError).type === 'StripeInvalidRequestError') {
    const stripeErr = err as Stripe.errors.StripeInvalidRequestError;
    if (stripeErr.message?.includes('Invalid currency')) {
      return 'حساب Stripe لا يدعم عملة الدفع المحددة. عيّن STRIPE_CHARGE_CURRENCY=usd في apps/api/.env أو فعّل JOD من لوحة Stripe.';
    }
    return stripeErr.message;
  }
  if (err instanceof Error) return err.message;
  return 'Stripe payment failed';
}
