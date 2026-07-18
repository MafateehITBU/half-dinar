import type { ContactSubmitInput } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';

function mapMessage(m: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    subject: m.subject,
    message: m.message,
    status: m.status,
    readAt: m.readAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

export const contactService = {
  async submit(input: ContactSubmitInput) {
    const row = await prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone ?? null,
        subject: input.subject ?? null,
        message: input.message,
      },
    });
    return mapMessage(row);
  },

  async adminList(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where =
      status && status !== 'all'
        ? { status: status as 'new' | 'read' | 'archived' }
        : undefined;

    const [total, rows] = await Promise.all([
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: rows.map(mapMessage),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  async adminGet(id: string) {
    const row = await prisma.contactMessage.findUnique({ where: { id } });
    if (!row) return null;
    return mapMessage(row);
  },

  async adminUpdateStatus(id: string, status: 'new' | 'read' | 'archived') {
    const row = await prisma.contactMessage.update({
      where: { id },
      data: {
        status,
        readAt: status === 'new' ? null : new Date(),
      },
    });
    return mapMessage(row);
  },

  async adminCountNew() {
    return prisma.contactMessage.count({ where: { status: 'new' } });
  },
};
