import { Router } from 'express';
import { seoService } from '../../application/services/seo.service.js';
import { asyncHandler } from '../middleware/auth.middleware.js';
import { param } from '../../shared/params.js';

export const seoRouter = Router();

seoRouter.get(
  '/robots.txt',
  asyncHandler(async (_req, res) => {
    res.type('text/plain').send(seoService.robotsTxt());
  }),
);

seoRouter.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const xml = await seoService.sitemapXml();
    res.type('application/xml').send(xml);
  }),
);

seoRouter.get(
  '/product/:slug/jsonld',
  asyncHandler(async (req, res) => {
    const data = await seoService.productJsonLd(param(req.params.slug));
    if (!data) {
      res.status(404).json({ error: { message: 'Product not found' } });
      return;
    }
    res.json({ data });
  }),
);
