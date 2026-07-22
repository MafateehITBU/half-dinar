import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { slugify, uniqueSlug } from '../../shared/utils.js';
import { mapProductSummary } from './category.service.js';
import { applyCampaignToSummary } from './campaign-pricing.js';
import { promotionService } from './promotion.service.js';

const now = () => new Date();

function activeSlideFilter() {
  const n = now();
  return {
    isActive: true,
    OR: [
      { startsAt: null, endsAt: null },
      { startsAt: { lte: n }, endsAt: null },
      { startsAt: null, endsAt: { gte: n } },
      { startsAt: { lte: n }, endsAt: { gte: n } },
    ],
  };
}

export const cmsService = {
  async getHomePayload() {
    const [slides, sections, settings] = await Promise.all([
      prisma.heroSlide.findMany({ where: activeSlideFilter(), orderBy: { sortOrder: 'asc' } }),
      prisma.cmsSection.findMany({ where: { isActive: true } }),
      prisma.setting.findMany({
        where: { key: { in: ['store_name_ar', 'store_name_en', 'footer_phone', 'footer_email', 'footer_address_ar'] } },
      }),
    ]);

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return {
      heroSlides: slides,
      sections: Object.fromEntries(sections.map((s) => [s.key, s.payload])),
      footer: settingsMap,
    };
  },

  async getPageBySlug(slug: string) {
    const page = await prisma.cmsPage.findUnique({ where: { slug } });
    if (!page) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Page not found');
    return page;
  },

  async getContactPayload() {
    const [faqs, settings] = await Promise.all([
      prisma.faq.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.setting.findMany({
        where: { key: { in: ['footer_phone', 'footer_email', 'footer_address_ar', 'footer_address_en'] } },
      }),
    ]);
    return {
      faqs,
      contact: Object.fromEntries(settings.map((s) => [s.key, s.value])),
    };
  },

  async listBlogPosts(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = { isPublished: true, publishedAt: { lte: now() } };
    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({ where, orderBy: { publishedAt: 'desc' }, skip, take: limit }),
    ]);
    return { data: posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  },

  async getBlogPost(slug: string) {
    const post = await prisma.blogPost.findUnique({ where: { slug } });
    if (!post || !post.isPublished) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Post not found');
    return post;
  },

  async getFlashOffers() {
    const campaign = await promotionService.getActiveFlashCampaign();
    if (!campaign) return { campaign: null, products: [] };

    const campaignPrices = await promotionService.getActiveCampaignPrices();
    const products = campaign.products.map((cp) =>
      applyCampaignToSummary(mapProductSummary(cp.product), campaignPrices),
    );

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        endsAt: campaign.endsAt.toISOString(),
      },
      products,
    };
  },

  // Admin
  async listHeroSlides() {
    return prisma.heroSlide.findMany({ orderBy: { sortOrder: 'asc' } });
  },

  async createHeroSlide(data: Record<string, unknown>) {
    return prisma.heroSlide.create({ data: data as never });
  },

  async updateHeroSlide(id: string, data: Record<string, unknown>) {
    return prisma.heroSlide.update({ where: { id }, data: data as never });
  },

  async deleteHeroSlide(id: string) {
    await prisma.heroSlide.delete({ where: { id } });
  },

  async listPages() {
    return prisma.cmsPage.findMany({ orderBy: { slug: 'asc' } });
  },

  async createPage(input: {
    slug?: string;
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    type: string;
  }) {
    const { sanitizeRichText } = await import('../../shared/sanitize-html.js');
    const slug =
      input.slug ??
      (await uniqueSlug(input.titleEn, async (s) => Boolean(await prisma.cmsPage.findUnique({ where: { slug: s } }))));
    return prisma.cmsPage.create({
      data: {
        slug,
        titleAr: input.titleAr,
        titleEn: input.titleEn,
        bodyAr: sanitizeRichText(input.bodyAr),
        bodyEn: sanitizeRichText(input.bodyEn),
        type: input.type,
      },
    });
  },

  async updatePage(id: string, data: Record<string, unknown>) {
    const { sanitizeRichTextFields } = await import('../../shared/sanitize-html.js');
    const clean = sanitizeRichTextFields(data, ['bodyAr', 'bodyEn']);
    return prisma.cmsPage.update({ where: { id }, data: clean as never });
  },

  async deletePage(id: string) {
    await prisma.cmsPage.delete({ where: { id } });
  },

  async listFaqs() {
    return prisma.faq.findMany({ orderBy: { sortOrder: 'asc' } });
  },

  async createFaq(data: Record<string, unknown>) {
    return prisma.faq.create({ data: data as never });
  },

  async updateFaq(id: string, data: Record<string, unknown>) {
    return prisma.faq.update({ where: { id }, data: data as never });
  },

  async deleteFaq(id: string) {
    await prisma.faq.delete({ where: { id } });
  },

  async listBlogPostsAdmin() {
    return prisma.blogPost.findMany({ orderBy: { publishedAt: 'desc' } });
  },

  async createBlogPost(input: {
    slug?: string;
    titleAr: string;
    titleEn: string;
    excerptAr?: string;
    excerptEn?: string;
    bodyAr: string;
    bodyEn: string;
    coverImage?: string;
    isPublished: boolean;
  }) {
    const { sanitizeRichText } = await import('../../shared/sanitize-html.js');
    const slug =
      input.slug ??
      (await uniqueSlug(input.titleEn, async (s) => Boolean(await prisma.blogPost.findUnique({ where: { slug: s } }))));
    return prisma.blogPost.create({
      data: {
        slug,
        titleAr: input.titleAr,
        titleEn: input.titleEn,
        excerptAr: input.excerptAr,
        excerptEn: input.excerptEn,
        bodyAr: sanitizeRichText(input.bodyAr),
        bodyEn: sanitizeRichText(input.bodyEn),
        coverImage: input.coverImage,
        isPublished: input.isPublished,
        publishedAt: input.isPublished ? now() : null,
      },
    });
  },

  async updateBlogPost(id: string, data: Record<string, unknown> & { isPublished?: boolean }) {
    const { sanitizeRichTextFields } = await import('../../shared/sanitize-html.js');
    const clean = sanitizeRichTextFields({ ...data }, ['bodyAr', 'bodyEn', 'excerptAr', 'excerptEn']);
    const update: Record<string, unknown> = { ...clean };
    if (data.isPublished === true) {
      update.publishedAt = now();
    }
    return prisma.blogPost.update({ where: { id }, data: update as never });
  },

  async deleteBlogPost(id: string) {
    await prisma.blogPost.delete({ where: { id } });
  },

  async upsertSection(key: string, payload: unknown, isActive = true) {
    return prisma.cmsSection.upsert({
      where: { key },
      update: { payload: payload as object, isActive },
      create: { key, payload: payload as object, isActive },
    });
  },
};
