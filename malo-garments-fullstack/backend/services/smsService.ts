/*
 * ══════════════════════════════════════════════════════════════
 * Malo Garments — SMS OTP Service (Twilio)
 *
 * Setup (.env):
 *   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN=your_auth_token
 *   TWILIO_PHONE_NUMBER=+1xxxxxxxxxx   ← the Twilio number OTPs are sent from
 *
 * Get these from: https://console.twilio.com
 *
 * If not configured, OTPs are logged to the server console instead of sent
 * as real SMS — lets phone login be developed/tested before Twilio is wired
 * up, same as the JazzCash/EasyPaisa mock fallback in routes/payments.ts.
 * ══════════════════════════════════════════════════════════════
 */
import twilio, { type Twilio } from 'twilio';

const PLACEHOLDER_VALUES = new Set(['your_twilio_account_sid', 'your_twilio_auth_token', 'your_twilio_phone_number']);

let _client: Twilio | null = null;
let _checked = false;

function getClient(): Twilio | null {
  if (_checked) return _client;
  _checked = true;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from || PLACEHOLDER_VALUES.has(sid) || PLACEHOLDER_VALUES.has(token)) {
    return null; // Twilio not configured — dev-mode console fallback
  }

  _client = twilio(sid, token);
  return _client;
}

export const isSmsConfigured = (): boolean => getClient() !== null;

// Returns true if a real SMS was sent, false if it fell back to console logging.
export async function sendOtpSms(phone: string, code: string): Promise<boolean> {
  const client = getClient();
  const message = `Your Malo Garments verification code is ${code}. It expires in 5 minutes.`;

  if (!client) {
    console.warn(`⚠️  Twilio not configured — dev OTP for ${phone}: ${code}`);
    return false;
  }

  try {
    await client.messages.create({ to: phone, from: process.env.TWILIO_PHONE_NUMBER, body: message });
    return true;
  } catch (err: any) {
    console.error('Twilio sendOtpSms error:', err.message || err);
    throw new Error('Could not send SMS. Please check the phone number and try again.');
  }
}
