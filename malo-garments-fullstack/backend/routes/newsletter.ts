/*
 * Malo Garments — Newsletter Route (Prisma)
 * POST /
 */
import express from 'express';
import prisma from '../config/prisma';

const router = express.Router();
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email))
      return res.status(400).json({ error: 'A valid email is required.' });

    const existing = await prisma.newsletter.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ error: 'This email is already subscribed.' });

    await prisma.newsletter.create({ data: { email } });
    res.status(201).json({ success: true });
  } catch (err: any) {
    console.error('POST /newsletter:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

export default router;
