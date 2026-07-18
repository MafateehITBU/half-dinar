import type { ProductListQuery } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';
import { meiliClient, PRODUCTS_INDEX, type MeiliProductDocument, ensureProductsIndex } from '../../config/meilisearch.js';
import { resolveProductImageUrl } from '../../shared/product-image.js';
import { decimalToNumber } from '../../shared/utils.js';
import { mapProductSummary } from './category.service.js';
import { applyCampaignToSummaries } from './campaign-pricing.js';
import { promotionService } from './promotion.service.js';

export const searchService = {
  async init() {
    await ensureProductsIndex();
  },

  async indexProduct(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        tags: { include: { tag: true } },
      },
    });
    if (!product) return;

    const doc: MeiliProductDocument = {
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr ?? '',
      descriptionEn: product.descriptionEn ?? '',
      tags: product.tags.map((t) => t.tag.slug),
      tagIds: product.tags.map((t) => t.tag.id),
      categoryId: product.categoryId,
      categorySlug: product.category.slug,
      categoryNameAr: product.category.nameAr,
      categoryNameEn: product.category.nameEn,
      price: decimalToNumber(product.price),
      inStock: product.stockQuantity > 0,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      rating: decimalToNumber(product.avgRating),
      soldCount: product.soldCount,
      image: resolveProductImageUrl(product.images[0]?.url, product.slug),
      createdAt: product.createdAt.getTime(),
    };

    await meiliClient.index(PRODUCTS_INDEX).addDocuments([doc]);
  },

  async removeProduct(productId: string) {
    await meiliClient.index(PRODUCTS_INDEX).deleteDocument(productId);
  },

  async reindexAll() {
    const products = await prisma.product.findMany({ select: { id: true } });
    for (const p of products) {
      await this.indexProduct(p.id);
    }
  },

  async searchProducts(query: ProductListQuery) {
    const index = meiliClient.index(PRODUCTS_INDEX);
    const filters: string[] = ['isActive = true'];

    if (query.categoryId) filters.push(`categoryId = "${query.categoryId}"`);
    if (query.categorySlug) filters.push(`categorySlug = "${query.categorySlug}"`);
    if (query.inStock === 'true') filters.push('inStock = true');
    if (query.featured === 'true') filters.push('isFeatured = true');
    if (query.minPrice !== undefined) filters.push(`price >= ${query.minPrice}`);
    if (query.maxPrice !== undefined) filters.push(`price <= ${query.maxPrice}`);
    if (query.tags) {
      const tagSlugs = query.tags.split(',').map((t) => t.trim());
      const tagFilter = tagSlugs.map((t) => `tags = "${t}"`).join(' OR ');
      filters.push(`(${tagFilter})`);
    }

    const sortMap = {
      newest: ['createdAt:desc'],
      popularity: ['soldCount:desc'],
      bestSeller: ['soldCount:desc'],
      priceAsc: ['price:asc'],
      priceDesc: ['price:desc'],
      rating: ['rating:desc'],
    } as const;

    const result = await index.search(query.q ?? '', {
      filter: filters.join(' AND '),
      sort: [...sortMap[query.sort]],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });

    const ids = result.hits.map((h) => (h as MeiliProductDocument).id);
    if (!ids.length) {
      return {
        data: [],
        pagination: { page: query.page, limit: query.limit, total: 0, totalPages: 1 },
      };
    }

    const products = await prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        tags: { include: { tag: true } },
      },
    });

    const byId = new Map(products.map((p) => [p.id, p]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
    const campaignPrices = await promotionService.getActiveCampaignPrices();

    return {
      data: applyCampaignToSummaries(ordered.map((p) => mapProductSummary(p!)), campaignPrices),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.estimatedTotalHits ?? result.hits.length,
        totalPages: Math.ceil((result.estimatedTotalHits ?? result.hits.length) / query.limit) || 1,
      },
    };
  },

  async suggest(q: string, limit = 8) {
    if (!q.trim()) return [];
    const result = await meiliClient.index(PRODUCTS_INDEX).search(q, {
      filter: 'isActive = true',
      limit,
      attributesToRetrieve: ['id', 'slug', 'nameAr', 'nameEn', 'price', 'image'],
    });
    return result.hits.map((h) => {
      const doc = h as MeiliProductDocument;
      return {
        id: doc.id,
        slug: doc.slug,
        nameAr: doc.nameAr,
        nameEn: doc.nameEn,
        price: doc.price,
        imageUrl: resolveProductImageUrl(doc.image, doc.slug),
      };
    });
  },
};
