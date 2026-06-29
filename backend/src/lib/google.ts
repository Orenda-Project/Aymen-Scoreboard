import { OAuth2Client } from 'google-auth-library';

// GOOGLE_CLIENT_ID is the public OAuth Web client ID. Used both as the
// verification audience and (served via /api/auth/config) by the frontend.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

export interface GoogleProfile {
  email: string;        // lowercased
  name: string;
  sub: string;          // Google's stable user id
  emailVerified: boolean;
}

export function isGoogleConfigured(): boolean {
  return !!CLIENT_ID;
}

/**
 * Verify a Google Identity Services credential (ID token / JWT) and extract
 * the user's profile. Throws if the token is invalid, expired, or for a
 * different audience.
 */
export async function verifyGoogleCredential(idToken: string): Promise<GoogleProfile> {
  if (!CLIENT_ID) throw new Error('Google sign-in is not configured');

  const ticket = await client.verifyIdToken({ idToken, audience: CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.email) throw new Error('No email in Google token');

  return {
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email,
    sub: payload.sub,
    emailVerified: !!payload.email_verified,
  };
}
