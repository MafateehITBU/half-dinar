import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { decimalToNumber } from '../../shared/utils.js';
import type { ShippingZoneOption } from '@half-dinar/shared';

async function getFreeShippingThreshold(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: 'free_shipping_threshold' } });
  if (!setting) return 50;
  return Number(setting.value);
}

function pickRate<T extends { id: string; flatRate: unknown }>(rates: T[]) {
  return rates[0] ?? null;
}

export const shippingService = {
  async listZones(): Promise<ShippingZoneOption[]> {
    const zones = await prisma.shippingZone.findMany({
      where: { isActive: true },
      include: { rates: { orderBy: { id: 'asc' } } },
      orderBy: { nameAr: 'asc' },
    });

    return zones.map((z) => {
      const rate = pickRate(z.rates);
      return {
        id: z.id,
        nameAr: z.nameAr,
        nameEn: z.nameEn,
        governorateCode: z.governorateCode,
        flatRate: rate ? decimalToNumber(rate.flatRate) : 0,
      };
    });
  },

  async calculateShipping(governorateCode: string, subtotal: number) {
    const code = governorateCode.trim().toUpperCase();
    const zone = await prisma.shippingZone.findFirst({
      where: { governorateCode: code, isActive: true },
      include: { rates: { orderBy: { id: 'asc' } } },
    });

    const rate = zone ? pickRate(zone.rates) : null;
    if (!zone || !rate) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'الشحن غير متاح لهذه المحافظة. جرّب محافظة أخرى أو تواصل معنا.',
      );
    }

    const threshold = await getFreeShippingThreshold();
    const flatRate = decimalToNumber(rate.flatRate);
    const freeShippingApplied = subtotal >= threshold;
    const shippingAmount = freeShippingApplied ? 0 : flatRate;

    return {
      zone,
      shippingAmount,
      freeShippingApplied,
      freeShippingThreshold: threshold,
    };
  },

  async listAdminZones() {
    const [zones, threshold] = await Promise.all([
      prisma.shippingZone.findMany({
        include: { rates: { orderBy: { id: 'asc' } } },
        orderBy: { nameAr: 'asc' },
      }),
      getFreeShippingThreshold(),
    ]);

    return {
      freeShippingThreshold: threshold,
      zones: zones.map((z) => {
        const rate = pickRate(z.rates);
        return {
          id: z.id,
          nameAr: z.nameAr,
          nameEn: z.nameEn,
          governorateCode: z.governorateCode,
          isActive: z.isActive,
          flatRate: rate ? decimalToNumber(rate.flatRate) : 0,
          rateId: rate?.id ?? null,
        };
      }),
    };
  },

  async updateZone(
    zoneId: string,
    input: { isActive?: boolean; nameAr?: string; nameEn?: string; flatRate?: number },
  ) {
    const zone = await prisma.shippingZone.findUnique({
      where: { id: zoneId },
      include: { rates: { orderBy: { id: 'asc' } } },
    });
    if (!zone) throw new AppError(404, ErrorCodes.NOT_FOUND, 'منطقة الشحن غير موجودة');

    const updated = await prisma.shippingZone.update({
      where: { id: zoneId },
      data: {
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.nameAr !== undefined ? { nameAr: input.nameAr } : {}),
        ...(input.nameEn !== undefined ? { nameEn: input.nameEn } : {}),
      },
      include: { rates: { orderBy: { id: 'asc' } } },
    });

    let rate = pickRate(updated.rates);
    if (input.flatRate !== undefined) {
      if (rate) {
        rate = await prisma.shippingRate.update({
          where: { id: rate.id },
          data: { flatRate: input.flatRate },
        });
      } else {
        rate = await prisma.shippingRate.create({
          data: { zoneId, flatRate: input.flatRate },
        });
      }
    }

    return {
      id: updated.id,
      nameAr: updated.nameAr,
      nameEn: updated.nameEn,
      governorateCode: updated.governorateCode,
      isActive: updated.isActive,
      flatRate: rate ? decimalToNumber(rate.flatRate) : 0,
      rateId: rate?.id ?? null,
    };
  },

  async updateFreeShippingThreshold(threshold: number) {
    await prisma.setting.upsert({
      where: { key: 'free_shipping_threshold' },
      update: { value: threshold },
      create: { key: 'free_shipping_threshold', value: threshold },
    });
    return { freeShippingThreshold: threshold };
  },

  getFreeShippingThreshold,
};
