import { Router } from 'express';
import { checkoutService } from '../../application/services/checkout.service.js';
import { asyncHandler } from '../middleware/auth.middleware.js';

export const webhooksRouter = Router();

webhooksRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const signature =
      typeof req.headers.signature === 'string'
        ? req.headers.signature
        : typeof req.headers['Signature'] === 'string'
          ? (req.headers['Signature'] as string)
          : undefined;

    await checkoutService.handlePaytabsCallback(req.body as Buffer, signature);
    res.json({ received: true });
  }),
);
