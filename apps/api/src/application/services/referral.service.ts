import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { getSettingNumber } from './settings.service.js';

export const referralService = {
  async getMyReferral(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, firstName: true },
    });
    if (!user) return null;

    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const completed = referrals.filter((r) => r.status === 'rewarded').length;
    const pending = referrals.filter((r) => r.status === 'registered' || r.status === 'pending').length;

    return {
      code: user.referralCode,
      shareUrl: `${env.storefrontUrl}/login?ref=${user.referralCode}`,
      stats: { total: referrals.length, rewarded: completed, pending },
      referrals: referrals.map((r) => ({
        id: r.id,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        rewardGrantedAt: r.rewardGrantedAt?.toISOString() ?? null,
      })),
    };
  },

  async grantOnFirstOrder(userId: string, orderId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.referredByUserId) return;

    const completedOrders = await prisma.order.count({
      where: {
        userId,
        status: { in: ['delivered', 'completed'] },
      },
    });
    if (completedOrders > 1) return;

    const referral = await prisma.referral.findFirst({
      where: { refereeId: userId, referrerId: user.referredByUserId },
    });
    if (!referral || referral.status === 'rewarded') return;

    const rewardJod = await getSettingNumber('referral_referrer_reward_jod', 5);
    const redeemRate = await getSettingNumber('loyalty_redeem_rate', 100);
    const points = Math.floor(rewardJod * redeemRate);

    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId: user.referredByUserId },
    });
    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: { userId: user.referredByUserId, pointsBalance: 0 },
      });
    }

    const referrer = await prisma.user.findUnique({
      where: { id: user.referredByUserId },
      select: { referralCode: true },
    });

    await prisma.$transaction([
      prisma.referral.update({
        where: { id: referral.id },
        data: { status: 'rewarded', orderId, rewardGrantedAt: new Date() },
      }),
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { pointsBalance: { increment: points } },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: 'referral_bonus',
          points,
          orderId,
          description: 'Referral reward — friend first order',
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { referralCodeUsed: referrer?.referralCode },
      }),
    ]);
  },
};
