import { z } from 'zod';

/** Iconify icon id, e.g. mdi:home-outline */
export const categoryIconSchema = z
  .string()
  .max(128)
  .regex(/^[a-z0-9][a-z0-9-]*:[a-zA-Z0-9_.-]+$/, 'صيغة الأيقونة: mdi:home-outline')
  .nullable()
  .optional();

export const createCategorySchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  slug: z.string().min(2).max(120).optional(),
  nameAr: z.string().min(1).max(200),
  nameEn: z.string().min(1).max(200),
  descriptionAr: z.string().max(5000).optional(),
  descriptionEn: z.string().max(5000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  icon: categoryIconSchema,
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
