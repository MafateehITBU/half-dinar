import { Router, type RequestHandler } from 'express';
import {
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
  PERMISSIONS,
} from '@half-dinar/shared';
import { productService, MAX_PRODUCT_IMAGES } from '../../application/services/product.service.js';
import { mapProductSummary } from '../../application/services/category.service.js';
import { applyCampaignToSummary } from '../../application/services/campaign-pricing.js';
import { promotionService } from '../../application/services/promotion.service.js';
import { uploadImage, isCloudinaryConfigured } from '../../config/cloudinary.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
} from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { parseCreateProductMultipart } from '../helpers/product-multipart.js';
import { param } from '../../shared/params.js';
import { prisma } from '../../config/database.js';

export const productsRouter = Router();

productsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = productListQuerySchema.parse(req.query);
    const result = await productService.list(query);
    res.json(result);
  }),
);

productsRouter.get(
  '/compare',
  asyncHandler(async (req, res) => {
    const ids = String(req.query.ids ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
    if (!ids.length) {
      res.json({ data: [] });
      return;
    }
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        tags: { include: { tag: true } },
      },
    });
    const ordered = ids
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean)
      .map((p) => mapProductSummary(p!));
    const campaignPrices = await promotionService.getActiveCampaignPrices();
    res.json({ data: ordered.map((p) => applyCampaignToSummary(p, campaignPrices)) });
  }),
);

productsRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const product = await productService.getBySlug(param(req.params.slug));
    res.json({ data: product });
  }),
);

export const tagsRouter = Router();

tagsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const tags = await prisma.tag.findMany({ orderBy: { nameAr: 'asc' } });
    res.json({ data: tags });
  }),
);

export const adminProductsRouter = Router();

const optionalProductImagesUpload: RequestHandler = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return upload.array('images', MAX_PRODUCT_IMAGES)(req, res, next);
  }
  return next();
};

adminProductsRouter.get(
  '/picker',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_READ),
  asyncHandler(async (_req, res) => {
    const result = await productService.adminPicker();
    res.json(result);
  }),
);

adminProductsRouter.get(
  '/media-config',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_READ),
  asyncHandler(async (_req, res) => {
    res.json({
      data: {
        cloudinary: isCloudinaryConfigured,
        maxImages: MAX_PRODUCT_IMAGES,
        maxSizeMb: 5,
        accept: 'image/jpeg,image/png,image/webp,image/gif',
      },
    });
  }),
);

adminProductsRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_READ),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const result = await productService.adminList(page, limit);
    res.json(result);
  }),
);

adminProductsRouter.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_READ),
  asyncHandler(async (req, res) => {
    const product = await productService.getAdminById(param(req.params.id));
    res.json({ data: product });
  }),
);

adminProductsRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  optionalProductImagesUpload,
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    let uploadedImages: { url: string; publicId: string }[] = [];

    if (files.length > 0) {
      if (!isCloudinaryConfigured) {
        throw new AppError(
          400,
          ErrorCodes.VALIDATION_ERROR,
          'Cloudinary غير مُعدّ. أضف CLOUDINARY_* في apps/api/.env',
        );
      }
      uploadedImages = await Promise.all(files.map((f) => uploadImage(f.buffer)));
    }

    const input = req.is('multipart/form-data')
      ? parseCreateProductMultipart(req.body as Record<string, string>)
      : createProductSchema.parse(req.body);

    if (!uploadedImages.length && !input.imageUrls?.length && files.length === 0) {
      // ok — product without images
    }

    const product = await productService.create(input, uploadedImages.length ? uploadedImages : undefined);
    res.status(201).json({ data: product });
  }),
);

adminProductsRouter.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  asyncHandler(async (req, res) => {
    const input = updateProductSchema.parse(req.body);
    const product = await productService.update(param(req.params.id), input);
    res.json({ data: product });
  }),
);

adminProductsRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  asyncHandler(async (req, res) => {
    await productService.remove(param(req.params.id));
    res.status(204).send();
  }),
);

adminProductsRouter.post(
  '/:id/images',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  upload.array('images', MAX_PRODUCT_IMAGES),
  asyncHandler(async (req, res) => {
    if (!isCloudinaryConfigured) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'Cloudinary غير مُعدّ. أضف CLOUDINARY_* في apps/api/.env',
      );
    }

    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'No images uploaded');
    }

    const uploaded = await Promise.all(files.map((f) => uploadImage(f.buffer)));
    await productService.addImages(param(req.params.id), uploaded);
    res.status(201).json({ data: uploaded });
  }),
);

adminProductsRouter.delete(
  '/:id/images/:imageId',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  asyncHandler(async (req, res) => {
    await productService.removeImage(param(req.params.id), param(req.params.imageId));
    res.status(204).send();
  }),
);
