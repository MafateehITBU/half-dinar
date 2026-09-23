import { Router } from 'express';
import {
  PERMISSIONS,
  updateShippingSettingsSchema,
  updateShippingZoneSchema,
} from '@half-dinar/shared';
import { shippingService } from '../../application/services/shipping.service.js';
import { param } from '../../shared/params.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
} from '../middleware/auth.middleware.js';

export const adminShippingRouter = Router();

adminShippingRouter.use(authenticate);

adminShippingRouter.get(
  '/zones',
  requirePermission(PERMISSIONS.SHIPPING_READ),
  asyncHandler(async (_req, res) => {
    const data = await shippingService.listAdminZones();
    res.json({ data });
  }),
);

adminShippingRouter.patch(
  '/zones/:id',
  requirePermission(PERMISSIONS.SHIPPING_WRITE),
  asyncHandler(async (req, res) => {
    const input = updateShippingZoneSchema.parse(req.body);
    const zone = await shippingService.updateZone(param(req.params.id), input);
    res.json({ data: zone });
  }),
);

adminShippingRouter.patch(
  '/settings',
  requirePermission(PERMISSIONS.SHIPPING_WRITE),
  asyncHandler(async (req, res) => {
    const input = updateShippingSettingsSchema.parse(req.body);
    const data = await shippingService.updateFreeShippingThreshold(input.freeShippingThreshold);
    res.json({ data });
  }),
);
