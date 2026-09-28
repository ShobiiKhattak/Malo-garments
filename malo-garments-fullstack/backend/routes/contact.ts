/*
 * Malo Garments — Contact form
 * POST /  → emails the message to the store (ADMIN_EMAIL), with the customer as reply-to.
 */
import express from 'express';
import { sendContactMessage } from '../services/emailService';

const router = express.Router();
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Simple spam guard: at most 5 messages per IP every 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();
const tooMany = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
};

router.post('/', async (req, res) => {
  const clip = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n);
  const name = clip(req.body?.name, 120);
  const email = clip(req.body?.email, 150);
  const phone = clip(req.body?.phone, 30);
  const subject = clip(req.body?.subject, 120);
  const message = clip(req.body?.message, 1000);

  if (!name || !message) return res.status(400).json({ error: 'Please fill in your name and message.' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (tooMany(req.ip || 'unknown')) return res.status(429).json({ error: 'Too many messages — please try again in a few minutes or use WhatsApp.' });

  const result = await sendContactMessage({ name, email, phone, subject, message });
  if (result === 'sent') return res.json({ success: true });
  // Email not configured or failed: tell the page to hand the message to WhatsApp instead of losing it.
  res.status(503).json({ error: 'Email is not available right now.', whatsapp: true });
});

export default router;
