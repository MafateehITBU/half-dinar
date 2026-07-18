import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { decimalToNumber } from '../../shared/utils.js';
import { searchService } from './search.service.js';
import { productService } from './product.service.js';
import { categoryService } from './category.service.js';
import { promotionService } from './promotion.service.js';
import { packageService } from './package.service.js';
import { adminUserService } from './admin-user.service.js';
import { reviewService } from './review.service.js';

export interface BulkResult {
  deleted: number;
  failed: Array<{ id: string; reason: string }>;
}

async function runBulkDelete(
  ids: string[],
  remove: (id: string) => Promise<void>,
): Promise<BulkResult> {
  const failed: BulkResult['failed'] = [];
  let deleted = 0;

  for (const id of ids) {
    try {
      await remove(id);
      deleted++;
    } catch (e) {
      failed.push({
        id,
        reason: e instanceof AppError ? e.message : e instanceof Error ? e.message : 'failed',
      });
    }
  }

  return { deleted, failed };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

export const bulkService = {
  async exportProductsCsv(): Promise<string> {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { sku: 'asc' },
    });
    const header = 'sku,slug,name_ar,name_en,price,stock_quantity,category_slug,is_active,is_featured';
    const rows = products.map((p) =>
      [
        p.sku,
        p.slug,
        p.nameAr,
        p.nameEn,
        decimalToNumber(p.price),
        p.stockQuantity,
        p.category.slug,
        p.isActive,
        p.isFeatured,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    return [header, ...rows].join('\n');
  },

  async importProductsCsv(content: string) {
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'CSV must have header and at least one row');
    }

    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const skuIdx = header.indexOf('sku');
    const nameArIdx = header.indexOf('name_ar');
    const nameEnIdx = header.indexOf('name_en');
    const priceIdx = header.indexOf('price');
    const stockIdx = header.indexOf('stock_quantity');
    const catIdx = header.indexOf('category_slug');

    if (skuIdx < 0 || nameArIdx < 0 || priceIdx < 0 || catIdx < 0) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Required columns: sku, name_ar, price, category_slug');
    }

    const categories = await prisma.category.findMany();
    const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const sku = cols[skuIdx];
      if (!sku) continue;

      const categoryId = catBySlug.get(cols[catIdx]);
      if (!categoryId) {
        errors.push(`Row ${i + 1}: unknown category ${cols[catIdx]}`);
        continue;
      }

      const data = {
        sku,
        nameAr: cols[nameArIdx],
        nameEn: cols[nameEnIdx] ?? cols[nameArIdx],
        price: Number(cols[priceIdx]),
        stockQuantity: stockIdx >= 0 ? Number(cols[stockIdx]) || 0 : 0,
        categoryId,
        isActive: true,
        isFeatured: false,
      };

      try {
        const existing = await prisma.product.findUnique({ where: { sku } });
        if (existing) {
          await productService.update(existing.id, data);
          updated++;
        } else {
          await productService.create(data);
          created++;
        }
      } catch (e) {
        errors.push(`Row ${i + 1} (${sku}): ${e instanceof Error ? e.message : 'failed'}`);
      }
    }

    await searchService.reindexAll();

    return { created, updated, errors };
  },

  async deleteProducts(ids: string[]): Promise<BulkResult> {
    const result = await runBulkDelete(ids, (id) => productService.remove(id));
    if (result.deleted > 0) {
      await searchService.reindexAll();
    }
    return result;
  },

  async deleteCategories(ids: string[]): Promise<BulkResult> {
    return runBulkDelete(ids, (id) => categoryService.remove(id));
  },

  async deleteCoupons(ids: string[]): Promise<BulkResult> {
    return runBulkDelete(ids, (id) => promotionService.deleteCoupon(id));
  },

  async deleteCampaigns(ids: string[]): Promise<BulkResult> {
    return runBulkDelete(ids, (id) => promotionService.deleteCampaign(id));
  },

  async deletePackages(ids: string[]): Promise<BulkResult> {
    return runBulkDelete(ids, (id) => packageService.remove(id));
  },

  async deactivateUsers(ids: string[]): Promise<BulkResult> {
    return runBulkDelete(ids, (id) => adminUserService.remove(id));
  },

  async updateContactStatus(ids: string[], status: 'new' | 'read' | 'archived'): Promise<{ updated: number }> {
    const result = await prisma.contactMessage.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        readAt: status === 'new' ? null : new Date(),
      },
    });
    return { updated: result.count };
  },

  async moderateReviews(ids: string[], status: 'approved' | 'rejected'): Promise<BulkResult> {
    return runBulkDelete(ids, (id) => reviewService.moderate(id, status).then(() => undefined));
  },
};
