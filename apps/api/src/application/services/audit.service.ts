import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';

export const auditService = {
  async log(params: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
    ip?: string | null;
  }) {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        metadata: params.metadata ?? undefined,
        ip: params.ip ?? null,
      },
    });
  },

  async list(page = 1, limit = 50, entityType?: string) {
    const skip = (page - 1) * limit;
    const where = entityType ? { entityType } : {};
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return {
      data: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        metadata: l.metadata,
        ip: l.ip,
        createdAt: l.createdAt.toISOString(),
        user: l.user,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  async exportCsv(entityType?: string): Promise<string> {
    const logs = await prisma.auditLog.findMany({
      where: entityType ? { entityType } : {},
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });
    const header = 'id,action,entity_type,entity_id,user_email,created_at';
    const rows = logs.map((l) =>
      [
        l.id,
        l.action,
        l.entityType,
        l.entityId ?? '',
        l.user?.email ?? '',
        l.createdAt.toISOString(),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    return [header, ...rows].join('\n');
  },
};
