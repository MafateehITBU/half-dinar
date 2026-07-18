import type { ProductListQuery, CreateProductInput, UpdateProductInput } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { resolveProductImageUrl } from '../../shared/product-image.js';
import { decimalToNumber, uniqueSlug } from '../../shared/utils.js';
import { mapProductDetail, mapProductSummary } from './category.service.js';
import { applyCampaignToDetail, applyCampaignToSummaries } from './campaign-pricing.js';
import { promotionService } from './promotion.service.js';
import { searchService } from './search.service.js';

const productInclude = {
  category: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  tags: { include: { tag: true } },
};

const productDetailInclude = {
  ...productInclude,
  relationsFrom: {
    include: {
      relatedProduct: {
        include: productInclude,
      },
    },
  },
};

async function getCategoryIdsIncludingDescendants(categoryId: string): Promise<string[]> {
  const all = await prisma.category.findMany({ select: { id: true, parentId: true } });
  const ids = new Set<string>([categoryId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const cat of all) {
      if (cat.parentId && ids.has(cat.parentId) && !ids.has(cat.id)) {
        ids.add(cat.id);
        changed = true;
      }
    }
  }
  return Array.from(ids);
}

const MAX_PRODUCT_IMAGES = 10;

export { MAX_PRODUCT_IMAGES };

/** e.g. CLEAN-0001 from category slug, or NAO-0001 */
async function generateProductSku(categoryId: string): Promise<string> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { slug: true },
  });
  const prefix =
    (category?.slug ?? 'nao')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 10) || 'NAO';

  const inCategory = await prisma.product.findMany({
    where: { categoryId },
    select: { sku: true },
  });

  const re = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  let maxNum = 0;
  for (const p of inCategory) {
    const m = p.sku.match(re);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  }

  let n = maxNum + 1;
  let sku = `${prefix}-${String(n).padStart(4, '0')}`;
  while (await prisma.product.findUnique({ where: { sku } })) {
    n += 1;
    sku = `${prefix}-${String(n).padStart(4, '0')}`;
  }
  return sku;
}

