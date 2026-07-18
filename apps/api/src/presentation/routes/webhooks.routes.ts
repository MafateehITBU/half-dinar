import { Router } from 'express';
import { checkoutService } from '../../application/services/checkout.service.js';
import { asyncHandler } from '../middleware/auth.middleware.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';

export const webhooksRouter = Router();

webhooksRouter.post(
  '/stripe',
  asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Missing stripe-signature header');
    }

    await checkoutService.handleStripeWebhook(req.body as Buffer, signature);
    res.json({ received: true });
  }),
);
