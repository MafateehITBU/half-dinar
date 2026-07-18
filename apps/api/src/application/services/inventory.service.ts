import type { Prisma } from '@prisma/client';
import type { AdjustInventoryInput } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { decimalToNumber } from '../../shared/utils.js';
import { searchService } from './search.service.js';

async function getDefaultLowStockThreshold() {
  const setting = await prisma.setting.findUnique({ where: { key: 'default_low_stock_threshold' } });
  const val = setting?.value;
  return typeof val === 'number' ? val : 5;
}

export const inventoryService = {
  async getLowStockAlerts() {
    const defaultThreshold = await getDefaultLowStockThreshold();
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
      orderBy: { stockQuantity: 'asc' },
    });

    const alerts = products
      .filter((p) => {
        const threshold = p.lowStockThreshold ?? defaultThreshold;
        return p.stockQuantity <= threshold;
      })
      .map((p) => ({
        id: p.id,
        sku: p.sku,
        slug: p.slug,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        stockQuantity: p.stockQuantity,
        threshold: p.lowStockThreshold ?? defaultThreshold,
        imageUrl: p.images[0]?.url ?? null,
      }));

    return { data: alerts, count: alerts.length };
  },

  async getHistory(productId: string, page = 1, limit = 30) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Product not found');

    const skip = (page - 1) * limit;
    const [total, history] = await Promise.all([
      prisma.inventoryHistory.count({ where: { productId } }),
      prisma.inventoryHistory.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      product: {
        id: product.id,
        nameAr: product.nameAr,
        stockQuantity: product.stockQuantity,
      },
      data: history.map((h) => ({
        id: h.id,
        changeQty: h.changeQty,
        reason: h.reason,
        referenceId: h.referenceId,
        adminUserId: h.adminUserId,
        createdAt: h.createdAt.toISOString(),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  async adjust(input: AdjustInventoryInput, adminUserId: string) {
    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Product not found');

    const newQty = product.stockQuantity + input.changeQty;
    if (newQty < 0) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Stock cannot go below zero');
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: input.productId },
        data: { stockQuantity: newQty },
      });
      await tx.inventoryHistory.create({
        data: {
          productId: input.productId,
          changeQty: input.changeQty,
          reason: input.reason,
          adminUserId,
          referenceId: input.note ?? undefined,
        },
      });
    });

    await searchService.indexProduct(input.productId);

    return {
      productId: input.productId,
      stockQuantity: newQty,
      changeQty: input.changeQty,
    };
  },

  async decrementForPackageSale(
    tx: Prisma.TransactionClient,
    packageId: string,
    packageQty: number,
    orderId: string,
  ) {
    const items = await tx.packageItem.findMany({
      where: { packageId },
      include: { product: true },
    });
    for (const item of items) {
      const dec = item.quantity * packageQty;
      if (item.product.stockQuantity < dec) {
        throw new AppError(409, ErrorCodes.CONFLICT, `Insufficient stock for ${item.product.nameAr}`);
      }
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: { decrement: dec },
          soldCount: { increment: dec },
        },
      });
      await tx.inventoryHistory.create({
        data: {
          productId: item.productId,
          changeQty: -dec,
          reason: 'sale',
          referenceId: orderId,
        },
      });
    }
  },
};
