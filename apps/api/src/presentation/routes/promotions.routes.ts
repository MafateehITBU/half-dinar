import { Router } from 'express';
import {
  createCouponSchema,
  createCampaignSchema,
  PERMISSIONS,
} from '@half-dinar/shared';
import { promotionService } from '../../application/services/promotion.service.js';
import { param } from '../../shared/params.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
} from '../middleware/auth.middleware.js';

export const promotionsPublicRouter = Router();

promotionsPublicRouter.get(
  '/flash',
  asyncHandler(async (_req, res) => {
    const { cmsService } = await import('../../application/services/cms.service.js');
    const data = await cmsService.getFlashOffers();
    res.json({ data });
  }),
);

export const adminPromotionsRouter = Router();

adminPromotionsRouter.get(
  '/coupons',
  authenticate,
  requirePermission(PERMISSIONS.PROMOTIONS_READ),
  asyncHandler(async (_req, res) => {
    const coupons = await promotionService.listCoupons();
    res.json({ data: coupons });
  }),
);

adminPromotionsRouter.post(
  '/coupons',
  authenticate,
  requirePermission(PERMISSIONS.PROMOTIONS_WRITE),
  asyncHandler(async (req, res) => {
    const input = createCouponSchema.parse(req.body);
    const coupon = await promotionService.createCoupon(input);
    res.status(201).json({ data: coupon });
  }),
);

adminPromotionsRouter.delete(
  '/coupons/:id',
  authenticate,
  requirePermission(PERMISSIONS.PROMOTIONS_WRITE),
  asyncHandler(async (req, res) => {
    await promotionService.deleteCoupon(param(req.params.id));
    res.status(204).send();
  }),
);

adminPromotionsRouter.get(
  '/campaigns',
  authenticate,
  requirePermission(PERMISSIONS.PROMOTIONS_READ),
  asyncHandler(async (_req, res) => {
    const campaigns = await promotionService.listCampaigns();
    res.json({ data: campaigns });
  }),
);

adminPromotionsRouter.post(
  '/campaigns',
  authenticate,
  requirePermission(PERMISSIONS.PROMOTIONS_WRITE),
  asyncHandler(async (req, res) => {
    const input = createCampaignSchema.parse(req.body);
    const campaign = await promotionService.createCampaign(input);
    res.status(201).json({ data: campaign });
  }),
);

adminPromotionsRouter.delete(
  '/campaigns/:id',
  authenticate,
  requirePermission(PERMISSIONS.PROMOTIONS_WRITE),
  asyncHandler(async (req, res) => {
    await promotionService.deleteCampaign(param(req.params.id));
    res.status(204).send();
  }),
);
