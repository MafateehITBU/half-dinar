import { z } from 'zod';

export const shippingAddressSchema = z.object({
  label: z.string().max(100).optional(),
  governorate: z.string().min(1, 'المحافظة مطلوبة').max(100),
  city: z.string().min(1, 'المدينة مطلوبة').max(100),
  street: z.string().min(1, 'الشارع مطلوب').max(200),
  building: z.string().max(100).optional(),
  phone: z
    .string()
    .min(7, 'رقم الهاتف يجب أن يكون 7 أرقام على الأقل')
    .max(20, 'رقم الهاتف طويل جداً')
    .regex(/^[0-9+\-\s()]+$/, 'رقم هاتف غير صالح'),
});

export const checkoutQuoteSchema = z.object({
  governorateCode: z.string().min(1),
  couponCode: z.string().optional(),
  loyaltyPointsToUse: z.coerce.number().int().min(0).optional(),
});

export const placeOrderSchema = z.object({
  governorateCode: z.string().min(1),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(['cod', 'stripe']),
  couponCode: z.string().optional(),
  loyaltyPointsToUse: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
  saveAddress: z.boolean().default(false),
});

export const stripeConfirmSchema = z.object({
  orderId: z.string().uuid(),
  paymentIntentId: z.string().min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'processing',
    'paid',
    'shipped',
    'delivered',
    'completed',
    'cancelled',
    'refunded',
  ]),
  note: z.string().max(500).optional(),
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
