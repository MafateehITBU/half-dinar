import { Router } from 'express';
import { referralService } from '../../application/services/referral.service.js';
import { asyncHandler, authenticate, type AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const referralRouter = Router();

referralRouter.use(authenticate);

referralRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = (req as AuthenticatedRequest).user!;
    const data = await referralService.getMyReferral(user.sub);
    res.json({ data });
  }),
);
