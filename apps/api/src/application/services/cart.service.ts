import { nanoid } from 'nanoid';
import type { CartResponse } from '@half-dinar/shared';
import { redis } from '../../config/redis.js';
import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { resolveProductImageUrl } from '../../shared/product-image.js';
import { decimalToNumber } from '../../shared/utils.js';
import { loadPackage, packageService } from './package.service.js';
import { promotionService } from './promotion.service.js';
import { getEffectiveProductPrice } from './campaign-pricing.js';

const CART_TTL_SECONDS = 60 * 60 * 24 * 30;

interface RawCartItem {
  productId?: string;
  packageId?: string;
  quantity: number;
}

interface RawCart {
  items: RawCartItem[];
}

function guestCartKey(token: string) {
  return `cart:guest:${token}`;
}

function itemKey(item: RawCartItem) {
  return item.productId ? `p:${item.productId}` : `k:${item.packageId}`;
}

async function loadRawCart(userId?: string, guestToken?: string): Promise<RawCart> {
  if (userId) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (!cart) return { items: [] };
    return {
      items: cart.items.map((i) => ({
        productId: i.productId ?? undefined,
        packageId: i.packageId ?? undefined,
        quantity: i.quantity,
      })),
    };
  }

  if (guestToken) {
    const raw = await redis.get(guestCartKey(guestToken));
    if (!raw) return { items: [] };
    return JSON.parse(raw) as RawCart;
  }

  return { items: [] };
}

async function saveRawCart(cart: RawCart, userId?: string, guestToken?: string) {
  if (userId) {
    let dbCart = await prisma.cart.findUnique({ where: { userId } });
    if (!dbCart) {
      dbCart = await prisma.cart.create({ data: { userId } });
    }

    await prisma.cartItem.deleteMany({ where: { cartId: dbCart.id } });

    if (cart.items.length) {
      const productIds = cart.items.filter((i) => i.productId).map((i) => i.productId!);
      const packageIds = cart.items.filter((i) => i.packageId).map((i) => i.packageId!);

      const [products, packages] = await Promise.all([
        productIds.length
          ? prisma.product.findMany({ where: { id: { in: productIds } } })
          : [],
        packageIds.length
          ? prisma.package.findMany({ where: { id: { in: packageIds } } })
          : [],
      ]);

      const priceByProduct = new Map(products.map((p) => [p.id, p.price]));
      const priceByPackage = new Map(packages.map((p) => [p.id, p.price]));

      await prisma.cartItem.createMany({
        data: cart.items.map((item) => ({
          cartId: dbCart!.id,
          productId: item.productId ?? null,
          packageId: item.packageId ?? null,
          quantity: item.quantity,
          unitPrice: item.productId
            ? (priceByProduct.get(item.productId) ?? 0)
            : (priceByPackage.get(item.packageId!) ?? 0),
        })),
      });
    }
    return;
  }

  if (guestToken) {
    if (cart.items.length === 0) {
      await redis.del(guestCartKey(guestToken));
    } else {
      await redis.set(guestCartKey(guestToken), JSON.stringify(cart), 'EX', CART_TTL_SECONDS);
    }
  }
}

async function buildCartResponse(raw: RawCart, guestToken?: string): Promise<CartResponse> {
  if (!raw.items.length) {
    return { items: [], subtotal: 0, itemCount: 0, guestToken };
  }

  const productIds = raw.items.filter((i) => i.productId).map((i) => i.productId!);
  const packageIds = raw.items.filter((i) => i.packageId).map((i) => i.packageId!);

  const [products, packages] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds }, isActive: true },
          include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
        })
      : [],
    packageIds.length
      ? prisma.package.findMany({
          where: { id: { in: packageIds }, isActive: true },
          include: {
            items: { include: { product: true } },
          },
        })
      : [],
  ]);

  const productById = new Map(products.map((p) => [p.id, p]));
  const packageById = new Map(packages.map((p) => [p.id, p]));
  const campaignPrices = await promotionService.getActiveCampaignPrices();

  const items = raw.items
    .map((item) => {
      if (item.productId) {
        const product = productById.get(item.productId);
        if (!product) return null;
        const basePrice = decimalToNumber(product.price);
        const { unitPrice, originalUnitPrice } = getEffectiveProductPrice(
          product.id,
          basePrice,
          campaignPrices,
        );
        const savings = originalUnitPrice
          ? (originalUnitPrice - unitPrice) * item.quantity
          : undefined;
        return {
          type: 'product' as const,
          productId: product.id,
          quantity: item.quantity,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          slug: product.slug,
          sku: product.sku,
          unitPrice,
          originalUnitPrice: originalUnitPrice ?? undefined,
          lineTotal: unitPrice * item.quantity,
          savings,
          imageUrl: resolveProductImageUrl(product.images[0]?.url, product.slug),
          inStock: product.stockQuantity > 0,
          maxQuantity: Math.max(product.stockQuantity, 0),
        };
      }
      if (item.packageId) {
        const pkg = packageById.get(item.packageId);
        if (!pkg) return null;
        const loaded = { ...pkg, items: pkg.items };
        return packageService.mapForCart(loaded as Awaited<ReturnType<typeof loadPackage>>, item.quantity);
      }
      return null;
    })
    .filter(Boolean) as CartResponse['items'];

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, subtotal, itemCount, guestToken };
}

