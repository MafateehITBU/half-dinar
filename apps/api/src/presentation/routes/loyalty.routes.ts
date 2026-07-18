import { Router } from 'express';
import { loyaltyService } from '../../application/services/loyalty.service.js';
import { asyncHandler, authenticate, type AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const loyaltyRouter = Router();

loyaltyRouter.use(authenticate);

loyaltyRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user!;
    const data = await loyaltyService.getAccount(user.sub);
    res.json({ data });
  }),
);
