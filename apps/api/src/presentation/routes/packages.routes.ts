import { Router, type RequestHandler } from 'express';
import {
  createPackageSchema,
  updatePackageSchema,
  PERMISSIONS,
} from '@half-dinar/shared';
import { packageService } from '../../application/services/package.service.js';
import { uploadImage, isCloudinaryConfigured } from '../../config/cloudinary.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { parseCreatePackageMultipart } from '../helpers/package-multipart.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
} from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { param } from '../../shared/params.js';

export const packagesRouter = Router();

packagesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await packageService.list(page, limit);
    res.json(result);
  }),
);

packagesRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const pkg = await packageService.getBySlug(param(req.params.slug));
    res.json({ data: pkg });
  }),
);

export const adminPackagesRouter = Router();

const optionalPackageImageUpload: RequestHandler = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return upload.single('image')(req, res, next);
  }
  return next();
};

adminPackagesRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.PACKAGES_READ),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await packageService.adminList(page, limit);
    res.json(result);
  }),
);

adminPackagesRouter.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.PACKAGES_READ),
  asyncHandler(async (req, res) => {
    const pkg = await packageService.getById(param(req.params.id));
    res.json({ data: pkg });
  }),
);

adminPackagesRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.PACKAGES_WRITE),
  optionalPackageImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file as Express.Multer.File | undefined;
    let imageUrl: string | undefined;

    if (file) {
      if (!isCloudinaryConfigured) {
        throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Cloudinary غير مُعدّ');
      }
      const uploaded = await uploadImage(file.buffer, 'abou-al-nas/packages');
      imageUrl = uploaded.url;
    }

    const input = req.is('multipart/form-data')
      ? parseCreatePackageMultipart(req.body as Record<string, string>)
      : createPackageSchema.parse(req.body);

    const pkg = await packageService.create({ ...input, imageUrl: imageUrl ?? input.imageUrl });
    res.status(201).json({ data: pkg });
  }),
);

adminPackagesRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.PACKAGES_WRITE),
  asyncHandler(async (req, res) => {
    const input = updatePackageSchema.parse(req.body);
    const pkg = await packageService.update(param(req.params.id), input);
    res.json({ data: pkg });
  }),
);

adminPackagesRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.PACKAGES_WRITE),
  asyncHandler(async (req, res) => {
    await packageService.remove(param(req.params.id));
    res.status(204).send();
  }),
);
