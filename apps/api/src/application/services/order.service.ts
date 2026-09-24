import type { OrderStatus, OrderDetail, OrderSummary } from '@half-dinar/shared';
import type { Order, OrderItem, OrderStatusHistory } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { decimalToNumber } from '../../shared/utils.js';
import { auditService } from './audit.service.js';
import { loyaltyService } from './loyalty.service.js';
import { referralService } from './referral.service.js';

type OrderWithRelations = Order & {
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
};

function mapOrderSummary(order: Order & { items: OrderItem[] }): OrderSummary {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status as OrderStatus,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: decimalToNumber(order.subtotal),
    shippingAmount: decimalToNumber(order.shippingAmount),
    discountAmount: decimalToNumber(order.discountAmount),
    total: decimalToNumber(order.total),
    itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
    createdAt: order.createdAt.toISOString(),
  };
}

function mapOrderDetail(order: OrderWithRelations): OrderDetail {
  return {
    ...mapOrderSummary(order),
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.name,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: decimalToNumber(i.unitPrice),
      total: decimalToNumber(i.total),
    })),
    shippingAddress: order.shippingAddress as Record<string, unknown> | null,
    notes: order.notes,
    paytabsTranRef: order.paytabsTranRef ?? null,
    timeline: order.statusHistory.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus as OrderStatus | null,
      toStatus: h.toStatus as OrderStatus,
      note: h.note,
      createdAt: h.createdAt.toISOString(),
    })),
  };
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'paid', 'cancelled'],
  processing: ['paid', 'shipped', 'cancelled'],
  paid: ['processing', 'shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['completed', 'refunded'],
  completed: ['refunded'],
  cancelled: [],
  refunded: [],
};

const STATUS_LABEL_AR: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  processing: 'قيد المعالجة',
  paid: 'مدفوع',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  refunded: 'مسترد',
};

const AUTO_AFTER: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'processing', // COD auto
};

export const orderService = {
  mapOrderDetail,

  async getById(orderId: string, userId?: string): Promise<OrderDetail> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Order not found');
    if (userId && order.userId !== userId) {
      throw new AppError(403, ErrorCodes.FORBIDDEN, 'Access denied');
    }
    return mapOrderDetail(order);
  },

  async listForUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [total, orders] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return {
      data: orders.map(mapOrderSummary),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  async listAdmin(
    page = 1,
    limit = 20,
    filters: {
      status?: OrderStatus;
      paymentMethod?: 'cod' | 'meps' | 'stripe';
      paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
      dateFrom?: string;
      dateTo?: string;
      q?: string;
    } = {},
  ) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;

    if (filters.dateFrom || filters.dateTo) {
      const createdAt: { gte?: Date; lte?: Date } = {};
      if (filters.dateFrom) {
        const from = new Date(`${filters.dateFrom}T00:00:00`);
        if (!Number.isNaN(from.getTime())) createdAt.gte = from;
      }
      if (filters.dateTo) {
        const to = new Date(`${filters.dateTo}T23:59:59.999`);
        if (!Number.isNaN(to.getTime())) createdAt.lte = to;
      }
      if (createdAt.gte || createdAt.lte) where.createdAt = createdAt;
    }

    const q = filters.q?.trim();
    if (q) {
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { paytabsTranRef: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { firstName: { contains: q, mode: 'insensitive' } } },
        { user: { lastName: { contains: q, mode: 'insensitive' } } },
        { user: { phone: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: { items: true, user: { select: { email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return {
      data: orders.map((o) => ({
        ...mapOrderSummary(o),
        customer: o.user,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  async recordStatusChange(
    orderId: string,
    toStatus: OrderStatus,
    fromStatus: OrderStatus | null,
    note: string | null,
    createdBy: string | null,
  ) {
    await prisma.orderStatusHistory.create({
      data: { orderId, fromStatus, toStatus, note, createdBy },
    });
  },

  async updateStatus(orderId: string, toStatus: OrderStatus, note: string | null, adminUserId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Order not found');

    const current = order.status as OrderStatus;
    if (current === toStatus) {
      return this.getById(orderId);
    }
    const allowed = VALID_TRANSITIONS[current] ?? [];
    if (!allowed.includes(toStatus)) {
      const fromAr = STATUS_LABEL_AR[current] ?? current;
      const toAr = STATUS_LABEL_AR[toStatus] ?? toStatus;
      const next = allowed.map((s) => STATUS_LABEL_AR[s] ?? s).join('، ') || 'لا توجد';
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        `لا يمكن تغيير الحالة من «${fromAr}» إلى «${toAr}». الحالات المتاحة: ${next}`,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: toStatus } });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: current,
          toStatus,
          note,
          createdBy: adminUserId,
        },
      });

      if (toStatus === 'cancelled' || toStatus === 'refunded') {
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment: item.quantity } },
            });
            await tx.inventoryHistory.create({
              data: {
                productId: item.productId,
                changeQty: item.quantity,
                reason: toStatus === 'refunded' ? 'refund' : 'adjustment',
                referenceId: orderId,
                adminUserId,
              },
            });
          }
        }
      }
    });

    await auditService.log({
      userId: adminUserId,
      action: `order.status.${toStatus}`,
      entityType: 'order',
      entityId: orderId,
      metadata: { from: current, to: toStatus, note },
    });

    if (toStatus === 'delivered' || toStatus === 'completed') {
      await loyaltyService.earnFromOrder(orderId);
      await referralService.grantOnFirstOrder(order.userId, orderId);
    }

    return this.getById(orderId);
  },

  generateOrderNumber() {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(Math.random() * 900000 + 100000);
    return `AN${y}${m}${rand}`;
  },

  getAutoTransition(paymentMethod: 'cod' | 'stripe' | 'meps', initialStatus: OrderStatus = 'pending'): OrderStatus | null {
    if (paymentMethod === 'cod' && initialStatus === 'pending') return 'processing';
    return null;
  },
};
