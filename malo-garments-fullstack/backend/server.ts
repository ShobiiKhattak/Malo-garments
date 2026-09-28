/*
 * ══════════════════════════════════════════════════════════════
 * Malo Garments — Backend Entry Point (Prisma ORM)
 * ══════════════════════════════════════════════════════════════
 */
'use strict';

import './patch-prisma';
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import prisma from './config/prisma';

if (!process.env.JWT_SECRET || !process.env.ADMIN_JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET / ADMIN_JWT_SECRET not set — using insecure dev defaults.');
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret';
  process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-only-insecure-admin-secret';
}

import productsRouter from './routes/products';
import categoriesRouter from './routes/categories';
import authRouter from './routes/auth';
import ordersRouter from './routes/orders';
import adminRouter from './routes/admin';
import newsletterRouter from './routes/newsletter';
import contactRouter from './routes/contact';
import paymentsRouter from './routes/payments';
import aiRouter from './routes/ai';
import designRouter from './routes/design';

const app = express();
app.use(cors());
// 2 GB for bulk dummy-data uploads. Real ceiling: ~500 MB per request (Node string limit) and 1 GB (MySQL packet).
// Lower this (e.g. '50mb') before going live — huge requests can exhaust server memory.
app.use(express.json({ limit: '2gb' }));

// ─── Frontend static files ────────────────────────────────────────────────────
const candidateDirs = [
  process.env.FRONTEND_DIR,
  path.join(__dirname, '..', 'malo-react', 'dist'),          // React production build
].filter(Boolean) as string[];

const FRONTEND_DIR = candidateDirs.find((dir) => fs.existsSync(path.join(dir, 'index.html')));

if (!FRONTEND_DIR) {
  console.warn('⚠️  Frontend not found. API routes will still work.');
} else {
  console.log(`Serving frontend from: ${FRONTEND_DIR}`);
  app.use(express.static(FRONTEND_DIR));
  app.use('/admin', express.static(path.join(FRONTEND_DIR, 'admin')));
}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', orm: 'prisma' }));

app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/auth', authRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/contact', contactRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/design', designRouter);

// 404 for unmatched /api routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Frontend fallback
app.get('*', (req, res, next) => {
  if (!FRONTEND_DIR) return res.status(404).send('Frontend not found.');
  if (path.extname(req.path)) return next();
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Final 404
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large')
    return res.status(413).json({ error: 'Photos are too large to save — use fewer or smaller images.' });
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong.' });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to MySQL.');
  } catch (err: any) {
    console.error('⚠️  Prisma could not connect:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`Malo Garments backend running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

main().catch(console.error);
