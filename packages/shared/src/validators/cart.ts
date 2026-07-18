import { z } from 'zod';

export const addCartItemSchema = z
  .object({
    productId: z.string().uuid().optional(),
    packageId: z.string().uuid().optional(),
    quantity: z.coerce.number().int().min(1).max(99),
  })
  .refine((d) => Boolean(d.productId) !== Boolean(d.packageId), {
    message: 'Provide either productId or packageId',
  });

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
