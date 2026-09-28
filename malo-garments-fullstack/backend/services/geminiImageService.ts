/*
 * ══════════════════════════════════════════════════════════════
 * Malo Garments — AI Design Preview (Google Gemini image generation)
 *
 * Setup (.env):
 *   GEMINI_API_KEY=your_gemini_api_key            (same key as geminiService.ts)
 *   GEMINI_IMAGE_MODEL=gemini-2.5-flash-image      (optional override)
 *
 * Get a key at: https://aistudio.google.com/apikey — image generation
 * models are billed per image once you're past the free tier, so this
 * needs a Google Cloud billing account attached to the API key's project.
 *
 * If not configured (or a call fails), callers should fall back to the
 * SVG sketch preview — same dev-friendly pattern as the rest of this
 * backend (Twilio, Google login, size assistant).
 * ══════════════════════════════════════════════════════════════
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

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

export const isImageGenConfigured = (): boolean => getClient() !== null;

export async function generateDesignPreview(prompt: string): Promise<{ dataUrl: string } | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const model = client.getGenerativeModel({ model: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image' });
    const result = await model.generateContent(prompt);
    const parts = result.response.candidates?.[0]?.content?.parts || [];

    for (const part of parts as any[]) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        return { dataUrl: `data:${mime};base64,${part.inlineData.data}` };
      }
    }
    console.error('Gemini image generation: no image data in response.');
    return null;
  } catch (err: any) {
    console.error('Gemini image generation error:', err.message || err);
    return null;
  }
}
