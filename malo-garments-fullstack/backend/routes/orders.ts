/*
 * Malo Garments — Orders Routes (Prisma)
 * POST / · GET /mine · GET / (admin) · GET /:id · PATCH /:id/status
 */
import express from 'express';
import prisma from '../config/prisma';
import { authenticateCustomer, authenticateAdmin, optionalCustomerAuth } from '../middleware/auth';
import { priceDesign } from '../config/designPricing';
import { isOnlineMethod, onlineDiscount, normaliseMethod, cleanRef, refError } from '../config/payments';
import {
  sendNewOrderNotification, sendOrderConfirmationEmail, sendOrderStatusUpdate,
  sendPaymentSubmittedToAdmin, sendPaymentConfirmedToCustomer, sendPaymentRejectedToCustomer,
} from '../services/emailService';

const router = express.Router();
const VALID_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

/* Normalise an order + items to frontend shape.
 * Supplier / cost details (dropshipping) are only included for the admin. */
const ITEM_SUPPLIER = ['is_dropship', 'cost_price', 'supplier_name', 'supplier_phone', 'supplier_url', 'supplier_sku'];
const ORDER_SUPPLIER = ['supplier_status', 'supplier_ref', 'supplier_sent_at'];
const shapeOrder = (order: any, admin = false) => {
  const out: any = {
  ...order,
  subtotal: Number(order.subtotal),
  shipping: Number(order.shipping),
  discount: Number(order.discount ?? 0),
  total:    Number(order.total),
  createdAt: order.created_at,
  customer: {
    name:    order.customer_name,
    email:   order.customer_email,
    phone:   order.customer_phone,
    address: order.address,
    city:    order.city,
    state:   order.state,
    zip:     order.zip,
    country: order.country,
  },
  items: (order.items || []).map((i: any) => {
    const item: any = { ...i, price: Number(i.price) };
    if (admin) item.cost_price = i.cost_price != null ? Number(i.cost_price) : null;
    else ITEM_SUPPLIER.forEach(f => delete item[f]);
    return item;
  }),
  };
  if (!admin) ORDER_SUPPLIER.forEach(f => delete out[f]);
  return out;
};

