import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().min(3).max(50),
  type: z.enum(['percent', 'fixed', 'free_shipping']),
  value: z.coerce.number().positive(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  perUserLimit: z.coerce.number().int().positive().default(1),
  minOrderValue: z.coerce.number().positive().optional().nullable(),
  isActive: z.boolean().default(true),
  categoryIds: z.array(z.string().uuid()).optional(),
  productIds: z.array(z.string().uuid()).optional(),
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  governorateCode: z.string().min(1),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['flash', 'seasonal', 'holiday']).default('flash'),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  isActive: z.boolean().default(true),
  productIds: z.array(z.string().uuid()).optional(),
  discountPercent: z.coerce.number().min(1).max(100).optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
