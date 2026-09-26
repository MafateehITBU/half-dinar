import type { CartResponse } from '@half-dinar/shared';
import type { Coupon, CouponType } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { decimalToNumber } from '../../shared/utils.js';

export interface CouponResult {
  couponId: string;
  code: string;
  type: CouponType;
  discountAmount: number;
  shippingAmount: number;
  freeShipping: boolean;
}

function isCouponActive(coupon: Coupon): boolean {
  if (!coupon.isActive) return false;
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return false;
  if (coupon.endsAt && coupon.endsAt < now) return false;
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return false;
  return true;
}

export const promotionService = {
  async getActiveCampaignPrices(): Promise<Map<string, number>> {
    const now = new Date();
    const campaigns = await prisma.campaign.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: { products: { include: { product: true } } },
    });

    const prices = new Map<string, number>();
    for (const campaign of campaigns) {
      for (const cp of campaign.products) {
        const base = decimalToNumber(cp.product.price);
        let sale = base;
        if (cp.salePrice) {
          sale = decimalToNumber(cp.salePrice);
        } else if (cp.discountPercent) {
          sale = base * (1 - decimalToNumber(cp.discountPercent) / 100);
        }
        prices.set(cp.productId, Math.round(sale * 1000) / 1000);
      }
    }
    return prices;
  },

  async getActiveFlashCampaign() {
    const now = new Date();
    return prisma.campaign.findFirst({
      where: {
        type: 'flash',
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                category: true,
                images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                tags: { include: { tag: true } },
              },
            },
          },
        },
      },
      orderBy: { startsAt: 'desc' },
    });
  },

  async validateCoupon(
    code: string,
    userId: string,
    cart: CartResponse,
    shippingAmount: number,
  ): Promise<CouponResult> {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: { restrictions: true },
    });

    if (!coupon || !isCouponActive(coupon)) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid or expired coupon code');
    }

    const userUses = await prisma.order.count({
      where: { userId, couponId: coupon.id, status: { not: 'cancelled' }, deletedAt: null },
    });
    if (userUses >= coupon.perUserLimit) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Coupon usage limit reached for your account');
    }

    const minOrder = coupon.minOrderValue ? decimalToNumber(coupon.minOrderValue) : 0;
    if (cart.subtotal < minOrder) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, `Minimum order value is ${minOrder} JOD`);
    }

    let eligibleSubtotal = cart.subtotal;
    if (coupon.restrictions.length) {
      const productIds = cart.items.map((i) => i.productId).filter(Boolean) as string[];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, categoryId: true },
      });

      const categoryRestrictions = coupon.restrictions
        .filter((r) => r.restrictionType === 'category')
        .map((r) => r.restrictionId);
      const productRestrictions = coupon.restrictions
        .filter((r) => r.restrictionType === 'product')
        .map((r) => r.restrictionId);

      eligibleSubtotal = cart.items.reduce((sum, item) => {
        // Restricted coupons: packages are not auto-eligible (avoid unrestricted package discount)
        if (!item.productId) return sum;
        const product = products.find((p) => p.id === item.productId);
        if (!product) return sum;
        const categoryMatch =
          categoryRestrictions.length === 0 || categoryRestrictions.includes(product.categoryId);
        const productMatch =
          productRestrictions.length === 0 || productRestrictions.includes(product.id);
        if (categoryMatch && productMatch) return sum + item.lineTotal;
        return sum;
      }, 0);

      if (eligibleSubtotal <= 0) {
        throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Coupon not applicable to cart items');
      }
    }

    let discountAmount = 0;
    let freeShipping = false;
    let finalShipping = shippingAmount;

    if (coupon.type === 'percent') {
      discountAmount = (eligibleSubtotal * decimalToNumber(coupon.value)) / 100;
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(decimalToNumber(coupon.value), eligibleSubtotal);
    } else if (coupon.type === 'free_shipping') {
      freeShipping = true;
      discountAmount = shippingAmount;
      finalShipping = 0;
    }

    discountAmount = Math.round(discountAmount * 1000) / 1000;

    return {
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type,
      discountAmount,
      shippingAmount: finalShipping,
      freeShipping,
    };
  },

  async incrementCouponUsage(couponId: string) {
    await prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });
  },

  // Admin CRUD
  async listCoupons() {
    return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' }, include: { restrictions: true } }).then((rows) =>
      rows.map((c) => ({
        ...c,
        value: decimalToNumber(c.value),
        minOrderValue: c.minOrderValue != null ? decimalToNumber(c.minOrderValue) : null,
      })),
    );
  },

  async createCoupon(input: {
    code: string;
    type: CouponType;
    value: number;
    startsAt?: string | null;
    endsAt?: string | null;
    usageLimit?: number | null;
    perUserLimit: number;
    minOrderValue?: number | null;
    isActive: boolean;
    categoryIds?: string[];
    productIds?: string[];
  }) {
    const code = input.code.toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) throw new AppError(409, ErrorCodes.CONFLICT, 'Coupon code already exists');

    return prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.create({
        data: {
          code,
          type: input.type,
          value: input.value,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          usageLimit: input.usageLimit ?? null,
          perUserLimit: input.perUserLimit,
          minOrderValue: input.minOrderValue ?? null,
          isActive: input.isActive,
        },
      });

      const restrictions = [
        ...(input.categoryIds ?? []).map((id) => ({
          couponId: coupon.id,
          restrictionType: 'category',
          restrictionId: id,
        })),
        ...(input.productIds ?? []).map((id) => ({
          couponId: coupon.id,
          restrictionType: 'product',
          restrictionId: id,
        })),
      ];

      if (restrictions.length) {
        await tx.couponRestriction.createMany({ data: restrictions });
      }

      return tx.coupon.findUniqueOrThrow({
        where: { id: coupon.id },
        include: { restrictions: true },
      });
    });
  },

  async deleteCoupon(id: string) {
    await prisma.coupon.delete({ where: { id } });
  },

  async listCampaigns() {
    return prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { products: { include: { product: { select: { id: true, nameAr: true, sku: true } } } } },
    });
  },

  async createCampaign(input: {
    name: string;
    type: 'flash' | 'seasonal' | 'holiday';
    startsAt: string;
    endsAt: string;
    isActive: boolean;
    productIds?: string[];
    discountPercent?: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          name: input.name,
          type: input.type,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          isActive: input.isActive,
        },
      });

      if (input.productIds?.length && input.discountPercent) {
        await tx.campaignProduct.createMany({
          data: input.productIds.map((productId) => ({
            campaignId: campaign.id,
            productId,
            discountPercent: input.discountPercent,
          })),
        });
      }

      return tx.campaign.findUniqueOrThrow({
        where: { id: campaign.id },
        include: { products: true },
      });
    });
  },

  async deleteCampaign(id: string) {
    await prisma.campaign.delete({ where: { id } });
  },
};
