/*
 * ══════════════════════════════════════════════════════════════
 * Malo Garments — Email Notification Service
 *
 * Sends order notifications to admin when a new order is placed.
 *
 * Setup (.env):
 *   EMAIL_HOST=smtp.gmail.com
 *   EMAIL_PORT=587
 *   EMAIL_USER=your@gmail.com
 *   EMAIL_PASS=your_app_password   ← Gmail App Password (not account password)
 *   ADMIN_EMAIL=admin@yourdomain.com
 *
 * Gmail setup:
 *   1. Enable 2-Step Verification on your Google account
 *   2. Go to: myaccount.google.com/apppasswords
 *   3. Create App Password for "Mail"
 *   4. Paste that 16-char password as EMAIL_PASS
 * ══════════════════════════════════════════════════════════════
 */
import nodemailer, { type Transporter } from 'nodemailer';

interface OrderItemLike {
  name: string;
  image?: string;
  size?: string;
  quantity: number;
  price: any;
}

interface OrderLike {
  id: string;
  total: any;
  subtotal: any;
  shipping: any;
  discount?: any;
  payment_method?: string | null;
  payment_status?: string | null;
  payment_ref?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  notes?: string | null;
  customer?: { email?: string };
}

// Lazy-create transporter so server boots even without email config
let _transporter: Transporter | null = null;

const PLACEHOLDER_VALUES = new Set(['your_gmail@gmail.com', 'your_16_char_app_password']);

function getTransporter(): Transporter | null {
  if (_transporter) return _transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass || PLACEHOLDER_VALUES.has(user) || PLACEHOLDER_VALUES.has(pass)) {
    return null; // email not configured (or still holding .env.example placeholders) — skip silently
  }

  _transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return _transporter;
}

// ─── Format price helper ────────────────────────────────────────────────────
const fmt = (n: number | string) => `Rs. ${Number(n).toLocaleString('en-PK')}`;
const paymentLabel = (method = 'cod'): string => ({
  cod: 'Cash on Delivery',
  jazzcash: 'NayaPay',
  easypaisa: 'EasyPaisa',
  bank_transfer: 'Bank Transfer',
  card: 'Card Payment',
} as Record<string, string>)[method] || 'Cash on Delivery';

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const ONLINE = ['jazzcash', 'easypaisa', 'bank_transfer'];
const isOnline = (m?: string | null) => ONLINE.includes(String(m || ''));

/** "Online payment discount" row for totals boxes (empty when there is none). */
const discountRow = (order: OrderLike) => Number(order.discount) > 0
  ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#2e7d32;"><span>Online payment discount</span><span>− ${fmt(order.discount)}</span></div>`
  : '';

/** For online orders: how to pay + link to submit the transaction id. */
const payNowBlock = (order: OrderLike) => isOnline(order.payment_method) && order.payment_status !== 'confirmed'
  ? `<div style="background:#fff8e1;border-radius:10px;padding:16px 20px;margin-bottom:24px;border-left:4px solid #f0ad4e;">
       <p style="margin:0 0 8px;color:#555;"><strong>One more step:</strong> send <strong>${fmt(order.total)}</strong> via ${paymentLabel(order.payment_method || '')} and submit your transaction ID so we can confirm your payment.</p>
       <a href="${FRONTEND_URL}/payment?orderId=${order.id}" style="display:inline-block;background:#7a1f3d;color:white;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Pay &amp; submit transaction ID →</a>
     </div>`
  : '';

const emailShell = (title: string, body: string) => `
  <div style="max-width:600px;margin:30px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);font-family:Arial,sans-serif;">
    <div style="background:#2d2d2d;padding:24px 32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:20px;">✦ Malo Garments</h1>
      <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:2px;">${title}</p>
    </div>
    ${body}
    <div style="background:#f5f5f5;padding:16px 32px;text-align:center;">
      <p style="color:#aaa;margin:0;font-size:12px;">Malo Garments • support@malogarments.com</p>
    </div>
  </div>`;

// ─── Admin new order notification ───────────────────────────────────────────

