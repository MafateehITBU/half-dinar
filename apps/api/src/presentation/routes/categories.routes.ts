import { Router, type RequestHandler } from 'express';
import { createCategorySchema, updateCategorySchema } from '@half-dinar/shared';
import { PERMISSIONS } from '@half-dinar/shared';
import { categoryService } from '../../application/services/category.service.js';
import { uploadImage, isCloudinaryConfigured } from '../../config/cloudinary.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { parseCreateCategoryMultipart } from '../helpers/category-multipart.js';
import { param } from '../../shared/params.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
} from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

export const categoriesRouter = Router();

categoriesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const tree = await categoryService.listTree(true);
    res.json({ data: tree });
  }),
);

categoriesRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const category = await categoryService.getBySlug(param(req.params.slug));
    res.json({ data: category });
  }),
);

export const adminCategoriesRouter = Router();

const optionalCategoryImageUpload: RequestHandler = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return upload.single('image')(req, res, next);
  }
  return next();
};

adminCategoriesRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CATEGORIES_READ),
  asyncHandler(async (_req, res) => {
    const tree = await categoryService.listTree(false);
    res.json({ data: tree });
  }),
);

adminCategoriesRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CATEGORIES_WRITE),
  optionalCategoryImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file as Express.Multer.File | undefined;
    let imageUrl: string | undefined;

    if (file) {
      if (!isCloudinaryConfigured) {
        throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Cloudinary غير مُعدّ. أضف CLOUDINARY_* في apps/api/.env');
      }
      const uploaded = await uploadImage(file.buffer, 'abou-al-nas/categories');
      imageUrl = uploaded.url;
    }

    const input = req.is('multipart/form-data')
      ? parseCreateCategoryMultipart(req.body as Record<string, string>)
      : createCategorySchema.parse(req.body);

    const category = await categoryService.create({ ...input, imageUrl: imageUrl ?? input.imageUrl });
    res.status(201).json({ data: category });
  }),
);

adminCategoriesRouter.patch(
  '/:id/image',
  authenticate,
  requirePermission(PERMISSIONS.CATEGORIES_WRITE),
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!isCloudinaryConfigured) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Cloudinary غير مُعدّ');
    }
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'No image uploaded');
    }
    const uploaded = await uploadImage(file.buffer, 'abou-al-nas/categories');
    const category = await categoryService.update(param(req.params.id), { imageUrl: uploaded.url });
    res.json({ data: category });
  }),
);

adminCategoriesRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CATEGORIES_WRITE),
  optionalCategoryImageUpload,
  asyncHandler(async (req, res) => {
    const file = req.file as Express.Multer.File | undefined;
    let imageUrl: string | undefined;

    if (file) {
      if (!isCloudinaryConfigured) {
        throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Cloudinary غير مُعدّ');
      }
      const uploaded = await uploadImage(file.buffer, 'abou-al-nas/categories');
      imageUrl = uploaded.url;
    }

    const body = req.body as Record<string, string>;
    const input = req.is('multipart/form-data')
      ? updateCategorySchema.parse({
          nameAr: body.nameAr,
          nameEn: body.nameEn,
          parentId: body.parentId === '' ? null : body.parentId || undefined,
          icon: body.icon === '' ? null : body.icon || undefined,
          isActive: body.isActive !== 'false',
          sortOrder: body.sortOrder ? Number(body.sortOrder) : undefined,
        })
      : updateCategorySchema.parse(req.body);

    const category = await categoryService.update(param(req.params.id), {
      ...input,
      ...(imageUrl ? { imageUrl } : {}),
    });
    res.json({ data: category });
  }),
);

adminCategoriesRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CATEGORIES_WRITE),
  asyncHandler(async (req, res) => {
    await categoryService.remove(param(req.params.id));
    res.status(204).send();
  }),
);
