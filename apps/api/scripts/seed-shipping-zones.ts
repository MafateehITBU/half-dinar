/**
 * Idempotent seed of Jordan shipping zones + flat rates.
 * Safe to run on production.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GOVERNORATES = [
  { code: 'AM', nameAr: 'عمان', nameEn: 'Amman', rate: 2.5 },
  { code: 'IR', nameAr: 'إربد', nameEn: 'Irbid', rate: 3.5 },
  { code: 'ZA', nameAr: 'الزرقاء', nameEn: 'Zarqa', rate: 3 },
  { code: 'BA', nameAr: 'البلقاء', nameEn: 'Balqa', rate: 3 },
  { code: 'MA', nameAr: 'المفرق', nameEn: 'Mafraq', rate: 4 },
  { code: 'AJ', nameAr: 'عجلون', nameEn: 'Ajloun', rate: 3.5 },
  { code: 'JR', nameAr: 'جرش', nameEn: 'Jerash', rate: 3.5 },
  { code: 'MD', nameAr: 'مادبا', nameEn: 'Madaba', rate: 3 },
  { code: 'KA', nameAr: 'الكرك', nameEn: 'Karak', rate: 4.5 },
  { code: 'AT', nameAr: 'الطفيلة', nameEn: 'Tafilah', rate: 5 },
  { code: 'MN', nameAr: "معان", nameEn: "Ma'an", rate: 5 },
  { code: 'AQ', nameAr: 'العقبة', nameEn: 'Aqaba', rate: 4.5 },
];

async function main() {
  for (const gov of GOVERNORATES) {
    const zone = await prisma.shippingZone.upsert({
      where: { governorateCode: gov.code },
      update: { nameAr: gov.nameAr, nameEn: gov.nameEn, isActive: true },
      create: {
        nameAr: gov.nameAr,
        nameEn: gov.nameEn,
        governorateCode: gov.code,
        isActive: true,
      },
    });

    const existingRate = await prisma.shippingRate.findFirst({ where: { zoneId: zone.id } });
    if (existingRate) {
      await prisma.shippingRate.update({
        where: { id: existingRate.id },
        data: { flatRate: gov.rate },
      });
    } else {
      await prisma.shippingRate.create({
        data: { zoneId: zone.id, flatRate: gov.rate },
      });
    }
    console.log(`zone ${gov.code} ok`);
  }

  const count = await prisma.shippingZone.count({ where: { isActive: true } });
  console.log(`active zones: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