/**
 * Send a new order notification email to the admin.
 * Fails silently if email is not configured.
 */
export async function sendNewOrderNotification(order: OrderLike, items: OrderItemLike[] = []): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[email] Email not configured — skipping order notification. Set EMAIL_USER and EMAIL_PASS in .env');
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail) return;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:10px 12px; border-bottom:1px solid #f0ebe5;">
        <img src="${item.image || ''}" alt="${item.name}" style="width:50px;height:62px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:10px;" />
        ${item.name}
      </td>
      <td style="padding:10px 12px; border-bottom:1px solid #f0ebe5; text-align:center;">${item.size || '—'}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #f0ebe5; text-align:center;">${item.quantity}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #f0ebe5; text-align:right; font-weight:600;">${fmt(Number(item.price) * item.quantity)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin:0;padding:0;background:#f5ede3;font-family:'Poppins',Arial,sans-serif;">

      <div style="max-width:600px;margin:30px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background:#2d2d2d;padding:28px 32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;font-weight:600;letter-spacing:1px;">
            ✦ Malo Garments
          </h1>
          <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Admin Notification</p>
        </div>

        <!-- Alert Banner -->
        <div style="background:#c97b7b;padding:16px 32px;text-align:center;">
          <h2 style="color:white;margin:0;font-size:18px;">🛍️ New Order Received!</h2>
        </div>

        <!-- Order Info -->
        <div style="padding:32px;">
          <div style="background:#fff8f0;border-radius:10px;padding:20px;margin-bottom:24px;border-left:4px solid #c97b7b;">
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;">
              <div>
                <p style="margin:0;font-size:12px;color:#aaa;text-transform:uppercase;letter-spacing:1px;">Order ID</p>
                <p style="margin:4px 0 0;font-weight:700;font-size:18px;color:#2d2d2d;">${order.id}</p>
              </div>
              <div>
                <p style="margin:0;font-size:12px;color:#aaa;text-transform:uppercase;letter-spacing:1px;">Order Total</p>
                <p style="margin:4px 0 0;font-weight:700;font-size:18px;color:#c97b7b;">${fmt(order.total)}</p>
              </div>
              <div>
                <p style="margin:0;font-size:12px;color:#aaa;text-transform:uppercase;letter-spacing:1px;">Payment</p>
                <p style="margin:4px 0 0;font-weight:600;color:#2d2d2d;">${order.payment_method === 'cod' ? '💵' : '💳'} ${paymentLabel(order.payment_method || 'cod')}</p>
              </div>
            </div>
          </div>

          <!-- Customer Info -->
          <h3 style="color:#2d2d2d;font-size:15px;margin:0 0 14px;border-bottom:2px solid #f0ebe5;padding-bottom:10px;">👤 Customer Details</h3>
          <table style="width:100%;font-size:14px;margin-bottom:28px;">
            <tr><td style="padding:5px 0;color:#777;width:120px;">Name</td><td style="padding:5px 0;font-weight:500;">${order.customer_name}</td></tr>
            <tr><td style="padding:5px 0;color:#777;">Email</td><td style="padding:5px 0;">${order.customer_email}</td></tr>
            <tr><td style="padding:5px 0;color:#777;">Phone</td><td style="padding:5px 0;">${order.customer_phone}</td></tr>
            <tr><td style="padding:5px 0;color:#777;">Address</td><td style="padding:5px 0;">${order.address}, ${order.city}${order.state ? ', ' + order.state : ''} ${order.zip || ''}</td></tr>
            ${order.notes ? `<tr><td style="padding:5px 0;color:#777;">Notes</td><td style="padding:5px 0;font-style:italic;">${order.notes}</td></tr>` : ''}
          </table>

          <!-- Items -->
          <h3 style="color:#2d2d2d;font-size:15px;margin:0 0 14px;border-bottom:2px solid #f0ebe5;padding-bottom:10px;">📦 Order Items</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
            <thead>
              <tr style="background:#fff8f0;">
                <th style="padding:10px 12px;text-align:left;color:#777;font-weight:600;font-size:12px;text-transform:uppercase;">Product</th>
                <th style="padding:10px 12px;text-align:center;color:#777;font-weight:600;font-size:12px;text-transform:uppercase;">Size</th>
                <th style="padding:10px 12px;text-align:center;color:#777;font-weight:600;font-size:12px;text-transform:uppercase;">Qty</th>
                <th style="padding:10px 12px;text-align:right;color:#777;font-weight:600;font-size:12px;text-transform:uppercase;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <!-- Totals -->
          <div style="background:#f5f5f5;border-radius:10px;padding:16px 20px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#777;">
              <span>Subtotal</span><span>${fmt(order.subtotal)}</span>
            </div>
            ${discountRow(order)}
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;color:#777;">
              <span>Shipping</span><span>${Number(order.shipping) === 0 ? 'Free' : fmt(order.shipping)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#2d2d2d;border-top:2px solid #e0e0e0;padding-top:12px;">
              <span>Total</span><span style="color:#c97b7b;">${fmt(order.total)}</span>
            </div>
          </div>

          <!-- CTA -->
          <div style="text-align:center;margin-top:28px;">
            <a href="${FRONTEND_URL}/admin/orders" style="display:inline-block;background:#c97b7b;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase;">
              View in Admin Panel →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#2d2d2d;padding:20px 32px;text-align:center;">
          <p style="color:rgba(255,255,255,0.4);margin:0;font-size:12px;">
            Malo Garments Admin Notification • Order placed on ${new Date().toLocaleString('en-PK')}
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from:    `"Malo Garments Store" <${process.env.EMAIL_USER}>`,
      to:      adminEmail,
      subject: `🛍️ New Order #${order.id} — ${fmt(order.total)} from ${order.customer_name}`,
      html,
    });
    console.log(`[email] ✅ Order notification sent to ${adminEmail} for order ${order.id}`);
  } catch (err: any) {
    console.error(`[email] ❌ Failed to send order notification:`, err.message);
  }
}