export const productService = {
  async list(query: ProductListQuery) {
    const { page, limit, sort } = query;
    const skip = (page - 1) * limit;

    if (query.q) {
      return searchService.searchProducts(query);
    }

    const where: Record<string, unknown> = { isActive: true };

    if (query.categoryId) {
      where.categoryId = { in: await getCategoryIdsIncludingDescendants(query.categoryId) };
    } else if (query.categorySlug) {
      const cat = await prisma.category.findUnique({ where: { slug: query.categorySlug } });
      if (cat) {
        where.categoryId = { in: await getCategoryIdsIncludingDescendants(cat.id) };
      }
    }

    if (query.tags) {
      const tagSlugs = query.tags.split(',').map((t) => t.trim());
      where.tags = { some: { tag: { slug: { in: tagSlugs } } } };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    if (query.inStock === 'true') where.stockQuantity = { gt: 0 };
    if (query.inStock === 'false') where.stockQuantity = 0;
    if (query.featured === 'true') where.isFeatured = true;

    const orderBy = {
      newest: { createdAt: 'desc' as const },
      popularity: { soldCount: 'desc' as const },
      bestSeller: { soldCount: 'desc' as const },
      priceAsc: { price: 'asc' as const },
      priceDesc: { price: 'desc' as const },
      rating: { avgRating: 'desc' as const },
    }[sort];

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      data: applyCampaignToSummaries(
        products.map(mapProductSummary),
        await promotionService.getActiveCampaignPrices(),
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: productDetailInclude,
    });
    if (!product || !product.isActive) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Product not found');
    }
    const campaignPrices = await promotionService.getActiveCampaignPrices();
    return applyCampaignToDetail(mapProductDetail(product), campaignPrices);
  },

  async create(
    input: CreateProductInput,
    uploadedImages?: { url: string; publicId: string }[],
  ) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Category not found');

    const sku = input.sku ?? (await generateProductSku(input.categoryId));

    const skuExists = await prisma.product.findUnique({ where: { sku } });
    if (skuExists) throw new AppError(409, ErrorCodes.CONFLICT, 'SKU already exists');

    const slug =
      input.slug ??
      (await uniqueSlug(input.nameEn, async (s) => Boolean(await prisma.product.findUnique({ where: { slug: s } }))));

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sku,
          slug,
          nameAr: input.nameAr,
          nameEn: input.nameEn,
          descriptionAr: input.descriptionAr,
          descriptionEn: input.descriptionEn,
          price: input.price,
          compareAtPrice: input.compareAtPrice ?? null,
          categoryId: input.categoryId,
          stockQuantity: input.stockQuantity,
          lowStockThreshold: input.lowStockThreshold ?? null,
          isActive: input.isActive,
          isFeatured: input.isFeatured,
          metaTitleAr: input.metaTitleAr,
          metaTitleEn: input.metaTitleEn,
          metaDescriptionAr: input.metaDescriptionAr,
          metaDescriptionEn: input.metaDescriptionEn,
        },
      });

      const images = uploadedImages?.length
        ? uploadedImages
        : (input.imageUrls ?? []).map((url) => ({ url, publicId: undefined as string | undefined }));

      if (images.length) {
        await tx.productImage.createMany({
          data: images.map((img, i) => ({
            productId: created.id,
            url: img.url,
            cloudinaryPublicId: img.publicId ?? null,
            sortOrder: i,
          })),
        });
      }

      if (input.tagIds?.length) {
        await tx.productTag.createMany({
          data: input.tagIds.map((tagId) => ({ productId: created.id, tagId })),
          skipDuplicates: true,
        });
      }

      if (input.relatedProductIds?.length) {
        await tx.productRelation.createMany({
          data: input.relatedProductIds.map((relatedProductId) => ({
            productId: created.id,
            relatedProductId,
          })),
          skipDuplicates: true,
        });
      }

      if (input.stockQuantity > 0) {
        await tx.inventoryHistory.create({
          data: {
            productId: created.id,
            changeQty: input.stockQuantity,
            reason: 'restock',
          },
        });
      }

      return tx.product.findUniqueOrThrow({
        where: { id: created.id },
        include: productInclude,
      });
    });

    await searchService.indexProduct(product.id);
    return mapProductSummary(product);
  },

  async update(id: string, input: UpdateProductInput) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Product not found');

    if (input.sku && input.sku !== existing.sku) {
      const skuExists = await prisma.product.findUnique({ where: { sku: input.sku } });
      if (skuExists) throw new AppError(409, ErrorCodes.CONFLICT, 'SKU already exists');
    }

    let slug = input.slug;
    if (input.nameEn && !input.slug) {
      slug = await uniqueSlug(input.nameEn, async (s) => {
        const found = await prisma.product.findUnique({ where: { slug: s } });
        return Boolean(found && found.id !== id);
      });
    }

    const product = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          sku: input.sku,
          slug: slug ?? undefined,
          nameAr: input.nameAr,
          nameEn: input.nameEn,
          descriptionAr: input.descriptionAr,
          descriptionEn: input.descriptionEn,
          price: input.price,
          compareAtPrice: input.compareAtPrice,
          categoryId: input.categoryId,
          stockQuantity: input.stockQuantity,
          lowStockThreshold: input.lowStockThreshold,
          isActive: input.isActive,
          isFeatured: input.isFeatured,
          metaTitleAr: input.metaTitleAr,
          metaTitleEn: input.metaTitleEn,
          metaDescriptionAr: input.metaDescriptionAr,
          metaDescriptionEn: input.metaDescriptionEn,
        },
      });

      if (input.tagIds) {
        await tx.productTag.deleteMany({ where: { productId: id } });
        if (input.tagIds.length) {
          await tx.productTag.createMany({
            data: input.tagIds.map((tagId) => ({ productId: id, tagId })),
          });
        }
      }

      if (input.relatedProductIds) {
        await tx.productRelation.deleteMany({ where: { productId: id } });
        if (input.relatedProductIds.length) {
          await tx.productRelation.createMany({
            data: input.relatedProductIds.map((relatedProductId) => ({
              productId: id,
              relatedProductId,
            })),
          });
        }
      }

      if (input.imageUrls) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (input.imageUrls.length) {
          await tx.productImage.createMany({
            data: input.imageUrls.map((url, i) => ({
              productId: id,
              url,
              sortOrder: i,
            })),
          });
        }
      }

      return tx.product.findUniqueOrThrow({ where: { id }, include: productInclude });
    });

    await searchService.indexProduct(id);
    return mapProductSummary(product);
  },

  async remove(id: string) {
    await prisma.product.delete({ where: { id } });
    await searchService.removeProduct(id);
  },

  async addImages(id: string, images: { url: string; publicId?: string }[]) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Product not found');

    const currentCount = await prisma.productImage.count({ where: { productId: id } });
    if (currentCount + images.length > MAX_PRODUCT_IMAGES) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        `Maximum ${MAX_PRODUCT_IMAGES} images per product (${currentCount} existing)`,
      );
    }

    const maxOrder = await prisma.productImage.aggregate({
      where: { productId: id },
      _max: { sortOrder: true },
    });
    const start = (maxOrder._max.sortOrder ?? -1) + 1;

    await prisma.productImage.createMany({
      data: images.map((img, i) => ({
        productId: id,
        url: img.url,
        cloudinaryPublicId: img.publicId,
        sortOrder: start + i,
      })),
    });

    await searchService.indexProduct(id);
  },

  async removeImage(productId: string, imageId: string) {
    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Image not found');

    await prisma.productImage.delete({ where: { id: imageId } });
    await searchService.indexProduct(productId);
  },

  async getAdminById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: productDetailInclude,
    });
    if (!product) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Product not found');
    return mapProductDetail(product);
  },

  async adminPicker() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        slug: true,
        nameAr: true,
        nameEn: true,
        price: true,
        stockQuantity: true,
        category: { select: { id: true, slug: true, nameAr: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { nameAr: 'asc' }],
      take: 500,
    });
    return {
      data: products.map((p) => ({
        id: p.id,
        sku: p.sku,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        price: decimalToNumber(p.price),
        stockQuantity: p.stockQuantity,
        categoryId: p.category.id,
        categorySlug: p.category.slug,
        categoryNameAr: p.category.nameAr,
        imageUrl: p.images[0]?.url ? resolveProductImageUrl(p.images[0].url, p.slug) : null,
      })),
    };
  },

  async adminList(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, products] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        include: productInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return {
      data: products.map(mapProductSummary),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },
};
