import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { contactSubmitSchema, contactStatusUpdateSchema, PERMISSIONS } from '@half-dinar/shared';
import { contactService } from '../../application/services/contact.service.js';
import { asyncHandler, authenticate, requirePermission } from '../middleware/auth.middleware.js';
import { AppError } from '../../shared/errors.js';
import { param } from '../../shared/params.js';

export const contactRouter = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: { code: 'RATE_LIMITED', message: 'عدد كبير من الرسائل. حاول لاحقاً.' } },
});

contactRouter.post(
  '/',
  contactLimiter,
  asyncHandler(async (req, res) => {
    const input = contactSubmitSchema.parse(req.body);
    const data = await contactService.submit(input);
    res.status(201).json({ data, message: 'تم إرسال رسالتك بنجاح' });
  }),
);

export const adminContactRouter = Router();

adminContactRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CUSTOMERS_READ),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const result = await contactService.adminList(page, limit, status);
    res.json(result);
  }),
);

adminContactRouter.get(
  '/stats',
  authenticate,
  requirePermission(PERMISSIONS.CUSTOMERS_READ),
  asyncHandler(async (_req, res) => {
    const newCount = await contactService.adminCountNew();
    res.json({ data: { newCount } });
  }),
);

adminContactRouter.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CUSTOMERS_READ),
  asyncHandler(async (req, res) => {
    const data = await contactService.adminGet(param(req.params.id));
    if (!data) throw new AppError(404, 'NOT_FOUND', 'الرسالة غير موجودة');
    res.json({ data });
  }),
);

adminContactRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CUSTOMERS_WRITE),
  asyncHandler(async (req, res) => {
    const { status } = contactStatusUpdateSchema.parse(req.body);
    try {
      const data = await contactService.adminUpdateStatus(param(req.params.id), status);
      res.json({ data });
    } catch {
      throw new AppError(404, 'NOT_FOUND', 'الرسالة غير موجودة');
    }
  }),
);
