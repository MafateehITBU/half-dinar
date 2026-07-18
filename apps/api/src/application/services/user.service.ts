import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { changePasswordSchema } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { authService } from './auth.service.js';

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  locale: z.enum(['ar', 'en']).optional(),
});

export const userService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        locale: true,
        referralCode: true,
        emailVerifiedAt: true,
        createdAt: true,
        loyaltyAccount: { select: { pointsBalance: true } },
        addresses: { orderBy: { isDefault: 'desc' } },
      },
    });
    if (!user) throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');
    return {
      ...user,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      pointsBalance: user.loyaltyAccount?.pointsBalance ?? 0,
      addresses: user.addresses,
      loyaltyAccount: undefined,
    };
  },

  async updateProfile(userId: string, input: z.infer<typeof updateProfileSchema>) {
    const data = updateProfileSchema.parse(input);
    await prisma.user.update({
      where: { id: userId },
      data,
    });
    return authService.getMe(userId);
  },

  async changePassword(userId: string, input: z.infer<typeof changePasswordSchema>) {
    const { currentPassword, newPassword } = changePasswordSchema.parse(input);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'كلمة المرور الحالية غير صحيحة');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },

  updateProfileSchema,
  changePasswordSchema,
};
