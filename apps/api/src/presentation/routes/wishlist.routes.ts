import { Router } from 'express';
import { z } from 'zod';
import { wishlistService } from '../../application/services/wishlist.service.js';
import {
  asyncHandler,
  authenticate,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware.js';
import { param } from '../../shared/params.js';

export const wishlistRouter = Router();

wishlistRouter.use(authenticate);

wishlistRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user!;
    const data = await wishlistService.get(user.sub);
    res.json({ data });
  }),
);

wishlistRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { productId } = z.object({ productId: z.string().uuid() }).parse(req.body);
    const user = (req as AuthenticatedRequest).user!;
    const data = await wishlistService.add(user.sub, productId);
    res.json({ data });
  }),
);

wishlistRouter.post(
  '/toggle',
  asyncHandler(async (req, res) => {
    const { productId } = z.object({ productId: z.string().uuid() }).parse(req.body);
    const user = (req as AuthenticatedRequest).user!;
    const data = await wishlistService.toggle(user.sub, productId);
    res.json({ data });
  }),
);

wishlistRouter.get(
  '/check/:productId',
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user!;
    const inWishlist = await wishlistService.isInWishlist(user.sub, param(req.params.productId));
    res.json({ data: { inWishlist } });
  }),
);

wishlistRouter.delete(
  '/:productId',
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user!;
    const data = await wishlistService.remove(user.sub, param(req.params.productId));
    res.json({ data });
  }),
);
