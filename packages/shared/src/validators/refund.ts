import { z } from 'zod';

export const createRefundSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(10).max(2000),
  imageUrls: z.array(z.string().url()).max(5).optional(),
});

export const moderateRefundSchema = z.object({
  status: z.enum(['under_review', 'approved', 'rejected']),
  adminNotes: z.string().max(2000).optional(),
  /**
   * When approving a MEPS/Visa order:
   * - auto (default): call PayTabs refund API
   * - skip: mark approved only (use after manual refund in MEPS dashboard, or when API refund unsupported e.g. Apple Pay / code 335)
   */
  cardRefund: z.enum(['auto', 'skip']).default('auto'),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
export type ModerateRefundInput = z.infer<typeof moderateRefundSchema>;
