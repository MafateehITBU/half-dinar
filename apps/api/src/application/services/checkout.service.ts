import type { PlaceOrderInput } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { cartService } from './cart.service.js';
import { shippingService } from './shipping.service.js';
import { orderService } from './order.service.js';
import { promotionService } from './promotion.service.js';
import { env } from '../../config/env.js';
import { requireStripe, stripeErrorMessage } from '../../config/stripe.js';
import { jodTotalToStripeCharge } from '../../shared/stripe-money.js';
import { searchService } from './search.service.js';
import { inventoryService } from './inventory.service.js';
import { loadPackage } from './package.service.js';
import { emailService } from './email.service.js';
import { loyaltyService } from './loyalty.service.js';
import { decimalToNumber } from '../../shared/utils.js';

async function applyCoupon(
  userId: string,
  cart: Awaited<ReturnType<typeof cartService.getCart>>,
  governorateCode: string,
  couponCode?: string,
) {
  const { shippingAmount } = await shippingService.calculateShipping(governorateCode, cart.subtotal);
  if (!couponCode) {
    return { subtotal: cart.subtotal, shippingAmount, discountAmount: 0, couponId: null as string | null, total: cart.subtotal + shippingAmount };
  }
  const coupon = await promotionService.validateCoupon(couponCode, userId, cart, shippingAmount);
  const total = cart.subtotal + coupon.shippingAmount - coupon.discountAmount;
  return {
    subtotal: cart.subtotal,
    shippingAmount: coupon.shippingAmount,
    discountAmount: coupon.discountAmount,
    couponId: coupon.couponId,
    total: Math.max(0, Math.round(total * 1000) / 1000),
  };
}

async function buildPricing(
  userId: string,
  cart: Awaited<ReturnType<typeof cartService.getCart>>,
  governorateCode: string,
  couponCode?: string,
  loyaltyPointsToUse?: number,
) {
  const couponPricing = await applyCoupon(userId, cart, governorateCode, couponCode);
  const beforeLoyalty =
    couponPricing.subtotal + couponPricing.shippingAmount - couponPricing.discountAmount;
  const loyalty = await loyaltyService.calculateRedemption(
    userId,
    loyaltyPointsToUse ?? 0,
    beforeLoyalty,
  );
  const total = Math.max(0, Math.round((beforeLoyalty - loyalty.discountAmount) * 1000) / 1000);
  return {
    ...couponPricing,
    loyaltyDiscount: loyalty.discountAmount,
    loyaltyPointsUsed: loyalty.pointsUsed,
    total,
  };
}

async function sendOrderConfirmationEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true, firstName: true } } },
  });
  if (!order?.user) return;
  const total = decimalToNumber(order.total);
  emailService
    .sendOrderConfirmation(
      order.user.email,
      order.user.firstName,
      order.orderNumber,
      total,
      order.id,
    )
    .catch(() => {});
}

async function revertPendingStripeOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status === 'cancelled') return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
            soldCount: { decrement: item.quantity },
          },
        });
        await tx.inventoryHistory.create({
          data: {
            productId: item.productId,
            changeQty: item.quantity,
            reason: 'adjustment',
            referenceId: orderId,
          },
        });
      } else if (item.packageId) {
        const pkgItems = await tx.packageItem.findMany({ where: { packageId: item.packageId } });
        for (const pi of pkgItems) {
          const inc = pi.quantity * item.quantity;
          await tx.product.update({
            where: { id: pi.productId },
            data: {
              stockQuantity: { increment: inc },
              soldCount: { decrement: inc },
            },
          });
          await tx.inventoryHistory.create({
            data: {
              productId: pi.productId,
              changeQty: inc,
              reason: 'adjustment',
              referenceId: orderId,
            },
          });
        }
      }
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'cancelled', paymentStatus: 'pending' },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: 'cancelled',
        note: 'Stripe payment intent failed — order cancelled',
        createdBy: 'system',
      },
    });
  });
}