// ─── Customer order confirmation email ───────────────────────────────────────

export async function sendOrderConfirmationEmail(order: OrderLike, items: OrderItemLike[] = []): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;

  const customerEmail = order.customer_email || order.customer?.email;
  if (!customerEmail) return;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:10px 12px; border-bottom:1px solid #f0ebe5;">${item.name}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #f0ebe5; text-align:center;">${item.quantity}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #f0ebe5; text-align:right;">${fmt(Number(item.price) * item.quantity)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="max-width:640px;margin:30px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);font-family:Arial,sans-serif;">
      <div style="background:#2d2d2d;padding:24px 32px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:22px;">✦ Malo Garments</h1>
      </div>
      <div style="padding:32px;">
        <div style="background:#fff8f0;border-radius:10px;padding:16px 20px;margin-bottom:24px;border-left:4px solid #c97b7b;">
          <h2 style="margin:0 0 8px;color:#2d2d2d;">✅ Order received</h2>
          <p style="margin:0;color:#555;">Thank you for shopping with us. Your order <strong>#${order.id}</strong> has been placed successfully.</p>
        </div>

        <p style="margin:0 0 18px;color:#555;">Payment method: <strong>${paymentLabel(order.payment_method || 'cod')}</strong></p>
        ${payNowBlock(order)}

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
          <thead>
            <tr style="background:#fff8f0;">
              <th style="padding:10px 12px;text-align:left;color:#777;font-size:12px;text-transform:uppercase;">Product</th>
              <th style="padding:10px 12px;text-align:center;color:#777;font-size:12px;text-transform:uppercase;">Qty</th>
              <th style="padding:10px 12px;text-align:right;color:#777;font-size:12px;text-transform:uppercase;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="background:#f5f5f5;border-radius:10px;padding:16px 20px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#777;"><span>Subtotal</span><span>${fmt(order.subtotal)}</span></div>${discountRow(order)}
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;color:#777;"><span>Shipping</span><span>${Number(order.shipping) === 0 ? 'Free' : fmt(order.shipping)}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#2d2d2d;border-top:2px solid #e0e0e0;padding-top:12px;"><span>Total</span><span style="color:#c97b7b;">${fmt(order.total)}</span></div>
        </div>

        <p style="margin:24px 0 0;color:#666;font-size:14px;">We’ll keep you updated as your order moves through processing.</p>
      </div>
      <div style="background:#2d2d2d;padding:20px 32px;text-align:center;">
        <p style="color:rgba(255,255,255,0.4);margin:0;font-size:12px;">Malo Garments • support@malogarments.com</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Malo Garments" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `Your order #${order.id} is confirmed`,
      html,
    });
    console.log(`[email] ✅ Confirmation sent to ${customerEmail}`);
  } catch (err: any) {
    console.error(`[email] ❌ Failed to send order confirmation:`, err.message);
  }
}

