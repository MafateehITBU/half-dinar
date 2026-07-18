import { Router } from 'express';
import { PERMISSIONS } from '@half-dinar/shared';
import { analyticsService } from '../../application/services/analytics.service.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
} from '../middleware/auth.middleware.js';

export const adminAnalyticsRouter = Router();

adminAnalyticsRouter.get(
  '/dashboard',
  authenticate,
  requirePermission(PERMISSIONS.ANALYTICS_READ),
  asyncHandler(async (req, res) => {
    const periodDays = Number(req.query.days ?? 30);
    const data = await analyticsService.getDashboard(periodDays);
    res.json({ data });
  }),
);
