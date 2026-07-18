export interface AnalyticsDashboard {
  periodDays: number;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { id: string; nameAr: string; sku: string; soldCount: number; revenue: number }[];
  pendingRefunds: number;
  lowStockCount: number;
  newCustomers: number;
}