// ─── Contact form → store inbox ─────────────────────────────────────────────

/** Emails a contact-form message to the store. Returns 'sent', or 'unavailable' when email is off/failed. */
export async function sendContactMessage(m: { name: string; email: string; phone?: string; subject?: string; message: string }): Promise<'sent' | 'unavailable'> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[email] Email not configured — contact message not emailed. Set EMAIL_USER and EMAIL_PASS in .env');
    return 'unavailable';
  }
  const e = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);
  const row = (k: string, v?: string) => v ? `<tr><td style="padding:6px 12px 6px 0;color:#888;font-size:13px;white-space:nowrap;">${k}</td><td style="padding:6px 0;font-size:14px;color:#2d2d2d;">${e(v)}</td></tr>` : '';
  const body = `
    <div style="padding:28px 32px;">
      <h2 style="margin:0 0 16px;color:#2d2d2d;font-size:20px;">New message from the website</h2>
      <table style="border-collapse:collapse;margin-bottom:18px;">${row('Name', m.name)}${row('Email', m.email)}${row('Phone', m.phone)}${row('Topic', m.subject)}</table>
      <div style="background:#fdf6f6;border-left:4px solid #c97b7b;border-radius:8px;padding:14px 18px;color:#444;font-size:14px;line-height:1.6;white-space:pre-wrap;">${e(m.message)}</div>
      <p style="color:#999;font-size:12px;margin:18px 0 0;">Just hit reply to answer ${e(m.name)} directly.</p>
    </div>`;
  try {
    await transporter.sendMail({
      from: `"Malo Garments Website" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      replyTo: `"${m.name.replace(/"/g, '')}" <${m.email}>`,
      subject: `✉️ ${m.subject || 'Website message'} — ${m.name}`,
      html: emailShell('Contact form', body),
    });
    console.log(`[email] ✅ Contact message from ${m.email} delivered`);
    return 'sent';
  } catch (err: any) {
    console.error('[email] ❌ Failed to send contact message:', err.message);
    return 'unavailable';
  }
}


// ─── Order status update notification to customer ───────────────────────────

/** Delivery window promised in the "Shipped" email — set DELIVERY_DAYS_MIN / DELIVERY_DAYS_MAX in .env. */
const DELIVERY_MIN = Number(process.env.DELIVERY_DAYS_MIN) || 3;
const DELIVERY_MAX = Math.max(DELIVERY_MIN, Number(process.env.DELIVERY_DAYS_MAX) || 5);

/** Adds working days (Sunday off, as in Pakistan) and formats like "Tue, 30 Sep". */
const workingDaysFrom = (from: Date, days: number): string => {
  const d = new Date(from);
  while (days > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) days--; }
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

/** Customer-typed text (name, address) goes into HTML — escape it. */
const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ESC[c]);

const itemsList = (items: OrderItemLike[]) => items.length ? `
  <div style="border:1px solid #eee;border-radius:10px;padding:14px 18px;margin:0 0 20px;text-align:left;">
    <p style="margin:0 0 8px;font-weight:700;color:#2d2d2d;font-size:14px;">In this parcel</p>
    ${items.map(i => `<div style="display:flex;justify-content:space-between;font-size:14px;color:#555;padding:4px 0;"><span>${esc(i.name)}${i.size ? ` (${esc(i.size)})` : ''} × ${i.quantity}</span><span>${fmt(Number(i.price) * i.quantity)}</span></div>`).join('')}
  </div>` : '';

