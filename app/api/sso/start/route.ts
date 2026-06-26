import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { signSsoToken } from "@/lib/sso";

// Mints the SSO token (HMAC + crypto) for the current user — Node runtime only.
export const runtime = "nodejs";

/**
 * Entry point for "open the self-hosted Maps Extractor without logging in again".
 * The main-app sidebar links here (same origin). We read the already-authenticated
 * session, mint a short-lived token, and bounce the user to the maps app's /sso
 * consumer with the token. If anything is missing we fall back to the plain maps URL
 * (which will just show its own login page).
 */
export async function GET() {
  const base = process.env.MAPS_EXTRACTOR_URL; // e.g. https://halomaps.duckdns.org/maps-extractor
  if (!base) return NextResponse.json({ error: "Maps Extractor not configured" }, { status: 404 });

  const mapsOrigin = new URL(base).origin;
  const session = await auth();

  // Not logged in (or SSO not configured): just send them to the maps app directly.
  if (!session?.user?.id || !session.user.email || !process.env.SSO_SECRET) {
    return NextResponse.redirect(base);
  }

  const token = signSsoToken({ id: session.user.id, email: session.user.email });
  const target = new URL("/sso", mapsOrigin);
  target.searchParams.set("token", token);
  return NextResponse.redirect(target);
}
