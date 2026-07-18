import { Router } from 'express';
import { createReviewSchema, moderateReviewSchema, PERMISSIONS } from '@half-dinar/shared';
import { reviewService } from '../../application/services/review.service.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware.js';
import { param } from '../../shared/params.js';

export const reviewsRouter = Router();

reviewsRouter.get(
  '/product/:slug',
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const result = await reviewService.listByProductSlug(param(req.params.slug), page, limit);
    res.json({ data: result });
  }),
);

reviewsRouter.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const input = createReviewSchema.parse(req.body);
    const user = (req as AuthenticatedRequest).user!;
    const review = await reviewService.create(user.sub, input);
    res.status(201).json({ data: review });
  }),
);

export const adminReviewsRouter = Router();

adminReviewsRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_READ),
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await reviewService.adminList(status, page, limit);
    res.json(result);
  }),
);

adminReviewsRouter.patch(
  '/:id/status',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  asyncHandler(async (req, res) => {
    const { status } = moderateReviewSchema.parse(req.body);
    const result = await reviewService.moderate(param(req.params.id), status);
    res.json({ data: result });
  }),
);
