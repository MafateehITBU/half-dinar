import { Router } from 'express';
import { createRefundSchema, moderateRefundSchema, PERMISSIONS } from '@half-dinar/shared';
import { refundService } from '../../application/services/refund.service.js';
import { uploadImage, isCloudinaryConfigured } from '../../config/cloudinary.js';
import { upload } from '../middleware/upload.middleware.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware.js';
import { param } from '../../shared/params.js';

export const refundsRouter = Router();

refundsRouter.use(authenticate);

refundsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user!;
    const data = await refundService.listForUser(user.sub);
    res.json({ data });
  }),
);

refundsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user!;
    const input = createRefundSchema.parse(req.body);
    const data = await refundService.create(user.sub, input);
    res.status(201).json({ data });
  }),
);

refundsRouter.post(
  '/evidence',
  upload.array('images', 5),
  asyncHandler(async (req, res) => {
    if (!isCloudinaryConfigured) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'Image upload not configured. Pass imageUrls in refund request body.',
      );
    }
    const files = req.files as Express.Multer.File[];
    const urls: string[] = [];
    for (const file of files ?? []) {
      const uploaded = await uploadImage(file.buffer, 'abou-al-nas/refunds');
      urls.push(uploaded.url);
    }
    res.json({ data: { imageUrls: urls } });
  }),
);

export const adminRefundsRouter = Router();

adminRefundsRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.REFUNDS_READ),
  asyncHandler(async (req, res) => {
    const status = req.query.status as string | undefined;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await refundService.listAdmin(status, page, limit);
    res.json(result);
  }),
);

adminRefundsRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.REFUNDS_WRITE),
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user!;
    const input = moderateRefundSchema.parse(req.body);
    const data = await refundService.moderate(
      param(req.params.id),
      user.sub,
      input,
      req.ip,
    );
    res.json({ data });
  }),
);
