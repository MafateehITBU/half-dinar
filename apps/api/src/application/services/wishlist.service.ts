import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { resolveProductImageUrl } from '../../shared/product-image.js';
import { decimalToNumber } from '../../shared/utils.js';

async function getOrCreateWishlist(userId: string) {
  let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({ data: { userId } });
  }
  return wishlist;
}

export const wishlistService = {
  async get(userId: string) {
    const wishlist = await getOrCreateWishlist(userId);
    const items = await prisma.wishlistItem.findMany({
      where: { wishlistId: wishlist.id },
      include: {
        product: {
          include: {
            category: true,
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            tags: { include: { tag: true } },
          },
        },
      },
    });

    return {
      items: items
        .filter((i) => i.product.isActive)
        .map((i) => ({
          productId: i.productId,
          addedAt: wishlist.id,
          nameAr: i.product.nameAr,
          nameEn: i.product.nameEn,
          slug: i.product.slug,
          price: decimalToNumber(i.product.price),
          imageUrl: resolveProductImageUrl(i.product.images[0]?.url, i.product.slug),
          inStock: i.product.stockQuantity > 0,
        })),
    };
  },

  async add(userId: string, productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Product not found');
    }
    const wishlist = await getOrCreateWishlist(userId);
    await prisma.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
      create: { wishlistId: wishlist.id, productId },
      update: {},
    });
    return this.get(userId);
  },

  async remove(userId: string, productId: string) {
    const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) return { items: [] };
    await prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id, productId },
    });
    return this.get(userId);
  },

  async toggle(userId: string, productId: string) {
    const wishlist = await getOrCreateWishlist(userId);
    const existing = await prisma.wishlistItem.findUnique({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    });
    if (existing) {
      await prisma.wishlistItem.delete({ where: { wishlistId_productId: { wishlistId: wishlist.id, productId } } });
    } else {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product || !product.isActive) {
        throw new AppError(404, ErrorCodes.NOT_FOUND, 'Product not found');
      }
      await prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
    }
    const data = await this.get(userId);
    const inWishlist = data.items.some((i) => i.productId === productId);
    return { ...data, inWishlist };
  },

  async isInWishlist(userId: string, productId: string) {
    const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    if (!wishlist) return false;
    const item = await prisma.wishlistItem.findUnique({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    });
    return Boolean(item);
  },
};
