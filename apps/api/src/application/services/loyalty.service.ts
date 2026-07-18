import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { getSettingNumber } from './settings.service.js';

export const loyaltyService = {
  async getAccount(userId: string) {
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: { userId, pointsBalance: 0 },
        include: { transactions: true },
      });
    }
    const redeemRate = await getSettingNumber('loyalty_redeem_rate', 100);
    const earnRate = await getSettingNumber('loyalty_earn_rate', 1);
    return {
      pointsBalance: account.pointsBalance,
      redeemRate,
      earnRate,
      jodPer100Points: 100 / redeemRate,
      transactions: account.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        points: t.points,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  },

  async calculateRedemption(userId: string, pointsToUse: number, maxDiscountBase: number) {
    if (pointsToUse <= 0) {
      return { pointsUsed: 0, discountAmount: 0 };
    }
    const account = await prisma.loyaltyAccount.findUnique({ where: { userId } });
    const balance = account?.pointsBalance ?? 0;
    const redeemRate = await getSettingNumber('loyalty_redeem_rate', 100);

    const maxByBalance = balance;
    const requested = Math.min(pointsToUse, maxByBalance);
    let discountAmount = requested / redeemRate;
    discountAmount = Math.min(discountAmount, maxDiscountBase);
    const pointsUsed = Math.floor(discountAmount * redeemRate);

    return {
      pointsUsed,
      discountAmount: Math.round(discountAmount * 1000) / 1000,
    };
  },

  async redeemForOrder(userId: string, pointsUsed: number, orderId: string) {
    if (pointsUsed <= 0) return;
    const account = await prisma.loyaltyAccount.findUnique({ where: { userId } });
    if (!account || account.pointsBalance < pointsUsed) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Insufficient loyalty points');
    }
    await prisma.$transaction([
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { pointsBalance: { decrement: pointsUsed } },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: 'redeem',
          points: -pointsUsed,
          orderId,
          description: 'Redeemed at checkout',
        },
      }),
    ]);
  },

  async earnFromOrder(orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;
    if (!['delivered', 'completed'].includes(order.status)) return;

    const existing = await prisma.loyaltyTransaction.findFirst({
      where: { orderId, type: 'earn' },
    });
    if (existing) return;

    const earnRate = await getSettingNumber('loyalty_earn_rate', 1);
    const points = Math.floor(Number(order.total) * earnRate);
    if (points <= 0) return;

    let account = await prisma.loyaltyAccount.findUnique({ where: { userId: order.userId } });
    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: { userId: order.userId, pointsBalance: 0 },
      });
    }

    await prisma.$transaction([
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { pointsBalance: { increment: points } },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: 'earn',
          points,
          orderId,
          description: `Earned from order ${order.orderNumber}`,
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { loyaltyPointsEarned: points },
      }),
    ]);
  },
};
