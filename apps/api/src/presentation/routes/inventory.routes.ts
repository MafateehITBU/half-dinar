import { Router } from 'express';
import { adjustInventorySchema, PERMISSIONS } from '@half-dinar/shared';
import { inventoryService } from '../../application/services/inventory.service.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware.js';
import { param } from '../../shared/params.js';

export const adminInventoryRouter = Router();

adminInventoryRouter.get(
  '/low-stock',
  authenticate,
  requirePermission(PERMISSIONS.INVENTORY_READ),
  asyncHandler(async (_req, res) => {
    const result = await inventoryService.getLowStockAlerts();
    res.json(result);
  }),
);

adminInventoryRouter.get(
  '/history/:productId',
  authenticate,
  requirePermission(PERMISSIONS.INVENTORY_READ),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 30);
    const result = await inventoryService.getHistory(param(req.params.productId), page, limit);
    res.json(result);
  }),
);

adminInventoryRouter.post(
  '/adjust',
  authenticate,
  requirePermission(PERMISSIONS.INVENTORY_WRITE),
  asyncHandler(async (req, res) => {
    const input = adjustInventorySchema.parse(req.body);
    const user = (req as AuthenticatedRequest).user!;
    const result = await inventoryService.adjust(input, user.sub);
    res.json({ data: result });
  }),
);
