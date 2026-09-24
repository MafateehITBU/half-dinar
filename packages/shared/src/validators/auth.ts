import { z } from 'zod';
import { SUPPORTED_LOCALES } from '../constants.js';

/** Easier signup for mobile: 8+ chars, letter + number (no special char required). */
export const passwordSchema = z
  .string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .regex(/[A-Za-z\u0600-\u06FF]/, 'كلمة المرور يجب أن تحتوي على حرف')
  .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم');

export const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).default(''),
  phone: z.string().min(7).max(20).optional(),
  locale: z.enum(SUPPORTED_LOCALES).default('ar'),
  ageConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm you are 13 or older' }),
  }),
  referralCode: z.string().min(4).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(20),
  referralCode: z.string().min(4).max(20).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
