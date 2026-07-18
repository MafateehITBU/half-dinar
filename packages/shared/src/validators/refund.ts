import { z } from 'zod';

export const createRefundSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(10).max(2000),
  imageUrls: z.array(z.string().url()).max(5).optional(),
});

export const moderateRefundSchema = z.object({
  status: z.enum(['under_review', 'approved', 'rejected']),
  adminNotes: z.string().max(2000).optional(),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type ModerateRefundInput = z.infer<typeof moderateRefundSchema>;
