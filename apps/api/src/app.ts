import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import openapiSpec from './openapi/openapi.json' with { type: 'json' };
import { env } from './config/env.js';
import { v1Router } from './presentation/routes/index.js';
import { webhooksRouter } from './presentation/routes/webhooks.routes.js';
import { errorHandler, notFoundHandler } from './presentation/middleware/error.middleware.js';
import {
  authSensitiveLimiter,
  authStrictLimiter,
  globalApiLimiter,
  refreshLimiter,
} from './presentation/middleware/rate-limit.middleware.js';

export function createApp() {
  const app = express();

  // Nginx terminates TLS and sets X-Forwarded-*; required for rate-limit + secure cookies
  if (env.NODE_ENV !== 'development') {
    app.set('trust proxy', 1);
  }

  app.use(
    helmet({
      // Enable CSP for staging + production (payment / Visa surfaces)
      contentSecurityPolicy: env.NODE_ENV !== 'development',
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts:
        env.NODE_ENV !== 'development'
          ? { maxAge: 31536000, includeSubDomains: true, preload: false }
          : false,
    }),
  );
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );

  // PayTabs / MEPS callbacks require raw body for HMAC signature verification
  app.use('/api/v1/webhooks/paytabs', express.raw({ type: 'application/json' }), webhooksRouter);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api', globalApiLimiter);

  app.use('/api/v1/auth/login', authStrictLimiter);
  app.use('/api/v1/auth/register', authStrictLimiter);
  app.use('/api/v1/auth/google', authStrictLimiter);
  app.use('/api/v1/auth/forgot-password', authSensitiveLimiter);
  app.use('/api/v1/auth/reset-password', authSensitiveLimiter);
  app.use('/api/v1/auth/verify-email', authSensitiveLimiter);
  app.use('/api/v1/auth/refresh', refreshLimiter);

  app.get('/', (_req, res) => {
    res.json({
      message: 'MawJooD API — use /api/v1',
      docs: env.isProduction ? undefined : '/api/docs',
    });
  });

  if (!env.isProduction) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'MawJooD API' }));
  }

  app.use('/api/v1', v1Router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
