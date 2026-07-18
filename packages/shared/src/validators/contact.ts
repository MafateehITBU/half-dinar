import { z } from 'zod';

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

export const contactSubmitSchema = z.object({
  name: z.string().trim().min(2, 'الاسم مطلوب (حرفان على الأقل)').max(100),
  email: z.string().trim().email('بريد إلكتروني غير صالح'),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(30).optional()),
  subject: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
  message: z.string().trim().min(10, 'الرسالة قصيرة جداً (10 أحرف على الأقل)').max(5000),
});

export const contactStatusUpdateSchema = z.object({
  status: z.enum(['new', 'read', 'archived']),
});

export type ContactSubmitInput = z.infer<typeof contactSubmitSchema>;
