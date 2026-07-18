import { z } from 'zod';

const packageItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const createPackageSchema = z.object({
  slug: z.string().min(2).max(120).optional(),
  nameAr: z.string().min(1).max(200),
  nameEn: z.string().min(1).max(200),
  descriptionAr: z.string().max(5000).optional(),
  descriptionEn: z.string().max(5000).optional(),
  imageUrl: z.string().url().optional(),
  price: z.coerce.number().positive(),
  isActive: z.boolean().default(true),
  items: z.array(packageItemSchema).min(1),
});

export const updatePackageSchema = createPackageSchema.partial();

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
