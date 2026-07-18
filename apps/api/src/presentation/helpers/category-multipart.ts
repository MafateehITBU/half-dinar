import { createCategorySchema, type CreateCategoryInput } from '@half-dinar/shared';

export function parseCreateCategoryMultipart(body: Record<string, string>): CreateCategoryInput {
  return createCategorySchema.parse({
    nameAr: body.nameAr,
    nameEn: body.nameEn,
    descriptionAr: body.descriptionAr || undefined,
    descriptionEn: body.descriptionEn || undefined,
    parentId: body.parentId && body.parentId !== '' ? body.parentId : null,
    icon: body.icon && body.icon !== '' ? body.icon : null,
    sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
    isActive: body.isActive !== 'false',
  });
}
