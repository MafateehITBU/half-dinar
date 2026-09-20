import { Redis } from 'ioredis';
import { env } from './env.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

/**
 * Idempotent connect — rate-limit RedisStore (or other imports) may already
 * have started a connection via the first command before main() runs.
 */
export async function connectRedis(): Promise<void> {
  if (redis.status === 'ready') return;

  if (redis.status === 'wait' || redis.status === 'end') {
    await redis.connect();
    return;
  }

  // connecting | connect | reconnecting — wait for ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Redis connect timeout (status=${redis.status})`));
    }, 15_000);

    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      clearTimeout(timeout);
      redis.off('ready', onReady);
      redis.off('error', onError);
    };

    if (redis.status === 'ready') {
      cleanup();
      resolve();
      return;
    }

    redis.once('ready', onReady);
    redis.once('error', onError);
  });
}

export async function pingRedis(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}
