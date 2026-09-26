import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import type { AuthResponse, AuthUser } from '@half-dinar/shared';
import { ROLES } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { emailService } from './email.service.js';

type UserWithRoles = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  locale: 'ar' | 'en';
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
  isActive: boolean;
  roles: Array<{
    role: {
      slug: string;
      permissions: Array<{ permission: { slug: string } }>;
    };
  }>;
};

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateReferralCode(): string {
  return nanoid(8).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
}

export function toAuthUser(user: UserWithRoles): AuthUser {
  const roles = user.roles.map((ur) => ur.role.slug);
  const permissionSet = new Set<string>();
  for (const ur of user.roles) {
    if (ur.role.slug === ROLES.SUPER_ADMIN) {
      ur.role.permissions.forEach((rp) => permissionSet.add(rp.permission.slug));
    } else {
      ur.role.permissions.forEach((rp) => permissionSet.add(rp.permission.slug));
    }
  }
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    locale: user.locale,
    roles,
    permissions: Array.from(permissionSet),
  };
}

async function loadUserWithRoles(userId: string): Promise<UserWithRoles | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });
}

async function issueTokens(user: UserWithRoles): Promise<AuthResponse> {
  const authUser = toAuthUser(user);
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, roles: authUser.roles },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );

  const refreshToken = nanoid(64);
  const refreshHash = hashToken(refreshToken);
  const refreshExpiresMs = parseDuration(env.JWT_REFRESH_EXPIRES_IN);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refreshHash,
      expiresAt: new Date(Date.now() + refreshExpiresMs),
    },
  });

  const expiresIn = parseDuration(env.JWT_ACCESS_EXPIRES_IN) / 1000;

  return {
    user: authUser,
    tokens: { accessToken, refreshToken, expiresIn },
  };
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] ?? 60000);
}

