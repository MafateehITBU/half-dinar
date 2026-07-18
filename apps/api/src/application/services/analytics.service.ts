import type { AnalyticsDashboard } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';
import { decimalToNumber } from '../../shared/utils.js';
import { inventoryService } from './inventory.service.js';

export const analyticsService = {
  async getDashboard(periodDays = 30): Promise<AnalyticsDashboard> {
    const since = new Date(Date.now() - periodDays * 86400000);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: { notIn: ['cancelled'] },
      },
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
      },
    });

    const revenue = orders.reduce((s, o) => s + decimalToNumber(o.total), 0);
    const orderCount = orders.length;

    const ordersByStatus: Record<string, number> = {};
    for (const o of orders) {
      ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
    }

    const revenueByDayMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      revenueByDayMap.set(key, { revenue: 0, orders: 0 });
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const entry = revenueByDayMap.get(key);
      if (entry) {
        entry.revenue += decimalToNumber(o.total);
        entry.orders += 1;
      }
    }
    const revenueByDay = Array.from(revenueByDayMap.entries()).map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue * 1000) / 1000,
      orders: v.orders,
    }));

    const topProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { soldCount: 'desc' },
      take: 10,
      select: { id: true, nameAr: true, sku: true, soldCount: true, price: true },
    });

    const topWithRevenue = topProducts.map((p) => ({
      id: p.id,
      nameAr: p.nameAr,
      sku: p.sku,
      soldCount: p.soldCount,
      revenue: Math.round(p.soldCount * decimalToNumber(p.price) * 1000) / 1000,
    }));

    const pendingRefunds = await prisma.refundRequest.count({
      where: { status: { in: ['requested', 'under_review'] } },
    });

    const lowStock = await inventoryService.getLowStockAlerts();
    const newCustomers = await prisma.user.count({
      where: { createdAt: { gte: since } },
    });

    return {
      periodDays,
      revenue: Math.round(revenue * 1000) / 1000,
      orderCount,
      averageOrderValue: orderCount ? Math.round((revenue / orderCount) * 1000) / 1000 : 0,
      ordersByStatus,
      revenueByDay,
      topProducts: topWithRevenue,
      pendingRefunds,
      lowStockCount: lowStock.count,
      newCustomers,
    };
  },
};
