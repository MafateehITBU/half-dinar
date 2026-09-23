import { z } from 'zod';

export const updateShippingRateSchema = z.object({
  flatRate: z.coerce.number().min(0).max(9999),
});

export const updateShippingZoneSchema = z.object({
  isActive: z.boolean().optional(),
  nameAr: z.string().min(1).max(100).optional(),
  nameEn: z.string().min(1).max(100).optional(),
  flatRate: z.coerce.number().min(0).max(9999).optional(),
});

export const updateShippingSettingsSchema = z.object({
  freeShippingThreshold: z.coerce.number().min(0).max(100000),
});

export type UpdateShippingRateInput = z.infer<typeof updateShippingRateSchema>;
export type UpdateShippingZoneInput = z.infer<typeof updateShippingZoneSchema>;
export type UpdateShippingSettingsInput = z.infer<typeof updateShippingSettingsSchema>;
