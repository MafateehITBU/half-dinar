import type { NewsletterSubscribeInput } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';

export const newsletterService = {
  async subscribe(input: NewsletterSubscribeInput) {
    const sub = await prisma.newsletterSubscriber.upsert({
      where: { email: input.email.toLowerCase() },
      update: {
        newsletter: input.newsletter,
        offers: input.offers,
      },
      create: {
        email: input.email.toLowerCase(),
        newsletter: input.newsletter,
        offers: input.offers,
      },
    });
    return {
      email: sub.email,
      newsletter: sub.newsletter,
      offers: sub.offers,
      subscribedAt: sub.subscribedAt.toISOString(),
    };
  },

  async unsubscribe(email: string) {
    await prisma.newsletterSubscriber.updateMany({
      where: { email: email.toLowerCase() },
      data: { newsletter: false, offers: false },
    });
    return { email: email.toLowerCase(), unsubscribed: true };
  },

  async adminList(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [total, subs] = await Promise.all([
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.findMany({
        orderBy: { subscribedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return {
      data: subs.map((s) => ({
        id: s.id,
        email: s.email,
        newsletter: s.newsletter,
        offers: s.offers,
        subscribedAt: s.subscribedAt.toISOString(),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },
};
