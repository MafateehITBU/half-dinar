export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface OrderTimelineEntry {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface OrderItemView {
  id: string;
  productId: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: 'cod' | 'stripe' | 'meps';
  paymentStatus: string;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface OrderDetail extends OrderSummary {
  items: OrderItemView[];
  shippingAddress: Record<string, unknown> | null;
  notes: string | null;
  timeline: OrderTimelineEntry[];
}

export interface CheckoutQuote {
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  loyaltyDiscount?: number;
  loyaltyPointsUsed?: number;
  loyaltyBalance?: number;
  total: number;
  freeShippingApplied: boolean;
  couponCode?: string | null;
  shippingZone: { id: string; nameAr: string; nameEn: string; governorateCode: string };
}

export interface PlaceOrderResult {
  order: OrderDetail;
  redirectUrl?: string;
}

export interface ShippingZoneOption {
  id: string;
  nameAr: string;
  nameEn: string;
  governorateCode: string;
  flatRate: number;
}
