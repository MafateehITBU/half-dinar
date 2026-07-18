import { Router } from 'express';
import { productListQuerySchema } from '@half-dinar/shared';
import { searchService } from '../../application/services/search.service.js';
import { asyncHandler } from '../middleware/auth.middleware.js';

export const searchRouter = Router();

searchRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = productListQuerySchema.parse({ ...req.query, q: req.query.q ?? req.query.query });
    const result = await searchService.searchProducts(query);
    res.json(result);
  }),
);

searchRouter.get(
  '/suggest',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? '');
    const limit = Number(req.query.limit ?? 8);
    const suggestions = await searchService.suggest(q, limit);
    res.json({ data: suggestions });
  }),
);
