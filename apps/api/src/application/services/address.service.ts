import {
  createAddressSchema,
  updateAddressSchema,
  type CreateAddressInput,
  type UpdateAddressInput,
} from '@half-dinar/shared';
import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';

export const addressService = {
  async list(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    });
  },

  async create(userId: string, raw: CreateAddressInput) {
    const input = createAddressSchema.parse(raw);
    const count = await prisma.address.count({ where: { userId } });
    const makeDefault = input.isDefault === true || count === 0;

    return prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          userId,
          label: input.label,
          governorate: input.governorate,
          city: input.city,
          street: input.street,
          building: input.building,
          phone: input.phone,
          isDefault: makeDefault,
        },
      });
    });
  },

  async update(userId: string, addressId: string, raw: UpdateAddressInput) {
    const input = updateAddressSchema.parse(raw);
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Address not found');

    return prisma.$transaction(async (tx) => {
      if (input.isDefault === true) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id: addressId },
        data: {
          ...(input.label !== undefined ? { label: input.label } : {}),
          ...(input.governorate !== undefined ? { governorate: input.governorate } : {}),
          ...(input.city !== undefined ? { city: input.city } : {}),
          ...(input.street !== undefined ? { street: input.street } : {}),
          ...(input.building !== undefined ? { building: input.building } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        },
      });
    });
  },

  async remove(userId: string, addressId: string) {
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Address not found');

    await prisma.address.delete({ where: { id: addressId } });

    if (existing.isDefault) {
      const next = await prisma.address.findFirst({
        where: { userId },
        orderBy: { id: 'asc' },
      });
      if (next) {
        await prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  },

  async setDefault(userId: string, addressId: string) {
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Address not found');

    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);

    return prisma.address.findUniqueOrThrow({ where: { id: addressId } });
  },
};