export const cartService = {
  createGuestToken() {
    return nanoid(32);
  },

  async getCart(userId?: string, guestToken?: string): Promise<CartResponse> {
    const raw = await loadRawCart(userId, guestToken);
    return buildCartResponse(raw, guestToken);
  },

  async addProduct(
    productId: string,
    quantity: number,
    userId?: string,
    guestToken?: string,
  ): Promise<CartResponse> {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Product not found');
    }
    if (product.stockQuantity <= 0) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Product out of stock');
    }

    const raw = await loadRawCart(userId, guestToken);
    const existing = raw.items.find((i) => i.productId === productId);
    const newQty = (existing?.quantity ?? 0) + quantity;

    if (newQty > product.stockQuantity) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Insufficient stock');
    }

    if (existing) {
      existing.quantity = newQty;
    } else {
      raw.items.push({ productId, quantity });
    }

    await saveRawCart(raw, userId, guestToken);
    return buildCartResponse(raw, guestToken);
  },

  async addPackage(
    packageId: string,
    quantity: number,
    userId?: string,
    guestToken?: string,
  ): Promise<CartResponse> {
    const pkg = await loadPackage({ id: packageId });
    if (!pkg.isActive) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Package not found');

    const maxQty = packageService.getMaxQuantity(pkg);
    if (maxQty <= 0) throw new AppError(409, ErrorCodes.CONFLICT, 'Package out of stock');

    const raw = await loadRawCart(userId, guestToken);
    const existing = raw.items.find((i) => i.packageId === packageId);
    const newQty = (existing?.quantity ?? 0) + quantity;

    if (newQty > maxQty) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Insufficient stock for package');
    }

    if (existing) {
      existing.quantity = newQty;
    } else {
      raw.items.push({ packageId, quantity });
    }

    await saveRawCart(raw, userId, guestToken);
    return buildCartResponse(raw, guestToken);
  },

  async addItem(
    input: { productId?: string; packageId?: string; quantity: number },
    userId?: string,
    guestToken?: string,
  ): Promise<CartResponse> {
    if (input.productId) return this.addProduct(input.productId, input.quantity, userId, guestToken);
    if (input.packageId) return this.addPackage(input.packageId, input.quantity, userId, guestToken);
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'productId or packageId required');
  },

  async updateItem(
    ref: { productId?: string; packageId?: string },
    quantity: number,
    userId?: string,
    guestToken?: string,
  ): Promise<CartResponse> {
    const raw = await loadRawCart(userId, guestToken);
    const key = ref.productId ? `p:${ref.productId}` : `k:${ref.packageId}`;
    const item = raw.items.find((i) => itemKey(i) === key);
    if (!item) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Item not in cart');

    if (ref.productId) {
      const product = await prisma.product.findUnique({ where: { id: ref.productId } });
      if (!product) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Product not found');
      if (quantity > product.stockQuantity) {
        throw new AppError(409, ErrorCodes.CONFLICT, 'Insufficient stock');
      }
    } else if (ref.packageId) {
      const pkg = await loadPackage({ id: ref.packageId });
      const maxQty = packageService.getMaxQuantity(pkg);
      if (quantity > maxQty) {
        throw new AppError(409, ErrorCodes.CONFLICT, 'Insufficient stock');
      }
    }

    item.quantity = quantity;
    await saveRawCart(raw, userId, guestToken);
    return buildCartResponse(raw, guestToken);
  },

  async removeItem(
    ref: { productId?: string; packageId?: string },
    userId?: string,
    guestToken?: string,
  ): Promise<CartResponse> {
    const raw = await loadRawCart(userId, guestToken);
    const key = ref.productId ? `p:${ref.productId}` : `k:${ref.packageId}`;
    raw.items = raw.items.filter((i) => itemKey(i) !== key);
    await saveRawCart(raw, userId, guestToken);
    return buildCartResponse(raw, guestToken);
  },

  async mergeGuestIntoUser(userId: string, guestToken: string): Promise<CartResponse> {
    const guestRaw = await loadRawCart(undefined, guestToken);
    const userRaw = await loadRawCart(userId);

    const merged = new Map<string, RawCartItem>();
    for (const item of [...userRaw.items, ...guestRaw.items]) {
      const key = itemKey(item);
      const existing = merged.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        merged.set(key, { ...item });
      }
    }

    const items: RawCartItem[] = [];
    for (const item of merged.values()) {
      if (item.productId) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product && product.stockQuantity > 0) {
          items.push({ productId: item.productId, quantity: Math.min(item.quantity, product.stockQuantity) });
        }
      } else if (item.packageId) {
        try {
          const pkg = await loadPackage({ id: item.packageId });
          const maxQty = packageService.getMaxQuantity(pkg);
          if (maxQty > 0) {
            items.push({ packageId: item.packageId, quantity: Math.min(item.quantity, maxQty) });
          }
        } catch {
          /* skip invalid package */
        }
      }
    }

    const cart: RawCart = { items };
    await saveRawCart(cart, userId);
    await redis.del(guestCartKey(guestToken));

    return buildCartResponse(cart);
  },

  async clearCart(userId: string): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  },
};