export const checkoutService = {
  async getQuote(
    userId: string,
    governorateCode: string,
    couponCode?: string,
    loyaltyPointsToUse?: number,
  ) {
    const cart = await cartService.getCart(userId);
    if (!cart.items.length) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Cart is empty');
    }

    const { zone, freeShippingApplied } = await shippingService.calculateShipping(
      governorateCode,
      cart.subtotal,
    );

    const pricing = await buildPricing(userId, cart, governorateCode, couponCode, loyaltyPointsToUse);
    const account = await loyaltyService.getAccount(userId);

    return {
      subtotal: pricing.subtotal,
      shippingAmount: pricing.shippingAmount,
      discountAmount: pricing.discountAmount,
      loyaltyDiscount: pricing.loyaltyDiscount,
      loyaltyPointsUsed: pricing.loyaltyPointsUsed,
      total: pricing.total,
      freeShippingApplied: freeShippingApplied || pricing.shippingAmount === 0,
      couponCode: couponCode?.toUpperCase() ?? null,
      loyaltyBalance: account.pointsBalance,
      shippingZone: {
        id: zone.id,
        nameAr: zone.nameAr,
        nameEn: zone.nameEn,
        governorateCode: zone.governorateCode,
      },
    };
  },

  async placeOrder(userId: string, input: PlaceOrderInput) {
    if (input.paymentMethod === 'stripe' && !env.isStripePublicReady) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'الدفع بالبطاقة غير متاح حالياً. اختر الدفع عند الاستلام أو أضف مفاتيح Stripe في الإعدادات.',
      );
    }

    const cart = await cartService.getCart(userId);
    if (!cart.items.length) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Cart is empty');
    }

    for (const item of cart.items) {
      if (!item.inStock || item.quantity > item.maxQuantity) {
        throw new AppError(409, ErrorCodes.CONFLICT, `Insufficient stock for ${item.nameAr}`);
      }
    }

    const { zone } = await shippingService.calculateShipping(input.governorateCode, cart.subtotal);
    const pricing = await buildPricing(
      userId,
      cart,
      input.governorateCode,
      input.couponCode,
      input.loyaltyPointsToUse,
    );

    const orderNumber = orderService.generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'pending',
          subtotal: pricing.subtotal,
          shippingAmount: pricing.shippingAmount,
          discountAmount: pricing.discountAmount + pricing.loyaltyDiscount,
          total: pricing.total,
          loyaltyPointsUsed: pricing.loyaltyPointsUsed,
          couponId: pricing.couponId,
          shippingZoneId: zone.id,
          paymentMethod: input.paymentMethod,
          paymentStatus: 'pending',
          shippingAddress: input.shippingAddress,
          notes: input.notes,
        },
      });

      if (pricing.couponId) {
        await tx.coupon.update({
          where: { id: pricing.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      for (const item of cart.items) {
        if (item.type === 'package' && item.packageId) {
          const pkg = await loadPackage({ id: item.packageId });
          const maxQty = pkg.items.length
            ? Math.min(...pkg.items.map((i) => Math.floor(i.product.stockQuantity / i.quantity)))
            : 0;
          if (maxQty < item.quantity) {
            throw new AppError(409, ErrorCodes.CONFLICT, `Insufficient stock for ${item.nameAr}`);
          }

          await tx.orderItem.create({
            data: {
              orderId: created.id,
              packageId: item.packageId,
              name: item.nameAr,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.lineTotal,
            },
          });

          await inventoryService.decrementForPackageSale(tx, item.packageId, item.quantity, created.id);
        } else if (item.productId) {
          const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
          if (product.stockQuantity < item.quantity) {
            throw new AppError(409, ErrorCodes.CONFLICT, `Insufficient stock for ${product.nameAr}`);
          }

          await tx.orderItem.create({
            data: {
              orderId: created.id,
              productId: item.productId,
              name: item.nameAr,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.lineTotal,
            },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { decrement: item.quantity },
              soldCount: { increment: item.quantity },
            },
          });

          await tx.inventoryHistory.create({
            data: {
              productId: item.productId,
              changeQty: -item.quantity,
              reason: 'sale',
              referenceId: created.id,
            },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: created.id,
          fromStatus: null,
          toStatus: 'pending',
          note: input.couponCode ? `Order placed with coupon ${input.couponCode.toUpperCase()}` : 'Order placed',
          createdBy: userId,
        },
      });

      if (input.paymentMethod === 'cod') {
        await tx.order.update({ where: { id: created.id }, data: { status: 'processing' } });
        await tx.orderStatusHistory.create({
          data: {
            orderId: created.id,
            fromStatus: 'pending',
            toStatus: 'processing',
            note: 'COD order — auto processing',
            createdBy: 'system',
          },
        });
      }

      if (input.saveAddress) {
        const existing = await tx.address.findFirst({
          where: { userId, governorate: input.shippingAddress.governorate, street: input.shippingAddress.street },
        });
        if (!existing) {
          await tx.address.create({
            data: {
              userId,
              label: input.shippingAddress.label,
              governorate: input.shippingAddress.governorate,
              city: input.shippingAddress.city,
              street: input.shippingAddress.street,
              building: input.shippingAddress.building,
              phone: input.shippingAddress.phone,
            },
          });
        }
      }

      return tx.order.findUniqueOrThrow({
        where: { id: created.id },
        include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
      });
    });

    let clientSecret: string | undefined;

    if (input.paymentMethod === 'stripe') {
      const stripe = requireStripe();
      const { amount, currency } = jodTotalToStripeCharge(pricing.total);
      try {
        const intent = await stripe.paymentIntents.create({
          amount,
          currency,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            totalJod: String(pricing.total),
          },
          automatic_payment_methods: { enabled: true },
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { stripePaymentIntentId: intent.id },
        });

        clientSecret = intent.client_secret ?? undefined;
      } catch (err) {
        await revertPendingStripeOrder(order.id);
        throw new AppError(502, ErrorCodes.VALIDATION_ERROR, stripeErrorMessage(err));
      }
    }

    await cartService.clearCart(userId);

    if (pricing.loyaltyPointsUsed > 0) {
      await loyaltyService.redeemForOrder(userId, pricing.loyaltyPointsUsed, order.id);
    }

    if (input.paymentMethod !== 'stripe') {
      await sendOrderConfirmationEmail(order.id);
    }

    for (const item of cart.items) {
      if (item.productId) await searchService.indexProduct(item.productId);
      if (item.packageId) {
        const pkg = await prisma.package.findUnique({
          where: { id: item.packageId },
          include: { items: true },
        });
        if (pkg) {
          for (const pi of pkg.items) await searchService.indexProduct(pi.productId);
        }
      }
    }

    return {
      order: orderService.mapOrderDetail(order),
      clientSecret,
    };
  },

  async confirmStripePayment(orderId: string, userId: string, paymentIntentId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Order not found');
    if (order.userId !== userId) throw new AppError(403, ErrorCodes.FORBIDDEN, 'Access denied');
    if (order.paymentMethod !== 'stripe') {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Not a Stripe order');
    }
    if (order.stripePaymentIntentId !== paymentIntentId) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Payment intent mismatch');
    }

    const stripe = requireStripe();
    let intent;
    try {
      intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (err) {
      throw new AppError(502, ErrorCodes.VALIDATION_ERROR, stripeErrorMessage(err));
    }

    if (intent.status !== 'succeeded') {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Payment not completed');
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'paid', paymentStatus: 'paid' },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: 'paid',
          note: 'Stripe payment confirmed',
          createdBy: 'system',
        },
      });
      await tx.order.update({ where: { id: orderId }, data: { status: 'processing' } });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: 'paid',
          toStatus: 'processing',
          note: 'Order processing after payment',
          createdBy: 'system',
        },
      });
    });

    await sendOrderConfirmationEmail(orderId);

    return orderService.getById(orderId, userId);
  },

  async handleStripeWebhook(payload: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Webhook secret not configured');
    }

    const stripe = requireStripe();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (order && order.paymentStatus !== 'paid') {
          await prisma.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: orderId },
              data: { status: 'processing', paymentStatus: 'paid' },
            });
            await tx.orderStatusHistory.createMany({
              data: [
                {
                  orderId,
                  fromStatus: order.status,
                  toStatus: 'paid',
                  note: 'Stripe webhook: payment succeeded',
                  createdBy: 'system',
                },
                {
                  orderId,
                  fromStatus: 'paid',
                  toStatus: 'processing',
                  note: 'Auto processing after payment',
                  createdBy: 'system',
                },
              ],
            });
          });
          await sendOrderConfirmationEmail(orderId);
        }
      }
    }
  },
};
