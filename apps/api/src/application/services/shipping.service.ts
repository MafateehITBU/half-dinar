import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { decimalToNumber } from '../../shared/utils.js';
import type { ShippingZoneOption } from '@half-dinar/shared';

async function getFreeShippingThreshold(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: 'free_shipping_threshold' } });
  if (!setting) return 50;
  return Number(setting.value);
}

export const shippingService = {
  async listZones(): Promise<ShippingZoneOption[]> {
    const zones = await prisma.shippingZone.findMany({
      where: { isActive: true },
      include: { rates: true },
      orderBy: { nameAr: 'asc' },
    });

    return zones.map((z) => ({
      id: z.id,
      nameAr: z.nameAr,
      nameEn: z.nameEn,
      governorateCode: z.governorateCode,
      flatRate: z.rates[0] ? decimalToNumber(z.rates[0].flatRate) : 0,
    }));
  },

  async calculateShipping(governorateCode: string, subtotal: number) {
    const code = governorateCode.trim().toUpperCase();
    const zone = await prisma.shippingZone.findFirst({
      where: { governorateCode: code, isActive: true },
      include: { rates: true },
    });

    if (!zone || !zone.rates[0]) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'الشحن غير متاح لهذه المحافظة. جرّب محافظة أخرى أو تواصل معنا.',
      );
    }

    const threshold = await getFreeShippingThreshold();
    const flatRate = decimalToNumber(zone.rates[0].flatRate);
    const freeShippingApplied = subtotal >= threshold;
    const shippingAmount = freeShippingApplied ? 0 : flatRate;

    return {
      zone,
      shippingAmount,
      freeShippingApplied,
      freeShippingThreshold: threshold,
    };
  },
};
