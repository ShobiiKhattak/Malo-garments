/*
 * ══════════════════════════════════════════════════════════════
 * Malo Garments — Auth Middleware
 * Verifies customer JWTs (JWT_SECRET) and admin JWTs (ADMIN_JWT_SECRET)
 * separately, since they're issued and scoped independently.
 * ══════════════════════════════════════════════════════════════
 */
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { CustomerSession, AdminSession } from '../types';

const getToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.split(' ')[1];
};

export const authenticateCustomer = (req: Request, res: Response, next: NextFunction) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET as string) as CustomerSession;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Admin authentication required.' });

  try {
    req.admin = jwt.verify(token, process.env.ADMIN_JWT_SECRET as string) as AdminSession;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired admin session. Please log in again.' });
  }
};

// Attaches req.user if a valid customer token is present, but never rejects
// the request — used for checkout, which supports guest orders.
export const optionalCustomerAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = getToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET as string) as CustomerSession;
    } catch {
      /* invalid/expired token on a guest-friendly route — just proceed as guest */
    }
  }
  next();
};
