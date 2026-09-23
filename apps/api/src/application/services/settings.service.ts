import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';

export async function getSettingNumber(key: string, fallback: number): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key } });
  const val = row?.value;
  return typeof val === 'number' ? val : fallback;
}

export async function getSettingString(key: string, fallback = ''): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  const val = row?.value;
  return typeof val === 'string' ? val : fallback;
}

export const settingsService = {
  getSettingNumber,
  getSettingString,

  async getPublicConfig() {
    const keys = [
      'ga4_measurement_id',
      'meta_pixel_id',
      'cookie_banner_text_ar',
      'cookie_banner_text_en',
      'loyalty_earn_rate',
      'loyalty_redeem_rate',
    ];
    const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    return {
      ga4MeasurementId: (map.ga4_measurement_id as string) ?? '',
      metaPixelId: (map.meta_pixel_id as string) ?? '',
      cookieBanner: {
        ar:
          (map.cookie_banner_text_ar as string) ??
          'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل الزيارات. يمكنك قبول الكل أو الضرورية فقط.',
        en:
          (map.cookie_banner_text_en as string) ??
          'We use cookies to improve your experience and analyze traffic.',
      },
      loyalty: {
        earnRate: (map.loyalty_earn_rate as number) ?? 1,
        redeemRate: (map.loyalty_redeem_rate as number) ?? 100,
      },
      meps: {
        enabled: env.isMepsConfigured,
      },
    };
  },

  async updateSettings(
    updates: Record<string, string | number>,
    adminUserId: string,
  ) {
    for (const [key, value] of Object.entries(updates)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    return { updated: Object.keys(updates), adminUserId };
  },
};
