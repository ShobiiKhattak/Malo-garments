'use strict';

import crypto from 'crypto';
import express from 'express';
import prisma from '../config/prisma';

const router = express.Router();

interface ProviderConfig {
  id?: string;
  password?: string;
  apiBaseUrl: string;
  returnUrl: string;
  cancelUrl: string;
}

const getProviderConfig = (method: string): ProviderConfig | null => {
  switch (method) {
    case 'jazzcash':
      return {
        id: process.env.JAZZCASH_MERCHANT_ID,
        password: process.env.JAZZCASH_PASSWORD,
        apiBaseUrl: process.env.JAZZCASH_API_BASE_URL || 'https://sandbox.jazzcash.com.pk/checkout',
        returnUrl: process.env.JAZZCASH_RETURN_URL || 'http://localhost:3001/api/payments/callback/jazzcash',
        cancelUrl: process.env.JAZZCASH_CANCEL_URL || 'http://localhost:5173/checkout',
      };
    case 'easypaisa':
      return {
        id: process.env.EASYPAISA_MERCHANT_ID || process.env.EASYPAISA_STORE_ID,
        password: process.env.EASYPAISA_PASSWORD || process.env.EASYPAISA_SIGNATURE,
        apiBaseUrl: process.env.EASYPAISA_API_BASE_URL || 'https://sandbox.easypaisa.com.pk/checkout',
        returnUrl: process.env.EASYPAISA_RETURN_URL || 'http://localhost:3001/api/payments/callback/easypaisa',
        cancelUrl: process.env.EASYPAISA_CANCEL_URL || 'http://localhost:5173/checkout',
      };
    default:
      return null;
  }
};

const buildHash = (payload: unknown, secret?: string) => {
  const normalized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', String(secret || '')).update(normalized).digest('hex');
};

const mockRedirect = (provider: string, orderId: string) => `http://localhost:5173/order-confirmation?id=${encodeURIComponent(orderId)}&payment=${encodeURIComponent(provider)}`;

router.post('/initiate', async (req, res) => {
  const { method, orderId, amount, customerName, customerEmail } = req.body || {};

  if (!method || !orderId || !amount) {
    return res.status(400).json({ error: 'method, orderId and amount are required.' });
  }

  const provider = String(method).toLowerCase();
  const config = getProviderConfig(provider);

  if (!config) {
    return res.status(400).json({ error: 'Unsupported payment method.' });
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero.' });
  }

  const redirectUrl = mockRedirect(provider, orderId);

  if (!config.id || !config.password) {
    return res.json({
      success: true,
      mode: 'mock',
      provider,
      redirectUrl,
      message: 'Gateway credentials are not configured yet. Mock redirect is active for local development.',
    });
  }

  const payload = {
    merchantId: config.id,
    orderId,
    amount: numericAmount,
    currency: 'PKR',
    description: `Malo Garments Order #${orderId}`,
    customerName: customerName || 'Customer',
    customerEmail: customerEmail || '',
    returnUrl: config.returnUrl,
    cancelUrl: config.cancelUrl,
  };

  const hash = buildHash(payload, config.password);
  const queryEntries = Object.entries({ ...payload, hash, provider }).map(([k, v]) => [k, String(v)] as [string, string]);
  const gatewayUrl = `${config.apiBaseUrl}?${new URLSearchParams(queryEntries).toString()}`;

  return res.json({
    success: true,
    mode: 'live',
    provider,
    redirectUrl: gatewayUrl,
    payload,
    hash,
  });
});

router.get('/callback/:provider', async (req, res) => {
  const { provider } = req.params;
  const { orderId, status = 'success', amount } = req.query;

  if (orderId) {
    try {
      await prisma.order.update({
        where: { id: String(orderId) },
        data: {
          status: status === 'success' ? 'Processing' : 'Cancelled',
          payment_method: String(provider).toLowerCase(),
        },
      });
    } catch (err: any) {
      console.warn('[payments] callback could not update order status:', err.message);
    }
  }

  const frontendUrl = `http://localhost:5173/order-confirmation?id=${encodeURIComponent(String(orderId || ''))}&payment=${encodeURIComponent(String(provider || ''))}&status=${encodeURIComponent(String(status || 'success'))}&amount=${encodeURIComponent(String(amount || ''))}`;
  return res.redirect(frontendUrl);
});

router.get('/callback', async (req, res) => {
  const { provider, orderId, status = 'success' } = req.query;
  const targetProvider = provider || 'jazzcash';
  return res.redirect(`http://localhost:5173/order-confirmation?id=${encodeURIComponent(String(orderId || ''))}&payment=${encodeURIComponent(String(targetProvider))}&status=${encodeURIComponent(String(status))}`);
});

export default router;
