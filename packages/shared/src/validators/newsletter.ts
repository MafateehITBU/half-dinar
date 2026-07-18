import { z } from 'zod';

export const newsletterSubscribeSchema = z.object({
  email: z.string().email(),
  newsletter: z.boolean().default(true),
  offers: z.boolean().default(false),
});

export const newsletterUnsubscribeSchema = z.object({
  email: z.string().email(),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
