import { BRAND } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { decimalToNumber } from '../../shared/utils.js';

const base = env.storefrontUrl.replace(/\/$/, '');

export const seoService = {
  robotsTxt() {
    return `User-agent: *
Allow: /
Disallow: /checkout
Disallow: /cart
Disallow: /login

Sitemap: ${base}/api/v1/seo/sitemap.xml
`;
  },

  async sitemapXml() {
    const [products, packages, pages, posts] = await Promise.all([
      prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.package.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.cmsPage.findMany({ select: { slug: true } }),
      prisma.blogPost.findMany({
        where: { isPublished: true },
        select: { slug: true, publishedAt: true },
      }),
    ]);

    const urls: { loc: string; lastmod?: string }[] = [
      { loc: `${base}/` },
      { loc: `${base}/store` },
      { loc: `${base}/categories` },
      { loc: `${base}/packages` },
      { loc: `${base}/blog` },
      { loc: `${base}/contact` },
    ];

    for (const p of products) {
      urls.push({
        loc: `${base}/products/${p.slug}`,
        lastmod: p.updatedAt.toISOString().slice(0, 10),
      });
    }
    for (const p of packages) {
      urls.push({
        loc: `${base}/packages/${p.slug}`,
        lastmod: p.updatedAt.toISOString().slice(0, 10),
      });
    }
    for (const p of pages) {
      urls.push({ loc: `${base}/pages/${p.slug}` });
    }
    for (const p of posts) {
      urls.push({
        loc: `${base}/blog/${p.slug}`,
        lastmod: p.publishedAt?.toISOString().slice(0, 10),
      });
    }

    const body = urls
      .map(
        (u) =>
          `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
  },

  async productJsonLd(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: true },
    });
    if (!product || !product.isActive) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.nameAr,
      alternateName: product.nameEn,
      sku: product.sku,
      image: product.images[0]?.url,
      description: product.descriptionAr ?? product.nameAr,
      brand: { '@type': 'Brand', name: BRAND.nameAr },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'JOD',
        price: decimalToNumber(product.price),
        availability:
          product.stockQuantity > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        url: `${base}/products/${product.slug}`,
      },
      aggregateRating:
        product.reviewCount > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: Number(product.avgRating),
              reviewCount: product.reviewCount,
            }
          : undefined,
    };
  },
};
