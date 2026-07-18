import type { CreatePackageInput, UpdatePackageInput } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { decimalToNumber, uniqueSlug } from '../../shared/utils.js';
const packageInclude = {
  items: {
    include: {
      product: {
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
          tags: { include: { tag: true } },
        },
      },
    },
  },
};

function calcRetailTotal(
  items: { quantity: number; product: { price: Parameters<typeof decimalToNumber>[0] } }[],
) {
  return items.reduce((sum, i) => sum + decimalToNumber(i.product.price) * i.quantity, 0);
}

function packageMaxQty(items: { quantity: number; product: { stockQuantity: number } }[]) {
  if (!items.length) return 0;
  return Math.min(...items.map((i) => Math.floor(i.product.stockQuantity / i.quantity)));
}

function mapPackageSummary(pkg: Awaited<ReturnType<typeof loadPackage>>) {
  const retailTotal = calcRetailTotal(pkg.items);
  const price = decimalToNumber(pkg.price);
  const maxQty = packageMaxQty(pkg.items);
  return {
    id: pkg.id,
    slug: pkg.slug,
    nameAr: pkg.nameAr,
    nameEn: pkg.nameEn,
    price,
    imageUrl: pkg.imageUrl,
    itemsCount: pkg.items.reduce((s, i) => s + i.quantity, 0),
    retailTotal: Math.round(retailTotal * 1000) / 1000,
    savings: Math.max(0, Math.round((retailTotal - price) * 1000) / 1000),
    inStock: maxQty > 0 && pkg.isActive,
  };
}

function mapPackageDetail(pkg: Awaited<ReturnType<typeof loadPackage>>) {
  return {
    ...mapPackageSummary(pkg),
    descriptionAr: pkg.descriptionAr,
    descriptionEn: pkg.descriptionEn,
    items: pkg.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      product: {
        id: i.product.id,
        slug: i.product.slug,
        nameAr: i.product.nameAr,
        nameEn: i.product.nameEn,
        price: decimalToNumber(i.product.price),
        imageUrl: i.product.images[0]?.url ?? null,
      },
    })),
  };
}

async function loadPackage(where: { id?: string; slug?: string }) {
  const pkg = await prisma.package.findFirst({
    where,
    include: packageInclude,
  });
  if (!pkg) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Package not found');
  return pkg;
}

async function validatePackagePricing(items: { productId: string; quantity: number }[], price: number) {
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  });
  if (products.length !== items.length) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'One or more products not found');
  }
  const priceById = new Map(products.map((p) => [p.id, decimalToNumber(p.price)]));
  const retailTotal = items.reduce((sum, i) => sum + (priceById.get(i.productId) ?? 0) * i.quantity, 0);
  if (price >= retailTotal) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Package price must be less than sum of items');
  }
}

export const packageService = {
  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { isActive: true };
    const [total, packages] = await Promise.all([
      prisma.package.count({ where }),
      prisma.package.findMany({
        where,
        include: packageInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return {
      data: packages.map(mapPackageSummary),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  async getBySlug(slug: string) {
    const pkg = await loadPackage({ slug });
    if (!pkg.isActive) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Package not found');
    return mapPackageDetail(pkg);
  },

  async getById(id: string) {
    return mapPackageDetail(await loadPackage({ id }));
  },

  async adminList(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, packages] = await Promise.all([
      prisma.package.count(),
      prisma.package.findMany({
        include: packageInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return {
      data: packages.map(mapPackageSummary),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  async create(input: CreatePackageInput) {
    await validatePackagePricing(input.items, input.price);
    const slug =
      input.slug ??
      (await uniqueSlug(input.nameEn, async (s) => Boolean(await prisma.package.findUnique({ where: { slug: s } }))));

    const pkg = await prisma.$transaction(async (tx) => {
      const created = await tx.package.create({
        data: {
          slug,
          nameAr: input.nameAr,
          nameEn: input.nameEn,
          descriptionAr: input.descriptionAr,
          descriptionEn: input.descriptionEn,
          imageUrl: input.imageUrl,
          price: input.price,
          isActive: input.isActive,
        },
      });
      await tx.packageItem.createMany({
        data: input.items.map((i) => ({
          packageId: created.id,
          productId: i.productId,
          quantity: i.quantity,
        })),
      });
      return tx.package.findUniqueOrThrow({ where: { id: created.id }, include: packageInclude });
    });
    return mapPackageDetail(pkg);
  },

  async update(id: string, input: UpdatePackageInput) {
    const existing = await prisma.package.findUnique({ where: { id }, include: { items: true } });
    if (!existing) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Package not found');

    const items = input.items ?? existing.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    const price = input.price ?? decimalToNumber(existing.price);
    if (input.items || input.price !== undefined) {
      await validatePackagePricing(items, price);
    }

    let slug = input.slug;
    if (input.nameEn && !input.slug) {
      slug = await uniqueSlug(input.nameEn, async (s) => {
        const found = await prisma.package.findUnique({ where: { slug: s } });
        return Boolean(found && found.id !== id);
      });
    }

    const pkg = await prisma.$transaction(async (tx) => {
      await tx.package.update({
        where: { id },
        data: {
          slug: slug ?? undefined,
          nameAr: input.nameAr,
          nameEn: input.nameEn,
          descriptionAr: input.descriptionAr,
          descriptionEn: input.descriptionEn,
          imageUrl: input.imageUrl,
          price: input.price,
          isActive: input.isActive,
        },
      });
      if (input.items) {
        await tx.packageItem.deleteMany({ where: { packageId: id } });
        await tx.packageItem.createMany({
          data: input.items.map((i) => ({
            packageId: id,
            productId: i.productId,
            quantity: i.quantity,
          })),
        });
      }
      return tx.package.findUniqueOrThrow({ where: { id }, include: packageInclude });
    });
    return mapPackageDetail(pkg);
  },

  async remove(id: string) {
    await prisma.package.delete({ where: { id } });
  },

  /** Max purchasable quantity for a package given component stock */
  getMaxQuantity(pkg: Awaited<ReturnType<typeof loadPackage>>) {
    return packageMaxQty(pkg.items);
  },

  mapForCart(pkg: Awaited<ReturnType<typeof loadPackage>>, quantity: number) {
    const summary = mapPackageSummary(pkg);
    return {
      type: 'package' as const,
      packageId: pkg.id,
      quantity,
      nameAr: pkg.nameAr,
      nameEn: pkg.nameEn,
      slug: pkg.slug,
      unitPrice: summary.price,
      lineTotal: summary.price * quantity,
      imageUrl: pkg.imageUrl,
      inStock: summary.inStock,
      maxQuantity: packageMaxQty(pkg.items),
      savings: summary.savings,
    };
  },
};

export { packageInclude, loadPackage };
