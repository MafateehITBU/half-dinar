import { MeiliSearch } from 'meilisearch';
import { env } from '../config/env.js';

export const meiliClient = new MeiliSearch({
  host: env.MEILI_HOST,
  apiKey: env.MEILI_MASTER_KEY,
});

export const PRODUCTS_INDEX = 'products';

export interface MeiliProductDocument {
  id: string;
  sku: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  tags: string[];
  tagIds: string[];
  categoryId: string;
  categorySlug: string;
  categoryNameAr: string;
  categoryNameEn: string;
  price: number;
  inStock: boolean;
  isFeatured: boolean;
  isActive: boolean;
  rating: number;
  soldCount: number;
  image: string;
  createdAt: number;
}

export async function ensureProductsIndex(): Promise<void> {
  try {
    await meiliClient.createIndex(PRODUCTS_INDEX, { primaryKey: 'id' });
  } catch {
    // index may already exist
  }

  const index = meiliClient.index(PRODUCTS_INDEX);
  await index.updateFilterableAttributes([
    'categoryId',
    'categorySlug',
    'tags',
    'tagIds',
    'inStock',
    'isFeatured',
    'isActive',
    'price',
  ]);
  await index.updateSortableAttributes(['price', 'createdAt', 'soldCount', 'rating']);
  await index.updateSearchableAttributes([
    'nameAr',
    'nameEn',
    'descriptionAr',
    'descriptionEn',
    'sku',
    'tags',
    'categoryNameAr',
    'categoryNameEn',
  ]);
}
