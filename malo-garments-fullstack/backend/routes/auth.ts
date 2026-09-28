/*
 * Malo Garments — Auth Routes (Prisma)
 * POST /register · POST /login · POST /otp/send · POST /otp/verify · POST /google · GET/PUT /me · POST /me/addresses
 */
import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { generateId } from '../utils/id';
import { normalizePhone } from '../utils/phone';
import { sendOtpSms } from '../services/smsService';
import { verifyGoogleCredential } from '../services/googleAuthService';
import { authenticateCustomer } from '../middleware/auth';
import type { CustomerSession } from '../types';

const router = express.Router();
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const toSession = (user: { id: string; name: string; email: string | null; phone: string | null }): CustomerSession => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
});

const signToken = (user: CustomerSession) =>
  jwt.sign({ id: user.id, name: user.name, email: user.email, phone: user.phone }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });

/* POST /api/auth/register */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });
    if (!isValidEmail(email))
      return res.status(400).json({ error: 'Please enter a valid email.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ error: 'An account with this email already exists.' });

    const normalizedPhone = phone ? normalizePhone(phone) : null;
    if (phone && !normalizedPhone) return res.status(400).json({ error: 'Please enter a valid phone number.' });

    const user = await prisma.user.create({
      data: {
        id:            generateId('usr'),
        name,
        email,
        password_hash: await bcrypt.hash(password, 10),
        phone:         normalizedPhone,
      },
    });

    const session = toSession(user);
    res.status(201).json({ success: true, token: signToken(session), user: session });
  } catch (err: any) {
    console.error('POST /auth/register:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Invalid email or password.' });

    const session = toSession(user);
    res.json({ success: true, token: signToken(session), user: session });
  } catch (err: any) {
    console.error('POST /auth/login:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

/* POST /api/auth/otp/send — request a login code by SMS */
router.post('/otp/send', async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone || '');
    if (!phone) return res.status(400).json({ error: 'Please enter a valid phone number.' });

    const last = await prisma.otpCode.findFirst({ where: { phone }, orderBy: { created_at: 'desc' } });
    if (last) {
      const elapsed = Date.now() - last.created_at.getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({ error: `Please wait ${wait}s before requesting another code.` });
      }
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    await prisma.otpCode.create({
      data: {
        id:         generateId('otp'),
        phone,
        code_hash:  await bcrypt.hash(code, 10),
        expires_at: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    const sentViaSms = await sendOtpSms(phone, code);
    const devOtp = !sentViaSms && process.env.NODE_ENV !== 'production' ? code : undefined;
    res.json({ success: true, message: 'Verification code sent.', ...(devOtp ? { devOtp } : {}) });
  } catch (err: any) {
    console.error('POST /auth/otp/send:', err);
    res.status(500).json({ error: err.message || 'Could not send verification code. Please try again.' });
  }
});

/* POST /api/auth/otp/verify — verify the code and log in (creating an account on first use) */
router.post('/otp/verify', async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone || '');
    const code = String(req.body.code || '').trim();
    if (!phone || !code) return res.status(400).json({ error: 'Phone number and code are required.' });

    const otp = await prisma.otpCode.findFirst({ where: { phone, consumed: false }, orderBy: { created_at: 'desc' } });
    if (!otp) return res.status(400).json({ error: 'No pending verification code. Please request a new one.' });
    if (otp.expires_at.getTime() < Date.now())
      return res.status(400).json({ error: 'This code has expired. Please request a new one.' });
    if (otp.attempts >= OTP_MAX_ATTEMPTS)
      return res.status(400).json({ error: 'Too many incorrect attempts. Please request a new one.' });

    const valid = await bcrypt.compare(code, otp.code_hash);
    if (!valid) {
      await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      const left = OTP_MAX_ATTEMPTS - otp.attempts - 1;
      return res.status(401).json({ error: `Incorrect code. ${Math.max(left, 0)} attempt(s) left.` });
    }

    await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

    let user = await prisma.user.findUnique({ where: { phone } });
    let isNewUser = false;
    if (!user) {
      const name = (req.body.name || '').trim() || 'Customer';
      user = await prisma.user.create({ data: { id: generateId('usr'), name, phone } });
      isNewUser = true;
    }

    const session = toSession(user);
    res.json({ success: true, token: signToken(session), user: session, isNewUser });
  } catch (err: any) {
    console.error('POST /auth/otp/verify:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

/* POST /api/auth/google — verify a Google Identity Services credential and log in */
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing Google credential.' });

    const profile = await verifyGoogleCredential(credential);

    let user = await prisma.user.findUnique({ where: { google_id: profile.googleId } });

    if (!user) {
      const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
      user = byEmail
        ? await prisma.user.update({ where: { id: byEmail.id }, data: { google_id: profile.googleId } })
        : await prisma.user.create({
            data: { id: generateId('usr'), name: profile.name, email: profile.email, google_id: profile.googleId },
          });
    }

    const session = toSession(user);
    res.json({ success: true, token: signToken(session), user: session });
  } catch (err: any) {
    console.error('POST /auth/google:', err);
    res.status(401).json({ error: err.message || 'Google sign-in failed. Please try again.' });
  }
});

/* GET /api/auth/me */
router.get('/me', authenticateCustomer, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:   { id: req.user!.id },
      include: { addresses: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const { password_hash, google_id, ...safe } = user;
    res.json(safe);
  } catch (err: any) {
    console.error('GET /auth/me:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* PUT /api/auth/me */
router.put('/me', authenticateCustomer, async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const data: Record<string, string> = {};
    if (name)  data.name  = name;
    if (phone) data.phone = phone;
    if (email) data.email = email;
    if (!Object.keys(data).length)
      return res.status(400).json({ error: 'Nothing to update.' });

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: { id: true, name: true, email: true, phone: true },
    });
    res.json({ success: true, user: updated });
  } catch (err: any) {
    console.error('PUT /auth/me:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

/* POST /api/auth/me/addresses */
router.post('/me/addresses', authenticateCustomer, async (req, res) => {
  try {
    const { label, phone, street, city, state, zip } = req.body;
    if (!street || !city)
      return res.status(400).json({ error: 'Street and city are required.' });

    const address = await prisma.address.create({
      data: {
        id:      generateId('addr'),
        user_id: req.user!.id,
        label:   label || null,
        phone:   phone || null,
        street,
        city,
        state:   state || null,
        zip:     zip   || null,
      },
    });
    res.status(201).json({ success: true, address });
  } catch (err: any) {
    console.error('POST /auth/me/addresses:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

export default router;
