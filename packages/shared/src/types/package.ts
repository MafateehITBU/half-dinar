import type { ProductSummary } from './catalog.js';

export interface PackageItem {
  productId: string;
  quantity: number;
  product: Pick<ProductSummary, 'id' | 'slug' | 'nameAr' | 'nameEn' | 'price' | 'imageUrl'>;
}

export interface PackageSummary {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  price: number;
  imageUrl: string | null;
  itemsCount: number;
  retailTotal: number;
  savings: number;
  inStock: boolean;
}

export interface PackageDetail extends PackageSummary {
  descriptionAr: string | null;
  descriptionEn: string | null;
  items: PackageItem[];
}
