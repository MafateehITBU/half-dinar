/**
 * Idempotent seed of Jordan shipping zones + flat rates + admin shipping permissions.
 * Safe to run on production (works even if unique index on governorate_code is missing).
 * Does not overwrite existing flat rates (so dashboard edits are preserved).
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
  { code: 'MN', nameAr: 'معان', nameEn: "Ma'an", rate: 5 },
  { code: 'AQ', nameAr: 'العقبة', nameEn: 'Aqaba', rate: 4.5 },
];

const SHIPPING_PERMS = [
  { slug: 'shipping:read', nameAr: 'قراءة الشحن', nameEn: 'Read Shipping' },
  { slug: 'shipping:write', nameAr: 'كتابة الشحن', nameEn: 'Write Shipping' },
] as const;

async function seedShippingPermissions() {
  const permIds: string[] = [];
  for (const p of SHIPPING_PERMS) {
    const row = await prisma.permission.upsert({
      where: { slug: p.slug },
      update: { nameAr: p.nameAr, nameEn: p.nameEn },
      create: { slug: p.slug, nameAr: p.nameAr, nameEn: p.nameEn, description: '' },
    });
    permIds.push(row.id);
    console.log(`permission ${p.slug} ok`);
  }

  const roles = await prisma.role.findMany({
    where: { slug: { in: ['super_admin', 'admin'] } },
  });
  for (const role of roles) {
    for (const permissionId of permIds) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId },
        },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
    console.log(`role ${role.slug} shipping perms ok`);
  }
}

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "shipping_zones_governorate_code_key"
    ON "shipping_zones"("governorate_code")
  `);

  for (const gov of GOVERNORATES) {
    let zone = await prisma.shippingZone.findFirst({
      where: { governorateCode: gov.code },
    });

    if (zone) {
      zone = await prisma.shippingZone.update({
        where: { id: zone.id },
        data: { nameAr: gov.nameAr, nameEn: gov.nameEn, isActive: true },
      });
    } else {
      zone = await prisma.shippingZone.create({
        data: {
          nameAr: gov.nameAr,
          nameEn: gov.nameEn,
          governorateCode: gov.code,
          isActive: true,
        },
      });
    }

    const existingRate = await prisma.shippingRate.findFirst({ where: { zoneId: zone.id } });
    if (!existingRate) {
      await prisma.shippingRate.create({
        data: { zoneId: zone.id, flatRate: gov.rate },
      });
    }
    console.log(`zone ${gov.code} ok`);
  }

  const count = await prisma.shippingZone.count({ where: { isActive: true } });
  console.log(`active zones: ${count}`);

  await seedShippingPermissions();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
