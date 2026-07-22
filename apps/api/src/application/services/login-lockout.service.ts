import { redis } from '../../config/redis.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';

const MAX_FAILURES = 8;
const WINDOW_SEC = 15 * 60; // 15 minutes
const LOCK_SEC = 30 * 60; // 30 minutes

function failKey(email: string, ip: string) {
  return `auth:fail:${email.toLowerCase()}:${ip}`;
}

function lockKey(email: string) {
  return `auth:lock:${email.toLowerCase()}`;
}

export async function assertNotLocked(email: string): Promise<void> {
  try {
    const locked = await redis.get(lockKey(email));
    if (locked) {
      throw new AppError(
        429,
        ErrorCodes.RATE_LIMITED,
        'Account temporarily locked due to too many failed login attempts. Try again later.',
      );
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    // Redis down — do not block login
  }
}

export async function recordLoginFailure(email: string, ip: string): Promise<void> {
  try {
    const key = failKey(email, ip);
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, WINDOW_SEC);
    if (count >= MAX_FAILURES) {
      await redis.set(lockKey(email), '1', 'EX', LOCK_SEC);
      await redis.del(key);
    }
  } catch {
    // ignore Redis errors
  }
}

export async function clearLoginFailures(email: string, ip: string): Promise<void> {
  try {
    await redis.del(failKey(email, ip), lockKey(email));
  } catch {
    // ignore
  }
}
