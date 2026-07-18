import { createPackageSchema, type CreatePackageInput } from '@half-dinar/shared';

export function parseCreatePackageMultipart(body: Record<string, string>): CreatePackageInput {
  const items = body.items ? JSON.parse(body.items) : [];
  return createPackageSchema.parse({
    nameAr: body.nameAr,
    nameEn: body.nameEn,
    descriptionAr: body.descriptionAr || undefined,
    descriptionEn: body.descriptionEn || undefined,
    price: body.price,
    isActive: body.isActive !== 'false',
    items,
  });
}
