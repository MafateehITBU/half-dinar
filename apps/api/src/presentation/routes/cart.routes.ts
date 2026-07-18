import { Router } from 'express';
import { addCartItemSchema, updateCartItemSchema } from '@half-dinar/shared';
import { cartService } from '../../application/services/cart.service.js';
import {
  asyncHandler,
  authenticate,
  optionalAuthenticate,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware.js';
import { param } from '../../shared/params.js';
import {
  attachCartTokenHeader,
  resolveCartContext,
  type CartRequest,
} from '../middleware/cart.middleware.js';

export const cartRouter = Router();

cartRouter.use(resolveCartContext, attachCartTokenHeader, optionalAuthenticate);

cartRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    const { cartToken } = req as CartRequest;
    const cart = await cartService.getCart(user?.sub, user ? undefined : cartToken);
    res.json({ data: cart });
  }),
);

cartRouter.post(
  '/items',
  asyncHandler(async (req, res) => {
    const input = addCartItemSchema.parse(req.body);
    const { user } = req as AuthenticatedRequest;
    const { cartToken } = req as CartRequest;
    const cart = await cartService.addItem(
      input,
      user?.sub,
      user ? undefined : cartToken,
    );
    res.json({ data: cart });
  }),
);

cartRouter.patch(
  '/items/:type/:id',
  asyncHandler(async (req, res) => {
    const input = updateCartItemSchema.parse(req.body);
    const { user } = req as AuthenticatedRequest;
    const { cartToken } = req as CartRequest;
    const type = param(req.params.type);
    const id = param(req.params.id);
    const ref = type === 'package' ? { packageId: id } : { productId: id };
    const cart = await cartService.updateItem(ref, input.quantity, user?.sub, user ? undefined : cartToken);
    res.json({ data: cart });
  }),
);

cartRouter.delete(
  '/items/:type/:id',
  asyncHandler(async (req, res) => {
    const { user } = req as AuthenticatedRequest;
    const { cartToken } = req as CartRequest;
    const type = param(req.params.type);
    const id = param(req.params.id);
    const ref = type === 'package' ? { packageId: id } : { productId: id };
    const cart = await cartService.removeItem(ref, user?.sub, user ? undefined : cartToken);
    res.json({ data: cart });
  }),
);

cartRouter.post(
  '/merge',
  authenticate,
  asyncHandler(async (req, res) => {
    const { cartToken } = req as CartRequest;
    if (!cartToken) {
      res.json({ data: await cartService.getCart((req as AuthenticatedRequest).user!.sub) });
      return;
    }
    const cart = await cartService.mergeGuestIntoUser(
      (req as AuthenticatedRequest).user!.sub,
      cartToken,
    );
    res.json({ data: cart });
  }),
);
