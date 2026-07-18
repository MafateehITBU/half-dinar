export interface CategoryTree {
  id: string;
  parentId: string | null;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  children: CategoryTree[];
}

export interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
  altAr: string | null;
  altEn: string | null;
}

export interface ProductTag {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
}

export interface ProductSummary {
  id: string;
  sku: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  inStock: boolean;
  isFeatured: boolean;
  avgRating: number;
  reviewCount: number;
  imageUrl: string | null;
  category: { id: string; slug: string; nameAr: string; nameEn: string };
  tags: ProductTag[];
}

export interface ProductDetail extends ProductSummary {
  descriptionAr: string | null;
  descriptionEn: string | null;
  images: ProductImage[];
  relatedProducts: ProductSummary[];
  metaTitleAr: string | null;
  metaTitleEn: string | null;
  metaDescriptionAr: string | null;
  metaDescriptionEn: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
