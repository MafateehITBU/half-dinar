import { z } from 'zod';

export const createReviewSchema = z.object({
  productId: z.string().uuid(),
  orderId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
});

export const moderateReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