export async function sendOrderStatusUpdate(order: OrderLike, newStatus: string, items: OrderItemLike[] = []): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[email] Email not configured — skipping "${newStatus}" email for #${order.id}. Set EMAIL_USER and EMAIL_PASS in .env`);
    return;
  }
  const to = order.customer_email || order.customer?.email;
  if (!to) return;

  const statusEmoji: Record<string, string> = { Pending:'⏳', Processing:'🔧', Shipped:'🚚', Delivered:'✅', Cancelled:'❌' };
  const statusColor: Record<string, string> = { Pending:'#f0ad4e', Processing:'#5bc0de', Shipped:'#c97b7b', Delivered:'#5cb85c', Cancelled:'#d9534f' };
  const name = esc(order.customer_name || 'there');
  const address = [order.address, order.city, order.state, order.zip].filter(Boolean).map(esc).join(', ');
  const codDue = !isOnline(order.payment_method) && order.payment_status !== 'confirmed';
  const trackBtn = `<a href="${FRONTEND_URL}/order-confirmation?id=${order.id}" style="display:inline-block;background:#7a1f3d;color:white;padding:12px 26px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View your order →</a>`;

  let subject = `${statusEmoji[newStatus] || '📦'} Your order #${order.id} is now ${newStatus}`;
  let body: string;

  if (newStatus === 'Shipped') {
    const now = new Date();
    subject = `🚚 Your order #${order.id} has been shipped — arriving in ${DELIVERY_MIN}–${DELIVERY_MAX} days`;
    body = `
      <div style="padding:32px;text-align:center;">
        <div style="font-size:3.5rem;margin-bottom:12px;">🚚</div>
        <h2 style="color:#2d2d2d;margin:0 0 10px;">Your order is on its way!</h2>
        <p style="color:#555;margin:0 0 22px;font-size:15px;">Hi ${name}, good news — order <strong>#${order.id}</strong> has been shipped.</p>
        <div style="background:#fdf1f1;border-radius:12px;padding:18px 20px;margin:0 0 20px;">
          <p style="margin:0 0 4px;color:#7a1f3d;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Estimated delivery</p>
          <p style="margin:0;color:#2d2d2d;font-size:20px;font-weight:700;">${workingDaysFrom(now, DELIVERY_MIN)} – ${workingDaysFrom(now, DELIVERY_MAX)}</p>
          <p style="margin:6px 0 0;color:#777;font-size:13px;">within ${DELIVERY_MIN}–${DELIVERY_MAX} working days</p>
        </div>
        ${address ? `<p style="color:#555;font-size:14px;margin:0 0 20px;"><strong>Delivering to:</strong><br>${address}</p>` : ''}
        ${itemsList(items)}
        ${codDue
          ? `<div style="background:#fff8e1;border-radius:10px;padding:14px 18px;margin:0 0 22px;border-left:4px solid #f0ad4e;text-align:left;color:#555;font-size:14px;">💵 <strong>Cash on Delivery:</strong> please keep <strong>${fmt(order.total)}</strong> ready for the rider.</div>`
          : `<p style="color:#2e7d32;font-size:14px;margin:0 0 22px;">✓ Paid — nothing to pay at the door.</p>`}
        ${trackBtn}
        <p style="color:#999;font-size:12px;margin:22px 0 0;">Questions? Just reply to this email.</p>
      </div>`;
  } else if (newStatus === 'Delivered') {
    subject = `✅ Your order #${order.id} has been delivered`;
    body = `
      <div style="padding:32px;text-align:center;">
        <div style="font-size:3.5rem;margin-bottom:12px;">✅</div>
        <h2 style="color:#2d2d2d;margin:0 0 10px;">Delivered!</h2>
        <p style="color:#555;margin:0 0 22px;font-size:15px;">Hi ${name}, your order <strong>#${order.id}</strong> has been delivered. Thank you for shopping with Malo Garments — we hope you love it!</p>
        <p style="color:#777;font-size:14px;margin:0 0 22px;">Something not right? You can exchange within 7 days — just reply to this email.</p>
        ${trackBtn}
      </div>`;
  } else {
    body = `
      <div style="padding:32px;text-align:center;">
        <div style="font-size:4rem;margin-bottom:16px;">${statusEmoji[newStatus] || '📦'}</div>
        <h2 style="color:#2d2d2d;margin:0 0 12px;">Order Status Updated</h2>
        <p style="color:#777;margin:0 0 24px;">Hi ${name}, your order <strong>#${order.id}</strong> is now:</p>
        <span style="background:${statusColor[newStatus] || '#eee'};color:white;padding:10px 28px;border-radius:30px;font-weight:700;font-size:16px;display:inline-block;margin-bottom:24px;">${newStatus}</span>
        <p style="color:#777;font-size:14px;">Total: <strong style="color:#2d2d2d;">${fmt(order.total)}</strong></p>
      </div>`;
  }

  try {
    await transporter.sendMail({ from: `"Malo Garments" <${process.env.EMAIL_USER}>`, to, subject, html: emailShell(newStatus === 'Shipped' ? 'Order shipped' : 'Order update', body) });
    console.log(`[email] ✅ "${newStatus}" email sent to ${to} for #${order.id}`);
  } catch (err: any) {
    console.error(`[email] ❌ Failed to send "${newStatus}" email:`, err.message);
  }
}


