import { Router } from 'express';
import { updateOrderStatusSchema, PERMISSIONS } from '@half-dinar/shared';
import { orderService } from '../../application/services/order.service.js';
import { invoiceService } from '../../application/services/invoice.service.js';
import { param } from '../../shared/params.js';
import {
  asyncHandler,
  authenticate,
  requirePermission,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware.js';

export const ordersRouter = Router();

ordersRouter.use(authenticate);

ordersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const result = await orderService.listForUser((req as AuthenticatedRequest).user!.sub, page, limit);
    res.json(result);
  }),
);

ordersRouter.get(
  '/:id/invoice.pdf',
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.sub;
    const pdf = await invoiceService.generatePdf(param(req.params.id), userId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.id}.pdf"`);
    res.send(pdf);
  }),
);

ordersRouter.get(
  '/:id/invoice',
  asyncHandler(async (req, res) => {
    const userId = (req as AuthenticatedRequest).user!.sub;
    const html = await invoiceService.generateHtml(param(req.params.id), userId);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }),
);

ordersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await orderService.getById(
      param(req.params.id),
      (req as AuthenticatedRequest).user!.sub,
    );
    res.json({ data: order });
  }),
);

export const adminOrdersRouter = Router();

adminOrdersRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ORDERS_READ),
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const status = req.query.status as import('@half-dinar/shared').OrderStatus | undefined;
    const result = await orderService.listAdmin(page, limit, status);
    res.json(result);
  }),
);

adminOrdersRouter.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.ORDERS_READ),
  asyncHandler(async (req, res) => {
    const order = await orderService.getById(param(req.params.id));
    res.json({ data: order });
  }),
);

adminOrdersRouter.get(
  '/:id/invoice.pdf',
  authenticate,
  requirePermission(PERMISSIONS.ORDERS_READ),
  asyncHandler(async (req, res) => {
    const pdf = await invoiceService.generatePdf(param(req.params.id));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.id}.pdf"`);
    res.send(pdf);
  }),
);

adminOrdersRouter.get(
  '/:id/invoice',
  authenticate,
  requirePermission(PERMISSIONS.ORDERS_READ),
  asyncHandler(async (req, res) => {
    const html = await invoiceService.generateHtml(param(req.params.id));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }),
);

adminOrdersRouter.patch(
  '/:id/status',
  authenticate,
  requirePermission(PERMISSIONS.ORDERS_WRITE),
  asyncHandler(async (req, res) => {
    const input = updateOrderStatusSchema.parse(req.body);
    const order = await orderService.updateStatus(
      param(req.params.id),
      input.status,
      input.note ?? null,
      (req as AuthenticatedRequest).user!.sub,
    );
    res.json({ data: order });
  }),
);
