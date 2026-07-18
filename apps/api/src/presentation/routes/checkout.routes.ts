import { Router } from 'express';
import {
  checkoutQuoteSchema,
  placeOrderSchema,
  stripeConfirmSchema,
  validateCouponSchema,
} from '@half-dinar/shared';
import { checkoutService } from '../../application/services/checkout.service.js';
import { shippingService } from '../../application/services/shipping.service.js';
import { promotionService } from '../../application/services/promotion.service.js';
import { cartService } from '../../application/services/cart.service.js';
import {
  asyncHandler,
  authenticate,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware.js';

export const checkoutRouter = Router();

checkoutRouter.use(authenticate);

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
    const { zone, shippingAmount } = await shippingService.calculateShipping(
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
  '/stripe/confirm',
  asyncHandler(async (req, res) => {
    const input = stripeConfirmSchema.parse(req.body);
    const order = await checkoutService.confirmStripePayment(
      input.orderId,
      (req as AuthenticatedRequest).user!.sub,
      input.paymentIntentId,
    );
    res.json({ data: order });
  }),
);