export const authService = {
  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    locale: 'ar' | 'en';
    ageConfirmed: boolean;
    referralCode?: string;
  }): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Email already registered');
    }

    let referredByUserId: string | undefined;
    if (input.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: input.referralCode.toUpperCase() },
      });
      if (!referrer) {
        throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid referral code');
      }
      referredByUserId = referrer.id;
    }

    const customerRole = await prisma.role.findUniqueOrThrow({
      where: { slug: ROLES.CUSTOMER },
    });

    const passwordHash = await bcrypt.hash(input.password, 12);
    let referralCode = generateReferralCode();
    while (await prisma.user.findUnique({ where: { referralCode } })) {
      referralCode = generateReferralCode();
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        locale: input.locale,
        ageConfirmed: input.ageConfirmed,
        referralCode,
        referredByUserId,
        roles: { create: { roleId: customerRole.id } },
        loyaltyAccount: { create: { pointsBalance: 0 } },
        wishlist: { create: {} },
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    const verifyToken = nanoid(48);
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(verifyToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    if (referredByUserId) {
      await prisma.referral.create({
        data: {
          referrerId: referredByUserId,
          refereeId: user.id,
          status: 'registered',
        },
      });
    }

    await emailService.sendWelcome(user.email, user.firstName, verifyToken).catch(() => {});
    if (env.NODE_ENV === 'development' && !emailService.isConfigured()) {
      console.log(`[dev] Email verification token for ${user.email}: ${verifyToken}`);
    }

    return issueTokens(user);
  },

  async login(email: string, password: string, ip = 'unknown'): Promise<AuthResponse> {
    const { assertNotLocked, clearLoginFailures, recordLoginFailure } = await import(
      './login-lockout.service.js'
    );
    await assertNotLocked(email);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      await recordLoginFailure(email, ip);
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new AppError(
        401,
        ErrorCodes.UNAUTHORIZED,
        'هذا الحساب يستخدم تسجيل الدخول عبر Google',
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await recordLoginFailure(email, ip);
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid email or password');
    }

    await clearLoginFailures(email, ip);
    return issueTokens(user);
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const tokenHash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!stored) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await loadUserWithRoles(stored.userId);
    if (!user || !user.isActive) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'User not found or inactive');
    }

    return issueTokens(user);
  },

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { emailVerifiedAt: true } } },
    });

    if (!record) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid or expired verification token');
    }

    if (record.user.emailVerifiedAt) {
      await prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } });
      return;
    }

    if (record.expiresAt < new Date()) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid or expired verification token');
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      });
      await tx.emailVerificationToken.deleteMany({ where: { userId: record.userId } });
    });
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const token = nanoid(48);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await emailService.sendPasswordReset(email, token).catch(() => {});
    if (env.NODE_ENV === 'development' && !emailService.isConfigured()) {
      console.log(`[dev] Password reset token for ${email}: ${token}`);
    }
  },

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = hashToken(token);
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate unused reset tokens for this user
      prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null, id: { not: record.id } },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh sessions after password change
      prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  },

  async getMe(userId: string): Promise<AuthUser> {
    const user = await loadUserWithRoles(userId);
    if (!user) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'User not found');
    }
    return toAuthUser(user);
  },

  async loginWithGoogle(idToken: string, referralCode?: string): Promise<AuthResponse> {
    if (!env.isGoogleAuthConfigured) {
      throw new AppError(503, ErrorCodes.INTERNAL_ERROR, 'Google Sign-In is not configured');
    }

    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(env.googleClientId);
    let payload: {
      sub?: string;
      email?: string;
      email_verified?: boolean | string;
      given_name?: string;
      family_name?: string;
      name?: string;
    };
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: env.googleClientId,
      });
      payload = ticket.getPayload() ?? {};
    } catch {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'رمز Google غير صالح');
    }

    const googleSub = payload.sub;
    const email = payload.email?.toLowerCase().trim();
    if (!googleSub || !email) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'تعذر قراءة بيانات Google');
    }

    const emailVerified =
      payload.email_verified === true || payload.email_verified === 'true';
    if (!emailVerified) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'بريد Google غير مفعّل');
    }

    const given = (payload.given_name || '').trim();
    const family = (payload.family_name || '').trim();
    const full = (payload.name || '').trim();
    let firstName = given || full.split(/\s+/)[0] || 'مستخدم';
    let lastName = family || full.split(/\s+/).slice(1).join(' ') || '';

    let user = await prisma.user.findFirst({
      where: { googleSub },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      const byEmail = await prisma.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: { include: { permission: true } },
                },
              },
            },
          },
        },
      });
      if (byEmail) {
        // Do not hijack an unverified password account (attacker could have registered first)
        if (byEmail.passwordHash && !byEmail.emailVerifiedAt) {
          throw new AppError(
            409,
            ErrorCodes.CONFLICT,
            'هذا البريد مسجّل مسبقاً ولم يُفعَّل. سجّل الدخول بكلمة المرور أو أكمل تفعيل البريد قبل ربط Google',
          );
        }
        user = byEmail;
      }
    }

    if (user) {
      if (!user.isActive) {
        throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'الحساب غير نشط');
      }
      const data: { googleSub?: string; emailVerifiedAt?: Date; firstName?: string; lastName?: string } =
        {};
      if (!user.googleSub) data.googleSub = googleSub;
      if (!user.emailVerifiedAt) data.emailVerifiedAt = new Date();
      if (!user.firstName && firstName) data.firstName = firstName;
      if (!user.lastName && lastName) data.lastName = lastName;
      if (Object.keys(data).length) {
        user = await prisma.user.update({
          where: { id: user.id },
          data,
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        });
      }
      return issueTokens(user);
    }

    const customerRole = await prisma.role.findUniqueOrThrow({
      where: { slug: ROLES.CUSTOMER },
    });

    let referredByUserId: string | undefined;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.toUpperCase() },
      });
      if (referrer) referredByUserId = referrer.id;
    }

    let ownReferral = generateReferralCode();
    while (await prisma.user.findUnique({ where: { referralCode: ownReferral } })) {
      ownReferral = generateReferralCode();
    }

    user = await prisma.user.create({
      data: {
        email,
        passwordHash: null,
        googleSub,
        firstName,
        lastName,
        locale: 'ar',
        ageConfirmed: true,
        emailVerifiedAt: new Date(),
        referralCode: ownReferral,
        referredByUserId,
        roles: { create: { roleId: customerRole.id } },
        loyaltyAccount: { create: { pointsBalance: 0 } },
        wishlist: { create: {} },
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (referredByUserId) {
      await prisma.referral.create({
        data: {
          referrerId: referredByUserId,
          refereeId: user.id,
          status: 'registered',
        },
      });
    }

    await emailService.sendWelcome(user.email, user.firstName).catch(() => {});
    return issueTokens(user);
  },
};