// ─── Online payment flow ────────────────────────────────────────────────────

/** Customer says they paid → tell the admin to check their account and confirm. */
export async function sendPaymentSubmittedToAdmin(order: OrderLike, items: OrderItemLike[] = []): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('[email] Email not configured — skipping payment notification. Set EMAIL_USER / EMAIL_PASS / ADMIN_EMAIL in .env');
    return;
  }
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!adminEmail) return;

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const html = emailShell('Payment to verify', `
    <div style="background:#f0ad4e;padding:14px 32px;text-align:center;"><h2 style="color:white;margin:0;font-size:18px;">💰 Payment received? Please verify</h2></div>
    <div style="padding:32px;">
      <p style="margin:0 0 18px;color:#555;font-size:15px;"><strong>${order.customer_name}</strong> says they have paid for order <strong>#${order.id}</strong>. Check your ${paymentLabel(order.payment_method || '')} account — if the money has arrived, confirm it in the admin panel and the customer is notified automatically.</p>
      <table style="width:100%;font-size:14px;margin-bottom:22px;background:#fff8f0;border-radius:10px;padding:14px;">
        <tr><td style="padding:6px 12px;color:#777;width:150px;">Amount to look for</td><td style="padding:6px 12px;font-weight:700;color:#c97b7b;font-size:18px;">${fmt(order.total)}</td></tr>
        <tr><td style="padding:6px 12px;color:#777;">Method</td><td style="padding:6px 12px;font-weight:600;">${paymentLabel(order.payment_method || '')}</td></tr>
        <tr><td style="padding:6px 12px;color:#777;">Transaction ID</td><td style="padding:6px 12px;font-weight:700;font-family:monospace;">${order.payment_ref || '—'}</td></tr>
        <tr><td style="padding:6px 12px;color:#777;">Customer</td><td style="padding:6px 12px;">${order.customer_name} · ${order.customer_phone || ''}</td></tr>
        <tr><td style="padding:6px 12px;color:#777;">Order</td><td style="padding:6px 12px;">#${order.id} · ${count} item${count === 1 ? '' : 's'}${Number(order.discount) > 0 ? ' · 3% online discount applied' : ''}</td></tr>
      </table>
      <div style="text-align:center;">
        <a href="${FRONTEND_URL}/admin/orders?verify=${encodeURIComponent(order.id)}" style="display:inline-block;background:#7a1f3d;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase;">Open order &amp; confirm payment →</a>
      </div>
    </div>`);

  try {
    await transporter.sendMail({
      from: `"Malo Garments Store" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `💰 Verify payment — Order #${order.id} — ${fmt(order.total)} via ${paymentLabel(order.payment_method || '')}`,
      html,
    });
    console.log(`[email] ✅ Payment verification request sent to ${adminEmail} for order ${order.id}`);
  } catch (err: any) {
    console.error('[email] ❌ Failed to send payment verification request:', err.message);
  }
}

