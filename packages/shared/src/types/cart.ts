export interface CartItem {
  type: 'product' | 'package';
  productId?: string;
  packageId?: string;
  quantity: number;
  nameAr: string;
  nameEn: string;
  slug: string;
  sku?: string;
  unitPrice: number;
  lineTotal: number;
  imageUrl: string | null;
  inStock: boolean;
  maxQuantity: number;
  /** Base price before campaign discount (for strikethrough display) */
  originalUnitPrice?: number;
  savings?: number;
}

export interface CartResponse {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  guestToken?: string;
}
