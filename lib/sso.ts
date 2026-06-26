import crypto from "crypto";

/**
 * Cross-domain single sign-on between the main app (Vercel) and the self-hosted
 * Maps Extractor (different domain). Browsers never share a session cookie across
 * unrelated domains, so instead the main app mints a short-lived, HMAC-signed
 * token for the logged-in user and hands it to the maps app, which verifies it
 * and starts its own session. Both deployments must share the same SSO_SECRET.
 *
 * Token format (compact, dependency-free): base64url(payloadJSON).base64url(hmac).
 */

const SECRET = process.env.SSO_SECRET || "";
const TTL_SECONDS = 120; // tokens are single-trip; keep the window tight.

type SsoPayload = {
  sub: string; // user id
  email: string;
  iat: number;
  exp: number;
};

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(str: string): Buffer {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function sign(payloadPart: string): string {
  return b64url(crypto.createHmac("sha256", SECRET).update(payloadPart).digest());
}

/** Mint a token for a logged-in user (called on the main app). */
export function signSsoToken(user: { id: string; email: string }): string {
  if (!SECRET) throw new Error("SSO_SECRET is not set");
  const now = Math.floor(Date.now() / 1000);
  const payload: SsoPayload = { sub: user.id, email: user.email, iat: now, exp: now + TTL_SECONDS };
  const payloadPart = b64url(Buffer.from(JSON.stringify(payload)));
  return `${payloadPart}.${sign(payloadPart)}`;
}

/** Verify a token and return its payload, or null if invalid/expired (called on the maps app). */
export function verifySsoToken(token: string | null | undefined): SsoPayload | null {
  if (!SECRET || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadPart, sig] = parts;

  // Constant-time signature check.
  const expected = sign(payloadPart);
  const a = fromB64url(sig);
  const b = fromB64url(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(fromB64url(payloadPart).toString("utf8")) as SsoPayload;
    if (Math.floor(Date.now() / 1000) > payload.exp) return null;
    if (!payload.sub || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}
