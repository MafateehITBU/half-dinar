import { Router } from 'express';
import {
  changePasswordSchema,
  createAddressSchema,
  updateAddressSchema,
} from '@half-dinar/shared';
import { addressService } from '../../application/services/address.service.js';
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

usersRouter.get(
  '/me/addresses',
  asyncHandler(async (req, res) => {
    const data = await addressService.list((req as AuthenticatedRequest).user!.sub);
    res.json({ data });
  }),
);

usersRouter.post(
  '/me/addresses',
  asyncHandler(async (req, res) => {
    const input = createAddressSchema.parse(req.body);
    const data = await addressService.create((req as AuthenticatedRequest).user!.sub, input);
    res.status(201).json({ data });
  }),
);

usersRouter.patch(
  '/me/addresses/:id',
  asyncHandler(async (req, res) => {
    const input = updateAddressSchema.parse(req.body);
    const data = await addressService.update(
      (req as AuthenticatedRequest).user!.sub,
      String(req.params.id),
      input,
    );
    res.json({ data });
  }),
);

usersRouter.delete(
  '/me/addresses/:id',
  asyncHandler(async (req, res) => {
    await addressService.remove((req as AuthenticatedRequest).user!.sub, String(req.params.id));
    res.status(204).send();
  }),
);

usersRouter.post(
  '/me/addresses/:id/default',
  asyncHandler(async (req, res) => {
    const data = await addressService.setDefault(
      (req as AuthenticatedRequest).user!.sub,
      String(req.params.id),
    );
    res.json({ data });
  }),
);