/* POST /api/orders — guest or logged-in checkout */
router.post('/', optionalCustomerAuth, async (req, res) => {
  const o = req.body;
  if (!Array.isArray(o.items) || !o.items.length)
    return res.status(400).json({ error: 'Cart is empty.' });
  if (!o.name || !o.email || !o.phone || !o.address || !o.city)
    return res.status(400).json({ error: 'Name, email, phone, address and city are required.' });

  try {
    // Validate & resolve items (server-side price, stock check)
    const resolvedItems: any[] = [];
    for (const ci of o.items) {
      const qty = Number(ci.quantity) || 0;
      if (qty < 1)
        return res.status(400).json({ error: `Invalid quantity for ${ci.name || 'an item'}.` });

      // Design Studio item — not a real Product row, price from the fixed table.
      if (!ci.productId && ci.customType) {
        // Server-side price: base + pattern + style options + size + colour. Client price is never trusted.
        const price = priceDesign(ci.customType, ci.customization);
        if (!price)
          return res.status(400).json({ error: `Unknown custom design type: ${ci.customType}.` });
        resolvedItems.push({
          product_id: null,
          name:       ci.name || `Custom ${ci.customType}`,
          image:      ci.image || '',
          price,
          size:       ci.size  || '',
          color:      ci.color || '',
          quantity:   qty,
        });
        continue;
      }

      const product = await prisma.product.findUnique({ where: { id: ci.productId } });
      if (!product)
        return res.status(400).json({ error: `Product ${ci.productId} is no longer available.` });
      // Dropship: the supplier holds the stock, so there is nothing to check or reserve here.
      if (!product.is_dropship && product.stock < qty)
        return res.status(400).json({ error: `Not enough stock for ${product.name} (only ${product.stock} left).` });

      const imgs = product.images ?? [];
      resolvedItems.push({
        product_id: product.id,
        name:       product.name,
        image:      Array.isArray(imgs) ? (imgs[0] || '') : '',
        price:      Number(product.price),
        size:       ci.size  || '',
        color:      ci.color || '',
        quantity:   qty,
        // snapshot of the supplier at order time (admin-only)
        is_dropship:    product.is_dropship,
        cost_price:     product.supplier_price,
        supplier_name:  product.supplier_name,
        supplier_phone: product.supplier_phone,
        supplier_url:   product.supplier_url,
        supplier_sku:   product.supplier_sku,
      });
    }

    const subtotal = resolvedItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const method   = normaliseMethod(o.paymentMethod);
    // Paying online (JazzCash / EasyPaisa / bank transfer) earns a discount on the items — computed here, never trusted from the client.
    const discount = isOnlineMethod(method) ? onlineDiscount(subtotal) : 0;
    const shipping = subtotal >= 5000 ? 0 : 250;
    const total    = subtotal - discount + shipping;
    const orderId  = 'ORD-' + Date.now().toString().slice(-6);

    // A login token can outlive its account (e.g. after a DB reset) — then place the order as a guest instead of failing.
    const userId = req.user && (await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true } })) ? req.user.id : null;

    // Wrap in a Prisma interactive transaction
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          id:             orderId,
          user_id:        userId,
          customer_name:  o.name,
          customer_email: o.email,
          customer_phone: o.phone,
          address:        o.address,
          city:           o.city,
          state:          o.state   || '',
          zip:            o.zip     || '',
          country:        o.country || 'Pakistan',
          subtotal,
          shipping,
          discount,
          total,
          payment_method: method,
          payment_status: isOnlineMethod(method) ? 'awaiting' : 'not_required',
          notes:          o.notes || null,
          items: {
            create: resolvedItems.map((item) => ({
              product_id: item.product_id,
              name:       item.name,
              image:      item.image,
              price:      item.price,
              size:       item.size,
              color:      item.color,
              quantity:   item.quantity,
              is_dropship:    Boolean(item.is_dropship),
              cost_price:     item.cost_price ?? null,
              supplier_name:  item.supplier_name ?? null,
              supplier_phone: item.supplier_phone ?? null,
              supplier_url:   item.supplier_url ?? null,
              supplier_sku:   item.supplier_sku ?? null,
            })),
          },
        },
        include: { items: true },
      });

      // Decrement stock (skip Design Studio items — they have no real Product row)
      for (const item of resolvedItems) {
        if (!item.product_id || item.is_dropship) continue;   // dropship stock lives with the supplier
        await tx.product.update({
          where: { id: item.product_id },
          data:  { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    // Email notifications (non-blocking)
    sendNewOrderNotification(order, order.items).catch(() => {});
    sendOrderConfirmationEmail(order, order.items).catch(() => {});

    res.status(201).json({ success: true, id: order.id, subtotal, shipping, discount, total, paymentMethod: order.payment_method || method, paymentStatus: order.payment_status });
  } catch (err: any) {
    console.error('POST /orders:', err);
    res.status(500).json({ error: 'Something went wrong placing your order.' });
  }
});

/* GET /api/orders — admin, all orders */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include:  { items: true },
      orderBy:  { created_at: 'desc' },
    });
    res.json(orders.map(o => shapeOrder(o, true)));   // admin: includes supplier details
  } catch (err: any) {
    console.error('GET /orders:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* GET /api/orders/mine — customer */
router.get('/mine', authenticateCustomer, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where:   { user_id: req.user!.id, hidden_by_customer: false },
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });
    res.json(orders.map(o => shapeOrder(o)));
  } catch (err: any) {
    console.error('GET /orders/mine:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* DELETE /api/orders/:id — customer removes a finished order from "My Orders".
 * Soft delete: the order stays in the database for the admin (sales, returns, accounting). */
const FINISHED = ['Delivered', 'Cancelled'];
router.delete('/:id', authenticateCustomer, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, select: { user_id: true, status: true } });
    if (!order || order.user_id !== req.user!.id) return res.status(404).json({ error: 'Order not found.' });
    if (!FINISHED.includes(order.status))
      return res.status(400).json({ error: 'Only delivered or cancelled orders can be removed.' });
    await prisma.order.update({ where: { id: req.params.id }, data: { hidden_by_customer: true } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /orders/:id:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* GET /api/orders/:id */
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where:   { id: req.params.id },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(shapeOrder(order));
  } catch (err: any) {
    console.error('GET /orders/:id:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* PATCH /api/orders/:id/status — admin */
router.patch('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });

    const before = await prisma.order.findUnique({ where: { id: req.params.id }, select: { status: true } });
    if (!before) return res.status(404).json({ error: 'Order not found.' });

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data:  { status },
      include: { items: true },
    });

    // Email the customer only when the status actually changed (no repeat emails on re-select).
    if (before.status !== status) sendOrderStatusUpdate(order, status, order.items).catch(() => {});
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === 'P2025')
      return res.status(404).json({ error: 'Order not found.' });
    console.error('PATCH /orders/:id/status:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* POST /api/orders/:id/payment — customer says "I have paid" and gives the transaction reference.
 * Emails the admin so they can check their wallet / bank and confirm. */
router.post('/:id/payment', async (req, res) => {
  try {
    const { email, reference } = req.body || {};
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (!isOnlineMethod(order.payment_method))
      return res.status(400).json({ error: 'This order is Cash on Delivery — no online payment needed.' });
    if (String(email || '').trim().toLowerCase() !== String(order.customer_email || '').trim().toLowerCase())
      return res.status(403).json({ error: 'The email does not match this order.' });
    if (order.payment_status === 'confirmed')
      return res.json({ success: true, payment_status: 'confirmed' });

    const ref = cleanRef(reference);
    const invalid = refError(order.payment_method, ref);
    if (invalid) return res.status(400).json({ error: invalid });

    // The same receipt cannot pay for two orders.
    const reused = await prisma.order.findFirst({ where: { payment_ref: ref, NOT: { id: order.id } }, select: { id: true } });
    if (reused) return res.status(409).json({ error: 'This transaction ID has already been used for another order.' });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data:  { payment_ref: ref.slice(0, 120), payment_status: 'submitted', payment_submitted_at: new Date() },
      include: { items: true },
    });
    sendPaymentSubmittedToAdmin(updated, updated.items).catch(() => {});
    res.json({ success: true, payment_status: 'submitted' });
  } catch (err: any) {
    console.error('POST /orders/:id/payment:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* PATCH /api/orders/:id/supplier — admin marks a dropship order as placed with / shipped by the supplier.
 * Manual on purpose: the admin places the order on the supplier's site themselves. */
const SUPPLIER_STATUSES = ['placed', 'shipped'];
router.patch('/:id/supplier', authenticateAdmin, async (req, res) => {
  try {
    const { status, ref } = req.body || {};
    if (status != null && status !== '' && !SUPPLIER_STATUSES.includes(status))
      return res.status(400).json({ error: "status must be 'placed', 'shipped' or empty." });
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, select: { supplier_sent_at: true } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        supplier_status: status || null,
        ...(ref !== undefined ? { supplier_ref: String(ref).trim().slice(0, 120) || null } : {}),
        supplier_sent_at: status ? (order.supplier_sent_at ?? new Date()) : null,
      },
      select: { supplier_status: true, supplier_ref: true, supplier_sent_at: true },
    });
    res.json({ success: true, ...updated });
  } catch (err: any) {
    console.error('PATCH /orders/:id/supplier:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* PATCH /api/orders/:id/payment — admin confirms the money arrived (or says it did not) */
router.patch('/:id/payment', authenticateAdmin, async (req, res) => {
  try {
    const { action } = req.body || {};
    if (action !== 'confirm' && action !== 'reject')
      return res.status(400).json({ error: "action must be 'confirm' or 'reject'." });

    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (!isOnlineMethod(order.payment_method))
      return res.status(400).json({ error: 'This order is Cash on Delivery.' });

    const updated = action === 'confirm'
      ? await prisma.order.update({
          where: { id: order.id },
          data: {
            payment_status: 'confirmed',
            payment_confirmed_at: new Date(),
            status: order.status === 'Pending' ? 'Processing' : order.status,
          },
          include: { items: true },
        })
      : await prisma.order.update({
          where: { id: order.id },
          data: { payment_status: 'rejected' },
          include: { items: true },
        });

    if (action === 'confirm') sendPaymentConfirmedToCustomer(updated, updated.items).catch(() => {});
    else sendPaymentRejectedToCustomer(updated).catch(() => {});
    res.json({ success: true, payment_status: updated.payment_status, status: updated.status });
  } catch (err: any) {
    console.error('PATCH /orders/:id/payment:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

export default router;
