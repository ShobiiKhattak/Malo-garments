/*
 * ══════════════════════════════════════════════════════════════
 * Malo Garments — AI Size/Fit Assistant (Google Gemini)
 *
 * Setup (.env):
 *   GEMINI_API_KEY=your_gemini_api_key
 *
 * Get a free key at: https://aistudio.google.com/apikey
 *
 * If not configured, recommendations fall back to a standard
 * size-chart lookup table — same dev-friendly pattern as the
 * Twilio/JazzCash/EasyPaisa fallbacks elsewhere in this backend.
 * ══════════════════════════════════════════════════════════════
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface SizeMeasurements {
  bust?: number;
  waist?: number;
  hip?: number;
  underbust?: number;
}

export interface SizeRecommendation {
  size: string;
  note: string;
  source: 'ai' | 'rule';
}

const PLACEHOLDER_VALUES = new Set(['your_gemini_api_key']);

let _client: GoogleGenerativeAI | null = null;
let _checked = false;

function getClient(): GoogleGenerativeAI | null {
  if (_checked) return _client;
  _checked = true;

  const key = process.env.GEMINI_API_KEY;
  if (!key || PLACEHOLDER_VALUES.has(key)) return null;

  _client = new GoogleGenerativeAI(key);
  return _client;
}

export const isGeminiConfigured = (): boolean => getClient() !== null;

/* ── Rule-based fallback (used when Gemini isn't configured, or its call fails) ── */

const GENERAL_TABLE = [
  { n: 'XS', b: [0, 33.5], w: [0, 26.5], h: [0, 36.5] },
  { n: 'S', b: [34, 35.5], w: [27, 28.5], h: [37, 38.5] },
  { n: 'M', b: [36, 37.5], w: [29, 30.5], h: [39, 40.5] },
  { n: 'L', b: [38, 40.5], w: [31, 33.5], h: [41, 43.5] },
  { n: 'XL', b: [41, 43.5], w: [34, 36.5], h: [44, 46.5] },
  { n: 'XXL', b: [44, 99], w: [37, 99], h: [47, 99] },
] as const;

function ruleBasedGeneralSize({ bust = 0, waist = 0, hip = 0 }: SizeMeasurements): string {
  const scored = GENERAL_TABLE.map(s => ({
    n: s.n,
    score: (bust && bust >= s.b[0] && bust <= s.b[1] ? 3 : 0)
      + (waist && waist >= s.w[0] && waist <= s.w[1] ? 3 : 0)
      + (hip && hip >= s.h[0] && hip <= s.h[1] ? 3 : 0),
  }));
  return scored.sort((a, b) => b.score - a.score)[0].n;
}

const CUP_LETTERS = ['AA', 'A', 'B', 'C', 'D', 'DD', 'E', 'F', 'G'];

function ruleBasedBraSize({ underbust, bust }: SizeMeasurements): string | null {
  if (!underbust || !bust) return null;
  const band = Math.round(underbust % 2 === 0 ? underbust : underbust + 1);
  const cupIndex = Math.max(0, Math.min(CUP_LETTERS.length - 1, Math.round(bust - underbust) - 1));
  return `${band}${CUP_LETTERS[cupIndex]}`;
}

function ruleBasedRecommendation(measurements: SizeMeasurements, sizes: string[]): SizeRecommendation {
  const braSize = ruleBasedBraSize(measurements);
  if (braSize) {
    return { size: braSize, note: 'Estimated from your underbust and bust measurements using a standard bra size chart.', source: 'rule' };
  }
  const size = ruleBasedGeneralSize(measurements);
  const fallsInList = sizes.length === 0 || sizes.includes(size);
  return {
    size: fallsInList ? size : sizes[0] || size,
    note: 'Estimated using a standard size chart for your measurements.',
    source: 'rule',
  };
}

/* ── Gemini-powered recommendation ── */

export async function getSizeRecommendation(params: {
  productName: string;
  category: string;
  subcategory: string;
  sizes: string[];
  measurements: SizeMeasurements;
}): Promise<SizeRecommendation> {
  const { productName, category, subcategory, sizes, measurements } = params;
  const fallback = () => ruleBasedRecommendation(measurements, sizes);

  const client = getClient();
  if (!client) return fallback();

  const measurementLines = Object.entries(measurements)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v} inches`)
    .join(', ');

  if (!measurementLines) return fallback();

  const prompt = `You are a fashion fit assistant for a women's clothing store called Malo Garments.
A customer is viewing this product: "${productName}" (category: ${category} > ${subcategory}).
Available sizes for this product: ${sizes.join(', ') || 'XS, S, M, L, XL, XXL'}.
Customer's measurements: ${measurementLines}.

Using standard women's clothing size charts, pick the single best size from the available sizes list, and write one short, warm, helpful sentence of reasoning (mention if this type of item typically runs small/large, if relevant).

Respond with EXACTLY two lines, no markdown, no extra text:
SIZE: <one size from the available list>
NOTE: <one short sentence>`;

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const sizeMatch = text.match(/SIZE:\s*(\S+)/i);
    const noteMatch = text.match(/NOTE:\s*(.+)/i);
    if (!sizeMatch) return fallback();

    return {
      size: sizeMatch[1].replace(/[^A-Za-z0-9]/g, ''),
      note: noteMatch?.[1]?.trim() || 'Recommended based on your measurements.',
      source: 'ai',
    };
  } catch (err: any) {
    console.error('Gemini size recommendation error:', err.message || err);
    return fallback();
  }
}
