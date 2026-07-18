/**
 * Populate the store with real catalog products for existing admin categories.
 * Run: npm run db:populate-catalog -w @half-dinar/api
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { USER_CATALOG_PRODUCTS, USER_CATEGORY_IMAGES } from '../prisma/user-catalog.js';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  const categoryBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  const tags = await prisma.tag.findMany();
  const tagBySlug = Object.fromEntries(tags.map((t) => [t.slug, t.id]));

  console.log('Updating category images...');
  for (const [slug, imageUrl] of Object.entries(USER_CATEGORY_IMAGES)) {
    const id = categoryBySlug[slug];
    if (!id) continue;
    await prisma.category.update({
      where: { id },
      data: { imageUrl },
    });
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const p of USER_CATALOG_PRODUCTS) {
    const categoryId = categoryBySlug[p.categorySlug];
    if (!categoryId) {
      console.warn(`Skip ${p.sku}: category "${p.categorySlug}" not found`);
      skipped += 1;
      continue;
    }

    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        slug: p.slug,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        stockQuantity: p.stock,
        isFeatured: p.featured,
        categoryId,
        isActive: true,
      },
      create: {
        sku: p.sku,
        slug: p.slug,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        categoryId,
        stockQuantity: p.stock,
        isFeatured: p.featured,
        isActive: true,
      },
    });

    if (existing) updated += 1;
    else created += 1;

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: p.image,
        sortOrder: 0,
        altAr: p.nameAr,
        altEn: p.nameEn,
      },
    });

    await prisma.productTag.deleteMany({ where: { productId: product.id } });
    if (p.tagSlugs.length) {
      await prisma.productTag.createMany({
        data: p.tagSlugs
          .filter((slug) => tagBySlug[slug])
          .map((slug) => ({
            productId: product.id,
            tagId: tagBySlug[slug],
          })),
      });
    }
  }

  console.log(`Catalog: ${created} created, ${updated} updated, ${skipped} skipped.`);

  try {
    const { searchService } = await import('../src/application/services/search.service.js');
    await searchService.init();
    await searchService.reindexAll();
    console.log('Meilisearch reindex complete.');
  } catch (err) {
    console.warn('Meilisearch reindex skipped:', err instanceof Error ? err.message : err);
  }

  const total = await prisma.product.count();
  console.log(`Total products in database: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
