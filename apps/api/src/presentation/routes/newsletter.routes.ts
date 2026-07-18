import { Router } from 'express';
import {
  newsletterSubscribeSchema,
  newsletterUnsubscribeSchema,
  PERMISSIONS,
} from '@half-dinar/shared';
import { newsletterService } from '../../application/services/newsletter.service.js';
import { asyncHandler, authenticate, requirePermission } from '../middleware/auth.middleware.js';

export const newsletterRouter = Router();

newsletterRouter.post(
  '/subscribe',
  asyncHandler(async (req, res) => {
    const input = newsletterSubscribeSchema.parse(req.body);
    const data = await newsletterService.subscribe(input);
    res.status(201).json({ data });
  }),
);

newsletterRouter.post(
  '/unsubscribe',
  asyncHandler(async (req, res) => {
    const input = newsletterUnsubscribeSchema.parse(req.body);
    const data = await newsletterService.unsubscribe(input.email);
    res.json({ data });
  }),
);

export const adminNewsletterRouter = Router();

adminNewsletterRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CUSTOMERS_READ),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 50);
    const result = await newsletterService.adminList(page, limit);
    res.json(result);
  }),
);
