import { z } from 'zod';

/** Accept 0 explicitly (free shipping for a zone). Avoid truthy checks on flatRate. */
const nonNegativeMoney = z.coerce.number().min(0).max(9999);

export const updateShippingRateSchema = z.object({
  flatRate: nonNegativeMoney,
});

export const updateShippingZoneSchema = z
  .object({
    isActive: z.boolean().optional(),
    nameAr: z.string().min(1).max(100).optional(),
    nameEn: z.string().min(1).max(100).optional(),
    flatRate: nonNegativeMoney.optional(),
  })
  .refine(
    (data) =>
      data.flatRate !== undefined ||
      data.isActive !== undefined ||
      data.nameAr !== undefined ||
      data.nameEn !== undefined,
    { message: 'يجب تعديل حقل واحد على الأقل' },
  );

export const updateShippingSettingsSchema = z.object({
  freeShippingThreshold: z.coerce.number().min(0).max(100000),
});

export type UpdateShippingRateInput = z.infer<typeof updateShippingRateSchema>;
export type UpdateShippingZoneInput = z.infer<typeof updateShippingZoneSchema>;
export type UpdateShippingSettingsInput = z.infer<typeof updateShippingSettingsSchema>;
