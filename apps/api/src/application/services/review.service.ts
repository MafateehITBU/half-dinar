import type { CreateReviewInput } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';

const VERIFIED_STATUSES = ['delivered', 'completed'] as const;

function mapReview(r: {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  createdAt: Date;
  user: { firstName: string; lastName: string };
  images: { id: string; url: string }[];
}) {
  return {
    id: r.id,
    productId: r.productId,
    userId: r.userId,
    rating: r.rating,
    title: r.title,
    body: r.body,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    userName: `${r.user.firstName} ${r.user.lastName}`.trim(),
    images: r.images,
  };
}

async function recalcProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, status: 'approved' },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      avgRating: agg._avg.rating ?? 0,
      reviewCount: agg._count,
    },
  });
}

export const reviewService = {
  async listByProduct(productId: string, page = 1, limit = 10) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Product not found');

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId, status: 'approved' },
        include: { user: true, images: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { productId, status: 'approved' } }),
    ]);

    return {
      avgRating: Number(product.avgRating),
      reviewCount: product.reviewCount,
      reviews: reviews.map(mapReview),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  async listByProductSlug(slug: string, page = 1, limit = 10) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Product not found');
    return this.listByProduct(product.id, page, limit);
  },

  async create(userId: string, input: CreateReviewInput) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });
    if (!order || order.userId !== userId) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Order not found');
    }
    if (!VERIFIED_STATUSES.includes(order.status as (typeof VERIFIED_STATUSES)[number])) {
      throw new AppError(403, ErrorCodes.FORBIDDEN, 'Order must be delivered before reviewing');
    }
    const hasProduct = order.items.some((i) => i.productId === input.productId);
    if (!hasProduct) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Product not in this order');
    }

    const existing = await prisma.review.findFirst({
      where: { userId, productId: input.productId, orderId: input.orderId },
    });
    if (existing) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'You already reviewed this product for this order');
    }

    const review = await prisma.review.create({
      data: {
        productId: input.productId,
        userId,
        orderId: input.orderId,
        rating: input.rating,
        title: input.title,
        body: input.body,
        status: 'pending',
      },
      include: { user: true, images: true },
    });
    return mapReview(review);
  },

  async adminList(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as 'pending' | 'approved' | 'rejected' } : {};
    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: {
          user: true,
          images: true,
          product: { select: { id: true, slug: true, nameAr: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return {
      data: reviews.map((r) => ({
        ...mapReview(r),
        product: r.product,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  async moderate(reviewId: string, status: 'approved' | 'rejected') {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Review not found');

    await prisma.review.update({
      where: { id: reviewId },
      data: { status },
    });

    if (status === 'approved' || review.status === 'approved') {
      await recalcProductRating(review.productId);
    }

    return { id: reviewId, status };
  },
};
