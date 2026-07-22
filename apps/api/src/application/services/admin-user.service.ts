import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import type { AdminCreateUserInput, AdminUpdateUserInput, AdminUserListQuery } from '@half-dinar/shared';
import { ROLES } from '@half-dinar/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import crypto from 'crypto';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateReferralCode(): string {
  return nanoid(8).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
}

function mapUser(
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    locale: 'ar' | 'en';
    isActive: boolean;
    emailVerifiedAt: Date | null;
    createdAt: Date;
    roles: Array<{ role: { slug: string } }>;
    _count: { orders: number };
  },
) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    locale: user.locale,
    isActive: user.isActive,
    emailVerified: Boolean(user.emailVerifiedAt),
    roles: user.roles.map((r) => r.role.slug),
    orderCount: user._count.orders,
    createdAt: user.createdAt.toISOString(),
  };
}

async function resolveRoleIds(slugs: string[]): Promise<string[]> {
  const roles = await prisma.role.findMany({ where: { slug: { in: slugs } } });
  if (roles.length !== slugs.length) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'One or more roles are invalid');
  }
  return roles.map((r) => r.id);
}

/** Sales/customers:write may only assign customer. Staff roles require USERS_WRITE (Super Admin). */
function normalizeAssignableRoles(requested: string[], actorRoles: string[]): string[] {
  const actorIsSuper = actorRoles.includes(ROLES.SUPER_ADMIN);
  const unique = [...new Set(requested)];

  if (unique.includes(ROLES.SUPER_ADMIN) && !actorIsSuper) {
    throw new AppError(403, ErrorCodes.FORBIDDEN, 'Only Super Admin can assign Super Admin');
  }

  const staffRoles = unique.filter((r) => r !== ROLES.CUSTOMER);
  if (staffRoles.length > 0 && !actorIsSuper) {
    throw new AppError(403, ErrorCodes.FORBIDDEN, 'Only Super Admin can assign staff roles');
  }

  return unique.length ? unique : [ROLES.CUSTOMER];
}

export const adminUserService = {
  async list(query: AdminUserListQuery) {
    const { page, limit, search, role, active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;

    if (role === 'customer') {
      where.roles = { some: { role: { slug: ROLES.CUSTOMER } } };
    } else if (role === 'staff') {
      where.roles = { some: { role: { slug: { not: ROLES.CUSTOMER } } } };
    }

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          roles: { include: { role: true } },
          _count: { select: { orders: true } },
        },
      }),
    ]);

    return {
      data: users.map(mapUser),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        _count: { select: { orders: true } },
      },
    });
    if (!user) throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');
    return mapUser(user);
  },

  async create(input: AdminCreateUserInput, actorRoles: string[] = []) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Email already registered');
    }

    const roles = normalizeAssignableRoles(input.roles, actorRoles);
    const roleIds = await resolveRoleIds(roles);
    const passwordHash = await bcrypt.hash(input.password, 12);
    let referralCode = generateReferralCode();
    while (await prisma.user.findUnique({ where: { referralCode } })) {
      referralCode = generateReferralCode();
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          locale: input.locale,
          isActive: input.isActive,
          ageConfirmed: true,
          referralCode,
          emailVerifiedAt: input.emailVerified ? new Date() : null,
          roles: { create: roleIds.map((roleId) => ({ roleId })) },
          loyaltyAccount: { create: { pointsBalance: 0 } },
          wishlist: { create: {} },
        },
        include: {
          roles: { include: { role: true } },
          _count: { select: { orders: true } },
        },
      });
      return created;
    });

    return mapUser(user);
  },

  async update(id: string, input: AdminUpdateUserInput, actorRoles: string[] = []) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });
    if (!user) throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');

    if (input.email && input.email !== user.email) {
      const dup = await prisma.user.findUnique({ where: { email: input.email } });
      if (dup) throw new AppError(409, ErrorCodes.CONFLICT, 'Email already in use');
    }

    const data: Parameters<typeof prisma.user.update>[0]['data'] = {};
    if (input.email) data.email = input.email;
    if (input.firstName) data.firstName = input.firstName;
    if (input.lastName) data.lastName = input.lastName;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.locale) data.locale = input.locale;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.emailVerified !== undefined) {
      data.emailVerifiedAt = input.emailVerified ? new Date() : null;
    }
    if (input.password) {
      data.passwordHash = await bcrypt.hash(input.password, 12);
    }

    await prisma.$transaction(async (tx) => {
      if (input.roles) {
        const roles = normalizeAssignableRoles(input.roles, actorRoles);
        const roleIds = await resolveRoleIds(roles);
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }
      await tx.user.update({ where: { id }, data });
      if (input.password) {
        await tx.refreshToken.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    });

    return this.getById(id);
  },

  async remove(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');

    const isSuperAdmin = user.roles.some((r) => r.role.slug === ROLES.SUPER_ADMIN);
    if (isSuperAdmin) {
      throw new AppError(403, ErrorCodes.FORBIDDEN, 'Cannot deactivate super admin');
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async resendVerification(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');
    if (user.emailVerifiedAt) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Email already verified');
    }

    const verifyToken = nanoid(48);
    await prisma.emailVerificationToken.deleteMany({ where: { userId: id } });
    await prisma.emailVerificationToken.create({
      data: {
        userId: id,
        tokenHash: hashToken(verifyToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return { verifyToken };
  },

  async listRoles() {
    const roles = await prisma.role.findMany({ orderBy: { slug: 'asc' } });
    return roles.map((r) => ({ id: r.id, slug: r.slug, nameAr: r.nameAr, nameEn: r.nameEn }));
  },
};
