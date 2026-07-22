import rateLimit, { type Options, type RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../../config/redis.js';
import { env } from '../../config/env.js';

function createStore(prefix: string): Options['store'] | undefined {
  // Redis store when connected; falls back to in-memory if Redis is down
  try {
    return new RedisStore({
      prefix: `rl:${prefix}:`,
      // ioredis
      sendCommand: (...args: string[]) =>
        (redis as unknown as { call: (...a: string[]) => Promise<unknown> }).call(...args) as Promise<number>,
    });
  } catch {
    return undefined;
  }
}

const rateLimitMessage = {
  error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
};

function buildLimiter(
  prefix: string,
  windowMs: number,
  max: number,
  message = rateLimitMessage,
): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message,
    store: createStore(prefix),
    skip: () => env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === '1',
  });
}

/** General API traffic (storefront + admin). */
export const globalApiLimiter = buildLimiter(
  'api',
  15 * 60 * 1000,
  env.isProduction ? 2000 : 5000,
);

/** Login / register — brute-force protection. */
export const authStrictLimiter = buildLimiter(
  'auth',
  15 * 60 * 1000,
  10,
  { error: { code: 'RATE_LIMITED', message: 'Too many auth attempts' } },
);

/** Password reset / forgot / verify — abuse protection. */
export const authSensitiveLimiter = buildLimiter(
  'auth-sensitive',
  60 * 60 * 1000,
  10,
  { error: { code: 'RATE_LIMITED', message: 'Too many password reset attempts' } },
);

/** Refresh token endpoint. */
export const refreshLimiter = buildLimiter('refresh', 15 * 60 * 1000, 60);

/** Checkout mutating endpoints (place-order, stripe confirm, quote). */
export const checkoutLimiter = buildLimiter(
  'checkout',
  15 * 60 * 1000,
  40,
  { error: { code: 'RATE_LIMITED', message: 'Too many checkout attempts' } },
);

/** Contact form (also has its own; keep shared helper). */
export const contactLimiter = buildLimiter('contact', 60 * 60 * 1000, 10);
