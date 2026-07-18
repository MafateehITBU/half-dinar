import { Router } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@half-dinar/shared';
import { authService } from '../../application/services/auth.service.js';
import {
  asyncHandler,
  authenticate,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    res.status(201).json(result);
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input.email, input.password);
    res.json(result);
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const input = refreshTokenSchema.parse(req.body);
    const result = await authService.refresh(input.refreshToken);
    res.json(result);
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const input = refreshTokenSchema.parse(req.body);
    await authService.logout(input.refreshToken);
    res.status(204).send();
  }),
);

authRouter.post(
  '/verify-email',
  asyncHandler(async (req, res) => {
    const input = verifyEmailSchema.parse(req.body);
    await authService.verifyEmail(input.token);
    res.json({ message: 'Email verified successfully' });
  }),
);

authRouter.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const input = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(input.email);
    res.json({ message: 'If the email exists, a reset link has been sent' });
  }),
);

authRouter.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const input = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(input.token, input.password);
    res.json({ message: 'Password reset successfully' });
  }),
);

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.getMe((req as AuthenticatedRequest).user!.sub);
    res.json({ user });
  }),
);
