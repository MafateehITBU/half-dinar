import { z } from 'zod';
import { ROLES, SUPPORTED_LOCALES } from '../constants.js';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  role: z.enum(['all', 'customer', 'staff']).default('all'),
  active: z.enum(['all', 'true', 'false']).default('all'),
});

export const adminCreateUserSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(7).max(20).optional(),
  locale: z.enum(SUPPORTED_LOCALES).default('ar'),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  roles: z.array(z.string().min(1)).min(1).default([ROLES.CUSTOMER]),
});

export const adminUpdateUserSchema = z.object({
  email: z.string().email().optional(),
  password: passwordSchema.optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).nullable().optional(),
  locale: z.enum(SUPPORTED_LOCALES).optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  roles: z.array(z.string().min(1)).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
