import { z } from 'zod';

export const adjustInventorySchema = z.object({
  productId: z.string().uuid(),
  changeQty: z.coerce.number().int().refine((n) => n !== 0, 'changeQty cannot be zero'),
  reason: z.enum(['adjustment', 'restock', 'refund']),
  note: z.string().max(500).optional(),
});

export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
