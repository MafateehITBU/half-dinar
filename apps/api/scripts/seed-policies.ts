/** Upsert legal policy CMS pages. Safe to re-run. */
import { PrismaClient } from '@prisma/client';
import { POLICY_PAGES } from '../prisma/seed-policies.js';

const prisma = new PrismaClient();

async function main() {
  for (const page of POLICY_PAGES) {
    await prisma.cmsPage.upsert({
      where: { slug: page.slug },
      update: {
        type: page.type,
        titleAr: page.titleAr,
        titleEn: page.titleEn,
        bodyAr: page.bodyAr,
        bodyEn: page.bodyEn,
      },
      create: page,
    });
    console.log('upserted', page.slug);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
