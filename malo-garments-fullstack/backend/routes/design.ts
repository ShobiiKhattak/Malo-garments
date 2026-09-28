/*
 * Malo Garments — Design Studio routes
 * GET /pricing — the customisation price table used by the storefront
 */
import express from 'express';
import { DESIGN_PRICING } from '../config/designPricing';

const router = express.Router();

router.get('/pricing', (_req, res) => {
  res.json(DESIGN_PRICING);
});

export default router;
