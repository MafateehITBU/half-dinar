import { Router } from 'express';
import { changePasswordSchema } from '@half-dinar/shared';
import { userService } from '../../application/services/user.service.js';
import {
  asyncHandler,
  authenticate,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware.js';

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const profile = await userService.getProfile((req as AuthenticatedRequest).user!.sub);
    res.json({ data: profile });
  }),
);

usersRouter.patch(
  '/me',
  asyncHandler(async (req, res) => {
    const input = userService.updateProfileSchema.parse(req.body);
    const user = await userService.updateProfile((req as AuthenticatedRequest).user!.sub, input);
    res.json({ data: user });
  }),
);

usersRouter.patch(
  '/me/password',
  asyncHandler(async (req, res) => {
    const input = changePasswordSchema.parse(req.body);
    await userService.changePassword((req as AuthenticatedRequest).user!.sub, input);
    res.json({ message: 'Password updated successfully' });
  }),
);
