/*
 * Malo Garments — AI Routes
 * POST /size-recommendation · POST /design-preview
 */
import express from 'express';
import { getSizeRecommendation } from '../services/geminiService';
import { generateDesignPreview, isImageGenConfigured } from '../services/geminiImageService';

const router = express.Router();

router.post('/size-recommendation', async (req, res) => {
  try {
    const { productName, category, subcategory, sizes, measurements } = req.body;
    if (!measurements || typeof measurements !== 'object')
      return res.status(400).json({ error: 'Measurements are required.' });

    const cleaned = {
      bust: Number(measurements.bust) || undefined,
      waist: Number(measurements.waist) || undefined,
      hip: Number(measurements.hip) || undefined,
      underbust: Number(measurements.underbust) || undefined,
    };
    if (!Object.values(cleaned).some(Boolean))
      return res.status(400).json({ error: 'Please enter at least one measurement.' });

    const recommendation = await getSizeRecommendation({
      productName: productName || 'this item',
      category: category || '',
      subcategory: subcategory || '',
      sizes: Array.isArray(sizes) ? sizes : [],
      measurements: cleaned,
    });

    res.json(recommendation);
  } catch (err: any) {
    console.error('POST /ai/size-recommendation:', err);
    res.status(500).json({ error: 'Could not generate a size recommendation right now.' });
  }
});

// Real AI image generation costs money per call — a light per-IP cooldown
// stops accidental double-clicks/spam from burning through the quota.
const lastPreviewAt = new Map<string, number>();
const PREVIEW_COOLDOWN_MS = 4000;

router.post('/design-preview', async (req, res) => {
  try {
    if (!isImageGenConfigured())
      return res.status(503).json({ error: 'Realistic AI preview isn’t configured yet — set GEMINI_API_KEY (with image-gen access) on the server.' });

    const ip = req.ip || 'unknown';
    const last = lastPreviewAt.get(ip) || 0;
    const wait = PREVIEW_COOLDOWN_MS - (Date.now() - last);
    if (wait > 0)
      return res.status(429).json({ error: `Please wait ${Math.ceil(wait / 1000)}s before generating another preview.` });
    lastPreviewAt.set(ip, Date.now());

    const { garmentType, color, pattern, styleSummary } = req.body;
    if (!garmentType || !color)
      return res.status(400).json({ error: 'Garment type and color are required.' });

    const prompt = `A professional e-commerce product photograph of a women's ${garmentType}. ` +
      `Fabric color: ${color}. Pattern/fabric finish: ${pattern || 'solid'}. Style details: ${styleSummary || 'classic cut'}. ` +
      `The garment is shown on a plain seamless white studio background, centered, front-facing, soft even studio lighting, ` +
      `sharp focus, realistic fabric texture and natural folds, no people, no mannequin head visible, no visible brand logos or text, ` +
      `high resolution catalog product photography style.`;

    const result = await generateDesignPreview(prompt);
    if (!result)
      return res.status(503).json({ error: 'Could not generate a realistic preview right now. Please try again.' });

    res.json({ image: result.dataUrl });
  } catch (err: any) {
    console.error('POST /ai/design-preview:', err);
    res.status(500).json({ error: 'Could not generate a preview right now.' });
  }
});

export default router;