/** Admin confirmed the money → payment-received card for the customer. */
export async function sendPaymentConfirmedToCustomer(order: OrderLike, items: OrderItemLike[] = []): Promise<void> {
  const transporter = getTransporter();
  const to = order.customer_email || order.customer?.email;
  if (!transporter || !to) return;

  const html = emailShell('Payment received', `
    <div style="padding:36px 32px;text-align:center;">
      <div style="width:76px;height:76px;line-height:76px;border-radius:50%;background:#2e7d32;color:white;font-size:42px;margin:0 auto 18px;">✓</div>
      <h2 style="color:#2d2d2d;margin:0 0 8px;">Payment received!</h2>
      <p style="color:#777;margin:0 0 22px;">Thank you${order.customer_name ? ', ' + String(order.customer_name).split(' ')[0] : ''}. We have received your payment and your order is now being prepared.</p>
      <table style="margin:0 auto 22px;font-size:14px;text-align:left;background:#f1f8e9;border-radius:10px;padding:14px 20px;">
        <tr><td style="padding:5px 14px 5px 0;color:#777;">Order</td><td style="font-weight:700;">#${order.id}</td></tr>
        <tr><td style="padding:5px 14px 5px 0;color:#777;">Amount paid</td><td style="font-weight:700;color:#2e7d32;">${fmt(order.total)}</td></tr>
        <tr><td style="padding:5px 14px 5px 0;color:#777;">Method</td><td>${paymentLabel(order.payment_method || '')}</td></tr>
        ${order.payment_ref ? `<tr><td style="padding:5px 14px 5px 0;color:#777;">Transaction ID</td><td style="font-family:monospace;">${order.payment_ref}</td></tr>` : ''}
        ${Number(order.discount) > 0 ? `<tr><td style="padding:5px 14px 5px 0;color:#777;">You saved</td><td style="color:#2e7d32;font-weight:600;">${fmt(order.discount)} (3% online discount)</td></tr>` : ''}
      </table>
      <a href="${FRONTEND_URL}/order-confirmation?id=${order.id}" style="display:inline-block;background:#7a1f3d;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View my order →</a>
    </div>`);

  try {
    await transporter.sendMail({
      from: `"Malo Garments" <${process.env.EMAIL_USER}>`,
      to,
      subject: `✅ Payment received for order #${order.id}`,
      html,
    });
    console.log(`[email] ✅ Payment confirmation sent to ${to}`);
  } catch (err: any) {
    console.error('[email] ❌ Failed to send payment confirmation:', err.message);
  }
}

/** Admin could not find the money → ask the customer to re-check and resubmit. */
export async function sendPaymentRejectedToCustomer(order: OrderLike): Promise<void> {
  const transporter = getTransporter();
  const to = order.customer_email || order.customer?.email;
  if (!transporter || !to) return;

  const html = emailShell('Payment not found', `
    <div style="padding:36px 32px;text-align:center;">
      <div style="font-size:3.4rem;margin-bottom:12px;">⚠️</div>
      <h2 style="color:#2d2d2d;margin:0 0 8px;">We could not find your payment</h2>
      <p style="color:#777;margin:0 0 22px;">We could not match the transaction ID <strong style="font-family:monospace;">${order.payment_ref || ''}</strong> to a payment of <strong>${fmt(order.total)}</strong> for order <strong>#${order.id}</strong>. Please check the ID and submit it again — or reply to this email and we will help.</p>
      <a href="${FRONTEND_URL}/payment?orderId=${order.id}" style="display:inline-block;background:#7a1f3d;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Submit transaction ID again →</a>
    </div>`);

  try {
    await transporter.sendMail({
      from: `"Malo Garments" <${process.env.EMAIL_USER}>`,
      to,
      subject: `⚠️ Payment not found for order #${order.id}`,
      html,
    });
  } catch (err: any) {
    console.error('[email] ❌ Failed to send payment-not-found email:', err.message);
  }
}
