import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import openapiSpec from './openapi/openapi.json' with { type: 'json' };
import { env } from './config/env.js';
import { v1Router } from './presentation/routes/index.js';
import { webhooksRouter } from './presentation/routes/webhooks.routes.js';
import { errorHandler, notFoundHandler } from './presentation/middleware/error.middleware.js';

export function createApp() {
  const app = express();

  // Nginx terminates TLS and sets X-Forwarded-*; required for rate-limit + secure cookies
  if (env.NODE_ENV !== 'development') {
    app.set('trust proxy', 1);
  }

  app.use(
    helmet({
      contentSecurityPolicy: env.isProduction,
    }),
  );
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );

  // Stripe webhooks require raw body
  app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }), webhooksRouter);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.isProduction ? 100 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many auth attempts' } },
  });
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);

  app.get('/', (_req, res) => {
    res.json({ message: 'Abu Al-Nas API — use /api/v1', docs: env.isProduction ? undefined : '/api/docs' });
  });

  if (!env.isProduction) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'Abu Al-Nas API' }));
  }

  app.use('/api/v1', v1Router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
