import type { Prisma } from '@prisma/client';
import type { CategoryTree, ProductDetail, ProductSummary } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';
import { resolveProductImageUrl } from '../../shared/product-image.js';
import { decimalToNumber, slugify, uniqueSlug } from '../../shared/utils.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import type { CreateCategoryInput, UpdateCategoryInput } from '@half-dinar/shared';

type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: { _count: { select: { products: true } } };
}>;

function mapCategory(c: CategoryWithCount): Omit<CategoryTree, 'children'> {
  return {
    id: c.id,
    parentId: c.parentId,
    slug: c.slug,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    descriptionAr: c.descriptionAr,
    descriptionEn: c.descriptionEn,
    imageUrl: c.imageUrl,
    icon: c.icon,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    productCount: c._count.products,
  };
}

function buildTree(categories: CategoryWithCount[]): CategoryTree[] {
  const mapped = categories.map(mapCategory);
  const byId = new Map(mapped.map((c) => [c.id, { ...c, children: [] as CategoryTree[] }]));
  const roots: CategoryTree[] = [];

  for (const cat of byId.values()) {
    if (cat.parentId && byId.has(cat.parentId)) {
      byId.get(cat.parentId)!.children.push(cat);
    } else {
      roots.push(cat);
    }
  }

  const sortNodes = (nodes: CategoryTree[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
}

export const categoryService = {
  async listTree(activeOnly = true): Promise<CategoryTree[]> {
    const categories = await prisma.category.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return buildTree(categories);
  },

  async getBySlug(slug: string): Promise<CategoryTree & { breadcrumbs: CategoryTree[] }> {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { products: true } } },
    });
    if (!category || !category.isActive) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Category not found');
    }

    const breadcrumbs: CategoryTree[] = [];
    let current = category;
    while (current) {
      breadcrumbs.unshift({ ...mapCategory(current as CategoryWithCount), children: [] });
      if (!current.parentId) break;
      const parent = await prisma.category.findUnique({
        where: { id: current.parentId },
        include: { _count: { select: { products: true } } },
      });
      if (!parent) break;
      current = parent;
    }

    const tree = buildTree(
      await prisma.category.findMany({
        where: { isActive: true },
        include: { _count: { select: { products: true } } },
      }),
    );

    const findInTree = (nodes: CategoryTree[], id: string): CategoryTree | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findInTree(node.children, id);
        if (found) return found;
      }
      return null;
    };

    const node = findInTree(tree, category.id) ?? {
      ...mapCategory(category as CategoryWithCount),
      children: [],
    };

    return { ...node, breadcrumbs };
  },

  async create(input: CreateCategoryInput) {
    const slug =
      input.slug ??
      (await uniqueSlug(input.nameEn, async (s) => Boolean(await prisma.category.findUnique({ where: { slug: s } }))));

    if (input.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: input.parentId } });
      if (!parent) throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Parent category not found');
    }

    return prisma.category.create({
      data: {
        parentId: input.parentId ?? null,
        slug,
        nameAr: input.nameAr,
        nameEn: input.nameEn,
        descriptionAr: input.descriptionAr,
        descriptionEn: input.descriptionEn,
        imageUrl: input.imageUrl || null,
        icon: input.icon || null,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
      },
      include: { _count: { select: { products: true } } },
    });
  },

  async update(id: string, input: UpdateCategoryInput) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Category not found');

    if (input.parentId === id) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Category cannot be its own parent');
    }

    let slug = input.slug;
    if (input.nameEn && !input.slug) {
      slug = await uniqueSlug(input.nameEn, async (s) => {
        const found = await prisma.category.findUnique({ where: { slug: s } });
        return Boolean(found && found.id !== id);
      });
    }

    return prisma.category.update({
      where: { id },
      data: {
        ...input,
        slug: slug ?? undefined,
        imageUrl: input.imageUrl === '' ? null : input.imageUrl,
        icon: input.icon === '' ? null : input.icon,
      },
      include: { _count: { select: { products: true } } },
    });
  },

  async remove(id: string) {
    const childCount = await prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Cannot delete category with subcategories');
    }
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Cannot delete category with products');
    }
    await prisma.category.delete({ where: { id } });
  },
};

export function mapProductSummary(
  product: Prisma.ProductGetPayload<{
    include: {
      category: true;
      images: true;
      tags: { include: { tag: true } };
    };
  }>,
): ProductSummary {
  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    price: decimalToNumber(product.price),
    compareAtPrice: product.compareAtPrice ? decimalToNumber(product.compareAtPrice) : null,
    stockQuantity: product.stockQuantity,
    inStock: product.stockQuantity > 0,
    isFeatured: product.isFeatured,
    avgRating: decimalToNumber(product.avgRating),
    reviewCount: product.reviewCount,
    imageUrl: resolveProductImageUrl(product.images[0]?.url, product.slug),
    category: {
      id: product.category.id,
      slug: product.category.slug,
      nameAr: product.category.nameAr,
      nameEn: product.category.nameEn,
    },
    tags: product.tags.map((pt) => ({
      id: pt.tag.id,
      slug: pt.tag.slug,
      nameAr: pt.tag.nameAr,
      nameEn: pt.tag.nameEn,
    })),
  };
}

export function mapProductDetail(
  product: Prisma.ProductGetPayload<{
    include: {
      category: true;
      images: true;
      tags: { include: { tag: true } };
      relationsFrom: { include: { relatedProduct: { include: { category: true; images: true; tags: { include: { tag: true } } } } } };
    };
  }>,
): ProductDetail {
  const summary = mapProductSummary(product);
  return {
    ...summary,
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    images: [...product.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({
        id: img.id,
        url: resolveProductImageUrl(img.url, product.slug),
        sortOrder: img.sortOrder,
        altAr: img.altAr,
        altEn: img.altEn,
      })),
    relatedProducts: product.relationsFrom.map((r) => mapProductSummary(r.relatedProduct)),
    metaTitleAr: product.metaTitleAr,
    metaTitleEn: product.metaTitleEn,
    metaDescriptionAr: product.metaDescriptionAr,
    metaDescriptionEn: product.metaDescriptionEn,
  };
}
