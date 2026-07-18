import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { pingRedis } from '../../config/redis.js';
import { asyncHandler } from '../middleware/auth.middleware.js';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    let dbOk = false;
    let redisOk = false;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    redisOk = await pingRedis();

    const status = dbOk && redisOk ? 'ok' : 'degraded';
    res.status(status === 'ok' ? 200 : 503).json({
      status,
      services: {
        database: dbOk ? 'up' : 'down',
        redis: redisOk ? 'up' : 'down',
      },
      timestamp: new Date().toISOString(),
    });
  }),
);
