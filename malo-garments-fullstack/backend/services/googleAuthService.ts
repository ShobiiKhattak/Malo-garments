/*
 * ══════════════════════════════════════════════════════════════
 * Malo Garments — Google Sign-In Verification
 *
 * Setup (.env):
 *   GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
 *
 * Get one at: https://console.cloud.google.com/apis/credentials
 *   1. Create an OAuth 2.0 Client ID → Application type: "Web application"
 *   2. Authorized JavaScript origins: http://localhost:5173 (+ your prod domain)
 *   3. Copy the Client ID here and into malo-react/.env as VITE_GOOGLE_CLIENT_ID
 * ══════════════════════════════════════════════════════════════
 */
import { OAuth2Client } from 'google-auth-library';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
}

let _client: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (!_client) _client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  return _client;
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Google sign-in is not configured on this server.');

  const ticket = await getClient().verifyIdToken({ idToken: credential, audience: clientId });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) throw new Error('Invalid Google credential.');

  return { googleId: payload.sub, email: payload.email, name: payload.name || payload.email.split('@')[0] };
}
