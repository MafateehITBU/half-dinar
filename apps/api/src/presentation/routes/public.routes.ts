import { Router } from 'express';
import { z } from 'zod';
import { PERMISSIONS } from '@half-dinar/shared';
import { settingsService } from '../../application/services/settings.service.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
  requireSuperAdmin,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware.js';

export const publicRouter = Router();

publicRouter.get(
  '/config',
  asyncHandler(async (_req, res) => {
    const data = await settingsService.getPublicConfig();
    res.json({ data });
  }),
);

export const adminSettingsRouter = Router();

const updateSettingsSchema = z.object({
  ga4_measurement_id: z.string().optional(),
  meta_pixel_id: z.string().optional(),
  cookie_banner_text_ar: z.string().optional(),
  cookie_banner_text_en: z.string().optional(),
  loyalty_earn_rate: z.coerce.number().positive().optional(),
  loyalty_redeem_rate: z.coerce.number().positive().optional(),
  referral_referrer_reward_jod: z.coerce.number().min(0).optional(),
});

adminSettingsRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.SETTINGS_READ),
  asyncHandler(async (_req, res) => {
    const data = await settingsService.getPublicConfig();
    res.json({ data });
  }),
);

adminSettingsRouter.patch(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.SETTINGS_WRITE),
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const input = updateSettingsSchema.parse(req.body);
    const user = (req as AuthenticatedRequest).user!;
    const updates: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined) updates[k] = v;
    }
    if (typeof updates.cookie_banner_text_ar === 'string') {
      const { sanitizeRichText } = await import('../../shared/sanitize-html.js');
      updates.cookie_banner_text_ar = sanitizeRichText(String(updates.cookie_banner_text_ar));
    }
    if (typeof updates.cookie_banner_text_en === 'string') {
      const { sanitizeRichText } = await import('../../shared/sanitize-html.js');
      updates.cookie_banner_text_en = sanitizeRichText(String(updates.cookie_banner_text_en));
    }
    const result = await settingsService.updateSettings(updates, user.sub);
    res.json({ data: result });
  }),
);
