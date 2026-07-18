import { Router } from 'express';
import {
  createHeroSlideSchema,
  createCmsPageSchema,
  createFaqSchema,
  createBlogPostSchema,
  updateHeroSlideSchema,
  updateCmsPageSchema,
  updateFaqSchema,
  updateBlogPostSchema,
  updateCmsSectionSchema,
  PERMISSIONS,
} from '@half-dinar/shared';
import { cmsService } from '../../application/services/cms.service.js';
import { param } from '../../shared/params.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
} from '../middleware/auth.middleware.js';

export const cmsPublicRouter = Router();

cmsPublicRouter.get(
  '/home',
  asyncHandler(async (_req, res) => {
    const data = await cmsService.getHomePayload();
    res.json({ data });
  }),
);

cmsPublicRouter.get(
  '/pages/:slug',
  asyncHandler(async (req, res) => {
    const page = await cmsService.getPageBySlug(param(req.params.slug));
    res.json({ data: page });
  }),
);

cmsPublicRouter.get(
  '/contact',
  asyncHandler(async (_req, res) => {
    const data = await cmsService.getContactPayload();
    res.json({ data });
  }),
);

export const blogPublicRouter = Router();

blogPublicRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const result = await cmsService.listBlogPosts(page);
    res.json(result);
  }),
);

blogPublicRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const post = await cmsService.getBlogPost(param(req.params.slug));
    res.json({ data: post });
  }),
);

export const adminCmsRouter = Router();

adminCmsRouter.get(
  '/hero-slides',
  authenticate,
  requirePermission(PERMISSIONS.CMS_READ),
  asyncHandler(async (_req, res) => {
    res.json({ data: await cmsService.listHeroSlides() });
  }),
);

adminCmsRouter.post(
  '/hero-slides',
  authenticate,
  requirePermission(PERMISSIONS.CMS_WRITE),
  asyncHandler(async (req, res) => {
    const input = createHeroSlideSchema.parse(req.body);
    const slide = await cmsService.createHeroSlide({
      ...input,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
    });
    res.status(201).json({ data: slide });
  }),
);

adminCmsRouter.patch(
  '/hero-slides/:id',
  authenticate,
  requirePermission(PERMISSIONS.CMS_WRITE),
  asyncHandler(async (req, res) => {
    const input = updateHeroSlideSchema.parse(req.body);
    const slide = await cmsService.updateHeroSlide(param(req.params.id), {
      ...input,
      startsAt: input.startsAt ? new Date(input.startsAt) : input.startsAt,
      endsAt: input.endsAt ? new Date(input.endsAt) : input.endsAt,
    });
    res.json({ data: slide });
  }),
);

adminCmsRouter.delete(
  '/hero-slides/:id',
  authenticate,
  requirePermission(PERMISSIONS.CMS_WRITE),
  asyncHandler(async (req, res) => {
    await cmsService.deleteHeroSlide(param(req.params.id));
    res.status(204).send();
  }),
);

adminCmsRouter.get(
  '/pages',
  authenticate,
  requirePermission(PERMISSIONS.CMS_READ),
  asyncHandler(async (_req, res) => {
    res.json({ data: await cmsService.listPages() });
  }),
);

adminCmsRouter.post(
  '/pages',
  authenticate,
  requirePermission(PERMISSIONS.CMS_WRITE),
  asyncHandler(async (req, res) => {
    const input = createCmsPageSchema.parse(req.body);
    const page = await cmsService.createPage(input);
    res.status(201).json({ data: page });
  }),
);

adminCmsRouter.patch(
  '/pages/:id',
  authenticate,
  requirePermission(PERMISSIONS.CMS_WRITE),
  asyncHandler(async (req, res) => {
    const input = updateCmsPageSchema.parse(req.body);
    const page = await cmsService.updatePage(param(req.params.id), input);
    res.json({ data: page });
  }),
);

adminCmsRouter.delete(
  '/pages/:id',
  authenticate,
  requirePermission(PERMISSIONS.CMS_WRITE),
  asyncHandler(async (req, res) => {
    await cmsService.deletePage(param(req.params.id));
    res.status(204).send();
  }),
);

adminCmsRouter.get(
  '/faqs',
  authenticate,
  requirePermission(PERMISSIONS.CMS_READ),
  asyncHandler(async (_req, res) => {
    res.json({ data: await cmsService.listFaqs() });
  }),
);

adminCmsRouter.post(
  '/faqs',
  authenticate,
  requirePermission(PERMISSIONS.CMS_WRITE),
  asyncHandler(async (req, res) => {
    const input = createFaqSchema.parse(req.body);
    const faq = await cmsService.createFaq(input);
    res.status(201).json({ data: faq });
  }),
);

adminCmsRouter.delete(
  '/faqs/:id',
  authenticate,
  requirePermission(PERMISSIONS.CMS_WRITE),
  asyncHandler(async (req, res) => {
    await cmsService.deleteFaq(param(req.params.id));
    res.status(204).send();
  }),
);

adminCmsRouter.get(
  '/blog',
  authenticate,
  requirePermission(PERMISSIONS.CMS_READ),
  asyncHandler(async (_req, res) => {
    res.json({ data: await cmsService.listBlogPostsAdmin() });
  }),
);

adminCmsRouter.post(
  '/blog',
  authenticate,
  requirePermission(PERMISSIONS.CMS_WRITE),
  asyncHandler(async (req, res) => {
    const input = createBlogPostSchema.parse(req.body);
    const post = await cmsService.createBlogPost(input);
    res.status(201).json({ data: post });
  }),
);

adminCmsRouter.patch(
  '/blog/:id',
  authenticate,
  requirePermission(PERMISSIONS.CMS_WRITE),
  asyncHandler(async (req, res) => {
    const input = updateBlogPostSchema.parse(req.body);
    const post = await cmsService.updateBlogPost(param(req.params.id), input);
    res.json({ data: post });
  }),
);

adminCmsRouter.delete(
  '/blog/:id',
  authenticate,
  requirePermission(PERMISSIONS.CMS_WRITE),
  asyncHandler(async (req, res) => {
    await cmsService.deleteBlogPost(param(req.params.id));
    res.status(204).send();
  }),
);

adminCmsRouter.put(
  '/sections/:key',
  authenticate,
  requirePermission(PERMISSIONS.CMS_WRITE),
  asyncHandler(async (req, res) => {
    const input = updateCmsSectionSchema.parse(req.body);
    const section = await cmsService.upsertSection(param(req.params.key), input.payload, input.isActive ?? true);
    res.json({ data: section });
  }),
);
