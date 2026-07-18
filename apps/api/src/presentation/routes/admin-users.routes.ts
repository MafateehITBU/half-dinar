import { Router } from 'express';
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  adminUserListQuerySchema,
  PERMISSIONS,
} from '@half-dinar/shared';
import { adminUserService } from '../../application/services/admin-user.service.js';
import { emailService } from '../../application/services/email.service.js';
import { env } from '../../config/env.js';
import { param } from '../../shared/params.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
} from '../middleware/auth.middleware.js';

export const adminUsersRouter = Router();

adminUsersRouter.get(
  '/roles',
  authenticate,
  requirePermission(PERMISSIONS.USERS_READ),
  asyncHandler(async (_req, res) => {
    const data = await adminUserService.listRoles();
    res.json({ data });
  }),
);

adminUsersRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CUSTOMERS_READ),
  asyncHandler(async (req, res) => {
    const query = adminUserListQuerySchema.parse(req.query);
    const result = await adminUserService.list(query);
    res.json(result);
  }),
);

adminUsersRouter.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CUSTOMERS_READ),
  asyncHandler(async (req, res) => {
    const data = await adminUserService.getById(param(req.params.id));
    res.json({ data });
  }),
);

adminUsersRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CUSTOMERS_WRITE),
  asyncHandler(async (req, res) => {
    const input = adminCreateUserSchema.parse(req.body);
    const data = await adminUserService.create(input);
    res.status(201).json({ data });
  }),
);

adminUsersRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CUSTOMERS_WRITE),
  asyncHandler(async (req, res) => {
    const input = adminUpdateUserSchema.parse(req.body);
    const data = await adminUserService.update(param(req.params.id), input);
    res.json({ data });
  }),
);

adminUsersRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CUSTOMERS_WRITE),
  asyncHandler(async (req, res) => {
    await adminUserService.remove(param(req.params.id));
    res.status(204).send();
  }),
);

adminUsersRouter.post(
  '/:id/resend-verification',
  authenticate,
  requirePermission(PERMISSIONS.CUSTOMERS_WRITE),
  asyncHandler(async (req, res) => {
    const { verifyToken } = await adminUserService.resendVerification(param(req.params.id));
    const user = await adminUserService.getById(param(req.params.id));
    await emailService.sendWelcome(user.email, user.firstName, verifyToken).catch(() => {});
    if (env.NODE_ENV === 'development' && !emailService.isConfigured()) {
      console.log(`[dev] Verification token for ${user.email}: ${verifyToken}`);
    }
    res.json({ message: 'Verification email sent' });
  }),
);
