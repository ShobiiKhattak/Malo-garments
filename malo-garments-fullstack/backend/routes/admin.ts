/*
 * Malo Garments — Admin Routes (Prisma)
 * POST /login · GET /customers · GET /stats
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
      return res.status(400).json({ error: 'Username and password are required.' });

    const admin = await prisma.adminUser.findUnique({ where: { username } });
    if (!admin || !(await bcrypt.compare(password, admin.password_hash)))
      return res.status(401).json({ error: 'Invalid username or password.' });

    const token = jwt.sign(
      { id: admin.id, username: admin.username, name: admin.name },
      process.env.ADMIN_JWT_SECRET as string,
      { expiresIn: (process.env.ADMIN_JWT_EXPIRES_IN || '1d') as any }
    );
    res.json({ success: true, token, admin: { id: admin.id, username: admin.username, name: admin.name } });
  } catch (err: any) {
    console.error('POST /admin/login:', err);
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
