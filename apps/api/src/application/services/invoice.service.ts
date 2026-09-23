import PDFDocument from 'pdfkit';
import { BRAND } from '@half-dinar/shared';
import { prisma } from '../../config/database.js';
import { AppError, ErrorCodes } from '../../shared/errors.js';
import { decimalToNumber } from '../../shared/utils.js';

async function loadOrderForInvoice(orderId: string, userId?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: { select: { email: true, firstName: true, lastName: true, phone: true } },
    },
  });
  if (!order) throw new AppError(404, ErrorCodes.NOT_FOUND, 'Order not found');
  if (userId && order.userId !== userId) {
    throw new AppError(403, ErrorCodes.FORBIDDEN, 'Access denied');
  }
  return order;
}

function formatAddress(addr: Record<string, unknown> | null) {
  if (!addr) return '—';
  const parts = [
    addr.governorate,
    addr.city,
    addr.street,
    addr.building,
    addr.phone,
  ].filter(Boolean);
  return parts.join('، ');
}

export const invoiceService = {
  async generateHtml(orderId: string, userId?: string): Promise<string> {
    const order = await loadOrderForInvoice(orderId, userId);
    const addr = order.shippingAddress as Record<string, unknown> | null;
    const subtotal = decimalToNumber(order.subtotal);
    const shipping = decimalToNumber(order.shippingAmount);
    const discount = decimalToNumber(order.discountAmount);
    const total = decimalToNumber(order.total);
    const date = order.createdAt.toLocaleString('ar-JO');

    const rows = order.items
      .map(
        (i) => `
      <tr>
        <td>${i.name}</td>
        <td>${i.sku ?? '—'}</td>
        <td>${i.quantity}</td>
        <td>${decimalToNumber(i.unitPrice).toFixed(2)}</td>
        <td>${decimalToNumber(i.total).toFixed(2)}</td>
      </tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>فاتورة ${order.orderNumber}</title>
  <style>
    body { font-family: 'Cairo', Tahoma, sans-serif; padding: 40px; color: #0f172a; }
    h1 { color: #0d9488; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: right; }
    th { background: #f1f5f9; }
    .totals { margin-top: 24px; max-width: 320px; margin-right: auto; }
    .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
    .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #0d9488; margin-top: 8px; padding-top: 8px; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" />
</head>
<body>
  <button class="no-print" onclick="window.print()" style="margin-bottom:20px;padding:8px 16px;background:#0d9488;color:white;border:none;border-radius:6px;cursor:pointer">طباعة / حفظ PDF</button>
  <h1>${BRAND.nameAr}</h1>
  <p>${BRAND.nameEn} — فاتورة ضريبية مبسطة</p>
  <p><strong>رقم الطلب:</strong> ${order.orderNumber}</p>
  <p><strong>التاريخ:</strong> ${date}</p>
  <p><strong>العميل:</strong> ${order.user.firstName} ${order.user.lastName} (${order.user.email})</p>
  <p><strong>عنوان التوصيل:</strong> ${formatAddress(addr)}</p>
  <p><strong>طريقة الدفع:</strong> ${order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'بطاقة (MEPS)'}</p>
  <table>
    <thead>
      <tr><th>المنتج</th><th>SKU</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div><span>المجموع الفرعي</span><span>${subtotal.toFixed(2)} ${BRAND.currency}</span></div>
    <div><span>التوصيل</span><span>${shipping.toFixed(2)} ${BRAND.currency}</span></div>
    ${discount > 0 ? `<div><span>الخصم</span><span>-${discount.toFixed(2)} ${BRAND.currency}</span></div>` : ''}
    ${order.loyaltyPointsUsed > 0 ? `<div><span>نقاط ولاء (${order.loyaltyPointsUsed})</span><span>—</span></div>` : ''}
    <div class="total"><span>الإجمالي</span><span>${total.toFixed(2)} ${BRAND.currency}</span></div>
  </div>
  <p style="margin-top:40px;font-size:12px;color:#64748b">شكراً لتسوقكم من ${BRAND.nameAr}</p>
</body>
</html>`;
  },

  async generatePdf(orderId: string, userId?: string): Promise<Buffer> {
    const order = await loadOrderForInvoice(orderId, userId);
    const addr = order.shippingAddress as Record<string, unknown> | null;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text(BRAND.nameEn, { align: 'left' });
      doc.fontSize(10).text('Invoice / فاتورة', { align: 'left' });
      doc.moveDown();
      doc.fontSize(11);
      doc.text(`Order: ${order.orderNumber}`);
      doc.text(`Date: ${order.createdAt.toISOString()}`);
      doc.text(`Customer: ${order.user.firstName} ${order.user.lastName} <${order.user.email}>`);
      doc.text(`Ship to: ${formatAddress(addr)}`);
      doc.text(`Payment: ${order.paymentMethod}`);
      doc.moveDown();

      doc.fontSize(10).text('Items:', { underline: true });
      doc.moveDown(0.5);
      for (const item of order.items) {
        doc.text(
          `${item.name} | SKU: ${item.sku ?? '—'} | Qty: ${item.quantity} | ${decimalToNumber(item.total).toFixed(2)} ${BRAND.currency}`,
        );
      }
      doc.moveDown();
      doc.text(`Subtotal: ${decimalToNumber(order.subtotal).toFixed(2)} ${BRAND.currency}`);
      doc.text(`Shipping: ${decimalToNumber(order.shippingAmount).toFixed(2)} ${BRAND.currency}`);
      if (decimalToNumber(order.discountAmount) > 0) {
        doc.text(`Discount: -${decimalToNumber(order.discountAmount).toFixed(2)} ${BRAND.currency}`);
      }
      doc.fontSize(12).text(`Total: ${decimalToNumber(order.total).toFixed(2)} ${BRAND.currency}`, {
        underline: true,
      });

      doc.end();
    });
  },
};
