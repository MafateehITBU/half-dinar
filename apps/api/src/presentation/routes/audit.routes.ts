import { Router } from 'express';
import { PERMISSIONS } from '@half-dinar/shared';
import { auditService } from '../../application/services/audit.service.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
} from '../middleware/auth.middleware.js';

export const adminAuditRouter = Router();

adminAuditRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.AUDIT_READ),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 50);
    const entityType = req.query.entityType as string | undefined;
    const result = await auditService.list(page, limit, entityType);
    res.json(result);
  }),
);

adminAuditRouter.get(
  '/export',
  authenticate,
  requirePermission(PERMISSIONS.AUDIT_READ),
  asyncHandler(async (req, res) => {
    const entityType = req.query.entityType as string | undefined;
    const csv = await auditService.exportCsv(entityType);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
    res.send(csv);
  }),
);
