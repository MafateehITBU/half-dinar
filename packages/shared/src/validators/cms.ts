import { z } from 'zod';

export const createHeroSlideSchema = z.object({
  imageUrl: z.string().url(),
  titleAr: z.string().max(200).optional(),
  titleEn: z.string().max(200).optional(),
  subtitle: z.string().max(300).optional(),
  ctaText: z.string().max(100).optional(),
  ctaLink: z.string().max(300).optional(),
  sortOrder: z.coerce.number().int().default(0),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateHeroSlideSchema = createHeroSlideSchema.partial();

export const createCmsPageSchema = z.object({
  slug: z.string().min(2).max(120),
  titleAr: z.string().min(1).max(200),
  titleEn: z.string().min(1).max(200),
  bodyAr: z.string().min(1),
  bodyEn: z.string().min(1),
  type: z.enum(['about', 'terms', 'privacy', 'refund', 'custom']).default('custom'),
});

export const updateCmsPageSchema = createCmsPageSchema.partial();

export const createFaqSchema = z.object({
  questionAr: z.string().min(1),
  questionEn: z.string().min(1),
  answerAr: z.string().min(1),
  answerEn: z.string().min(1),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateFaqSchema = createFaqSchema.partial();

export const createBlogPostSchema = z.object({
  slug: z.string().min(2).max(120),
  titleAr: z.string().min(1).max(300),
  titleEn: z.string().min(1).max(300),
  excerptAr: z.string().max(500).optional(),
  excerptEn: z.string().max(500).optional(),
  bodyAr: z.string().min(1),
  bodyEn: z.string().min(1),
  coverImage: z.string().url().optional(),
  isPublished: z.boolean().default(false),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

export const updateCmsSectionSchema = z.object({
  payload: z.record(z.unknown()),
  isActive: z.boolean().optional(),
});
