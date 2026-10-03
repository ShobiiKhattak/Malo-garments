/*
 * Malo Garments — Admin Routes (Prisma)
 * POST /login · GET/PUT /me · GET /customers · GET /stats
 */
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

/* POST /api/admin/login */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username/email and password are required.' });

    // Log in with either the username or the admin email
    const login = String(username).trim();
    const admin = await prisma.adminUser.findFirst({ where: { OR: [{ username: login }, { email: login.toLowerCase() }] } });
    if (!admin || !(await bcrypt.compare(password, admin.password_hash)))
      return res.status(401).json({ error: 'Invalid username/email or password.' });

    const token = jwt.sign(
      { id: admin.id, username: admin.username, name: admin.name },
      process.env.ADMIN_JWT_SECRET as string,
      { expiresIn: (process.env.ADMIN_JWT_EXPIRES_IN || '1d') as any }
    );
    res.json({ success: true, token, admin: { id: admin.id, username: admin.username, name: admin.name, email: admin.email } });
  } catch (err: any) {
    console.error('POST /admin/login:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* GET /api/admin/me — the logged-in admin's account */
router.get('/me', authenticateAdmin, async (req, res) => {
  const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.id }, select: { id: true, username: true, name: true, email: true } });
  if (!admin) return res.status(404).json({ error: 'Admin not found.' });
  res.json(admin);
});

/* PUT /api/admin/me — change name / email / password. Always needs the current password. */
router.put('/me', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, name, email, newPassword } = req.body || {};
    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.id } });
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });
    if (!currentPassword || !(await bcrypt.compare(String(currentPassword), admin.password_hash)))
      return res.status(401).json({ error: 'Your current password is not correct.' });

    const data: { name?: string; email?: string | null; password_hash?: string } = {};
    if (typeof name === 'string' && name.trim()) data.name = name.trim().slice(0, 200);
    if (typeof email === 'string') {
      const e = email.trim().toLowerCase();
      if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return res.status(400).json({ error: 'Please enter a valid email address.' });
      if (e && e !== admin.email && await prisma.adminUser.findFirst({ where: { email: e, NOT: { id: admin.id } } }))
        return res.status(409).json({ error: 'This email is already used by another admin.' });
      data.email = e || null;
    }
    if (newPassword) {
      const p = String(newPassword);
      if (p.length < 10 || !/[a-zA-Z]/.test(p) || !/\d/.test(p))
        return res.status(400).json({ error: 'New password must be at least 10 characters with letters and numbers.' });
      data.password_hash = await bcrypt.hash(p, 10);
    }

    const updated = await prisma.adminUser.update({ where: { id: admin.id }, data, select: { id: true, username: true, name: true, email: true } });
    res.json({ success: true, admin: updated, passwordChanged: !!data.password_hash });
  } catch (err: any) {
    console.error('PUT /admin/me:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* GET /api/admin/customers */
router.get('/customers', authenticateAdmin, async (req, res) => {
  try {
    const users  = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, date_joined: true },
    });
    const orders = await prisma.order.findMany({
      select: { user_id: true, total: true },
    });

    const result = users.map((u) => {
      const userOrders = orders.filter((o) => o.user_id === u.id);
      return {
        ...u,
        orderCount: userOrders.length,
        totalSpent: userOrders.reduce((sum, o) => sum + Number(o.total), 0),
      };
    });

    res.json(result);
  } catch (err: any) {
    console.error('GET /admin/customers:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* GET /api/admin/stats */
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const [totalProducts, totalCustomers, orders, products, categories] = await Promise.all([
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.findMany({ select: { total: true, status: true, created_at: true } }),
      prisma.product.findMany({ select: { category_id: true } }),
      prisma.category.findMany({ select: { id: true, name: true } }),
    ]);

    const totalOrders   = orders.length;
    // Cancelled orders are not revenue
    const live          = orders.filter((o) => o.status !== 'Cancelled');
    const totalRevenue  = live.reduce((s, o) => s + Number(o.total), 0);
    const deliveredRevenue = orders.filter((o) => o.status === 'Delivered')
      .reduce((s, o) => s + Number(o.total), 0);

    // Monthly revenue — last 6 months
    const now = new Date();
    const monthlyRevenue: { label: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const revenue = live
        .filter((o) => {
          const od = new Date(o.created_at as unknown as string);
          return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        })
        .reduce((s, o) => s + Number(o.total), 0);
      monthlyRevenue.push({ label: d.toLocaleString('default', { month: 'short' }), revenue });
    }

    // Products by category
    const productsByCategory = categories.map((c) => ({
      name:  c.name,
      count: products.filter((p) => p.category_id === c.id).length,
    }));

    res.json({ totalProducts, totalOrders, totalCustomers, totalRevenue, deliveredRevenue, monthlyRevenue, productsByCategory });
  } catch (err: any) {
    console.error('GET /admin/stats:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

export default router;
