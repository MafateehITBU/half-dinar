import { Router } from 'express';
import { z } from 'zod';
import { PERMISSIONS } from '@half-dinar/shared';
import { bulkService } from '../../application/services/bulk.service.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
} from '../middleware/auth.middleware.js';

export const adminBulkRouter = Router();

const bulkIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
});

const bulkContactStatusSchema = bulkIdsSchema.extend({
  status: z.enum(['new', 'read', 'archived']),
});

const bulkReviewStatusSchema = bulkIdsSchema.extend({
  status: z.enum(['approved', 'rejected']),
});

adminBulkRouter.get(
  '/products/export',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_READ),
  asyncHandler(async (_req, res) => {
    const csv = await bulkService.exportProductsCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="products-export.csv"');
    res.send(csv);
  }),
);

adminBulkRouter.post(
  '/products/import',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  asyncHandler(async (req, res) => {
    const content = typeof req.body === 'string' ? req.body : req.body?.csv;
    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: { message: 'Send raw CSV as body or { csv: "..." }' } });
      return;
    }
    const result = await bulkService.importProductsCsv(content);
    res.json({ data: result });
  }),
);

adminBulkRouter.post(
  '/products/delete',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  asyncHandler(async (req, res) => {
    const { ids } = bulkIdsSchema.parse(req.body);
    const data = await bulkService.deleteProducts(ids);
    res.json({ data });
  }),
);

adminBulkRouter.post(
  '/categories/delete',
  authenticate,
  requirePermission(PERMISSIONS.CATEGORIES_WRITE),
  asyncHandler(async (req, res) => {
    const { ids } = bulkIdsSchema.parse(req.body);
    const data = await bulkService.deleteCategories(ids);
    res.json({ data });
  }),
);

adminBulkRouter.post(
  '/coupons/delete',
  authenticate,
  requirePermission(PERMISSIONS.PROMOTIONS_WRITE),
  asyncHandler(async (req, res) => {
    const { ids } = bulkIdsSchema.parse(req.body);
    const data = await bulkService.deleteCoupons(ids);
    res.json({ data });
  }),
);

adminBulkRouter.post(
  '/campaigns/delete',
  authenticate,
  requirePermission(PERMISSIONS.PROMOTIONS_WRITE),
  asyncHandler(async (req, res) => {
    const { ids } = bulkIdsSchema.parse(req.body);
    const data = await bulkService.deleteCampaigns(ids);
    res.json({ data });
  }),
);

adminBulkRouter.post(
  '/packages/delete',
  authenticate,
  requirePermission(PERMISSIONS.PACKAGES_WRITE),
  asyncHandler(async (req, res) => {
    const { ids } = bulkIdsSchema.parse(req.body);
    const data = await bulkService.deletePackages(ids);
    res.json({ data });
  }),
);

adminBulkRouter.post(
  '/users/deactivate',
  authenticate,
  requirePermission(PERMISSIONS.USERS_WRITE),
  asyncHandler(async (req, res) => {
    const { ids } = bulkIdsSchema.parse(req.body);
    const data = await bulkService.deactivateUsers(ids);
    res.json({ data });
  }),
);

adminBulkRouter.post(
  '/contact/status',
  authenticate,
  requirePermission(PERMISSIONS.CUSTOMERS_WRITE),
  asyncHandler(async (req, res) => {
    const { ids, status } = bulkContactStatusSchema.parse(req.body);
    const data = await bulkService.updateContactStatus(ids, status);
    res.json({ data });
  }),
);

adminBulkRouter.post(
  '/reviews/status',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  asyncHandler(async (req, res) => {
    const { ids, status } = bulkReviewStatusSchema.parse(req.body);
    const data = await bulkService.moderateReviews(ids, status);
    res.json({ data });
  }),
);
