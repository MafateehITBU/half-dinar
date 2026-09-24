import { Router, type Request, type Response } from 'express';
import {
  checkoutQuoteSchema,
  placeOrderSchema,
  mepsConfirmSchema,
  validateCouponSchema,
} from '@half-dinar/shared';
import { checkoutService } from '../../application/services/checkout.service.js';
import { shippingService } from '../../application/services/shipping.service.js';
import { promotionService } from '../../application/services/promotion.service.js';
import { cartService } from '../../application/services/cart.service.js';
import { env } from '../../config/env.js';
import {
  asyncHandler,
  authenticate,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware.js';
import { checkoutLimiter } from '../middleware/rate-limit.middleware.js';

export const checkoutRouter = Router();

/**
 * PayTabs/MEPS posts the customer back to `return` as POST (form body).
 * SPA static hosting only accepts GET → 405. This public bridge reads cart_id
 * and 303-redirects to the storefront return page as GET.
 */
function paytabsReturnBridge(req: Request, res: Response) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const query = req.query as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = body[k] ?? query[k];
      if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  };

  const cartId = pick('cart_id', 'cartId', 'cartID');
  const tranRef = pick('tran_ref', 'tranRef');
  const respStatus = pick('respStatus', 'response_status', 'resp_status');

  const qs = new URLSearchParams();
  if (cartId) qs.set('cart_id', cartId);
  if (tranRef) qs.set('tran_ref', tranRef);
  if (respStatus) qs.set('respStatus', respStatus);

  const target = `${env.storefrontUrl.replace(/\/$/, '')}/checkout/meps/return${
    qs.toString() ? `?${qs.toString()}` : ''
  }`;
  res.redirect(303, target);
}

checkoutRouter.get('/meps/return', paytabsReturnBridge);
checkoutRouter.post('/meps/return', paytabsReturnBridge);

checkoutRouter.use(authenticate);
checkoutRouter.use(checkoutLimiter);

checkoutRouter.get(
  '/shipping-zones',
  asyncHandler(async (_req, res) => {
    const zones = await shippingService.listZones();
    res.json({ data: zones });
  }),
);

checkoutRouter.post(
  '/quote',
  asyncHandler(async (req, res) => {
    const input = checkoutQuoteSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).user!.sub;
    const quote = await checkoutService.getQuote(
      userId,
      input.governorateCode,
      input.couponCode,
      input.loyaltyPointsToUse,
    );
    res.json({ data: quote });
  }),
);

checkoutRouter.post(
  '/validate-coupon',
  asyncHandler(async (req, res) => {
    const input = validateCouponSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).user!.sub;
    const cart = await cartService.getCart(userId);
    const { shippingAmount } = await shippingService.calculateShipping(
      input.governorateCode,
      cart.subtotal,
    );
    const result = await promotionService.validateCoupon(input.code, userId, cart, shippingAmount);
    res.json({
      data: {
        ...result,
        subtotal: cart.subtotal,
        total: cart.subtotal + result.shippingAmount - result.discountAmount,
      },
    });
  }),
);

checkoutRouter.post(
  '/place-order',
  asyncHandler(async (req, res) => {
    const input = placeOrderSchema.parse(req.body);
    const result = await checkoutService.placeOrder((req as AuthenticatedRequest).user!.sub, input);
    res.status(201).json({ data: result });
  }),
);

checkoutRouter.post(
  '/meps/confirm',
  asyncHandler(async (req, res) => {
    const input = mepsConfirmSchema.parse(req.body);
    const order = await checkoutService.confirmMepsPayment(
      input.orderId,
      (req as AuthenticatedRequest).user!.sub,
    );
    res.json({ data: order });
  }),
);
