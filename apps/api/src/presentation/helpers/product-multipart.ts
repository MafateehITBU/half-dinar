import { createProductSchema, type CreateProductInput } from '@half-dinar/shared';

/** Parse multipart form fields (all strings) into create product input. */
export function parseCreateProductMultipart(body: Record<string, string>): CreateProductInput {
  return createProductSchema.parse({
    sku: body.sku?.trim() || undefined,
    nameAr: body.nameAr,
    nameEn: body.nameEn,
    descriptionAr: body.descriptionAr || undefined,
    descriptionEn: body.descriptionEn || undefined,
    price: body.price,
    compareAtPrice: body.compareAtPrice || undefined,
    categoryId: body.categoryId,
    stockQuantity: body.stockQuantity ?? '0',
    lowStockThreshold: body.lowStockThreshold || undefined,
    isActive: body.isActive !== 'false',
    isFeatured: body.isFeatured === 'true',
    imageUrls: body.imageUrls ? JSON.parse(body.imageUrls) : undefined,
  });
}
