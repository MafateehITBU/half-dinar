import type { CreateRefundInput, ModerateRefundInput } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { decimalToNumber } from '../../shared/utils.js';
import { orderService } from './order.service.js';
import { auditService } from './audit.service.js';

const ELIGIBLE_STATUSES = ['delivered', 'completed'] as const;
const REFUND_WINDOW_DAYS = 14;

async function getRefundWindowDays() {
  const setting = await prisma.setting.findUnique({ where: { key: 'refund_window_days' } });
  const val = setting?.value;
  return typeof val === 'number' ? val : REFUND_WINDOW_DAYS;
}

function mapRefund(r: {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  status: string;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  evidence: { id: string; imageUrl: string }[];
  order?: { orderNumber: string; total: Parameters<typeof decimalToNumber>[0]; status: string };
}) {
  return {
    id: r.id,
    orderId: r.orderId,
    userId: r.userId,
    reason: r.reason,
    status: r.status,
    adminNotes: r.adminNotes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    evidence: r.evidence,
    order: r.order
      ? {
          orderNumber: r.order.orderNumber,
          total: decimalToNumber(r.order.total),
          status: r.order.status,
        }
      : undefined,
  };
}

export const refundService = {
  async create(userId: string, input: CreateRefundInput) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { refundRequests: true },
    });
    if (!order || order.userId !== userId) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Order not found');
    }
    if (!ELIGIBLE_STATUSES.includes(order.status as (typeof ELIGIBLE_STATUSES)[number])) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Order is not eligible for refund');
    }

    const windowDays = await getRefundWindowDays();
    const cutoff = new Date(Date.now() - windowDays * 86400000);
    if (order.createdAt < cutoff) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, `Refund window is ${windowDays} days`);
    }

    const open = order.refundRequests.find((r) =>
      ['requested', 'under_review', 'approved'].includes(r.status),
    );
    if (open) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'A refund request already exists for this order');
    }

    const refund = await prisma.$transaction(async (tx) => {
      const created = await tx.refundRequest.create({
        data: {
          orderId: input.orderId,
          userId,
          reason: input.reason,
          status: 'requested',
        },
      });
      if (input.imageUrls?.length) {
        await tx.refundEvidence.createMany({
          data: input.imageUrls.map((url) => ({
            refundRequestId: created.id,
            imageUrl: url,
          })),
        });
      }
      return tx.refundRequest.findUniqueOrThrow({
        where: { id: created.id },
        include: { evidence: true, order: true },
      });
    });

    return mapRefund(refund);
  },

  async listForUser(userId: string) {
    const refunds = await prisma.refundRequest.findMany({
      where: { userId },
      include: { evidence: true, order: true },
      orderBy: { createdAt: 'desc' },
    });
    return refunds.map(mapRefund);
  },

  async listAdmin(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as 'requested' | 'under_review' | 'approved' | 'rejected' } : {};
    const [total, refunds] = await Promise.all([
      prisma.refundRequest.count({ where }),
      prisma.refundRequest.findMany({
        where,
        include: {
          evidence: true,
          order: true,
          user: { select: { email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return {
      data: refunds.map((r) => ({
        ...mapRefund(r),
        user: r.user,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  async moderate(refundId: string, adminUserId: string, input: ModerateRefundInput, ip?: string) {
    const refund = await prisma.refundRequest.findUnique({
      where: { id: refundId },
      include: { order: true, evidence: true },
    });
    if (!refund) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Refund request not found');

    if (input.status === 'approved' && refund.status !== 'approved') {
      if (refund.order.status !== 'refunded') {
        await orderService.updateStatus(refund.orderId, 'refunded', 'Refund approved', adminUserId);
      }
      await prisma.order.update({
        where: { id: refund.orderId },
        data: { paymentStatus: 'refunded' },
      });
    }

    const updated = await prisma.refundRequest.update({
      where: { id: refundId },
      data: {
        status: input.status,
        adminNotes: input.adminNotes,
      },
      include: { evidence: true, order: true },
    });

    await auditService.log({
      userId: adminUserId,
      action: `refund.${input.status}`,
      entityType: 'refund_request',
      entityId: refundId,
      metadata: { orderId: refund.orderId, adminNotes: input.adminNotes },
      ip,
    });

    return mapRefund(updated);
  },
};
