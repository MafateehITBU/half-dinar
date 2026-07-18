import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z
    .string()
    .max(80)
    .optional()
    .transform((s) => (s?.trim() ? s.trim() : undefined)),
  slug: z.string().min(2).max(200).optional(),
  nameAr: z.string().min(1).max(300),
  nameEn: z.string().min(1).max(300),
  descriptionAr: z.string().max(10000).optional(),
  descriptionEn: z.string().max(10000).optional(),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional().nullable(),
  categoryId: z.string().uuid(),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tagIds: z.array(z.string().uuid()).optional(),
  relatedProductIds: z.array(z.string().uuid()).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  metaTitleAr: z.string().max(200).optional(),
  metaTitleEn: z.string().max(200).optional(),
  metaDescriptionAr: z.string().max(500).optional(),
  metaDescriptionEn: z.string().max(500).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
  categorySlug: z.string().optional(),
  tags: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  inStock: z.enum(['true', 'false']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z
    .enum(['newest', 'popularity', 'bestSeller', 'priceAsc', 'priceDesc', 'rating'])
    .default('newest'),
  q: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
