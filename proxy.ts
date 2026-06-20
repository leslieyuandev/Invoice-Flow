import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * On a "Maps only" self-hosted instance (`MAPS_ONLY=true`), block the other modules
 * so the deployment only exposes the self-hosted scraper tools (Maps Extractor +
 * Instagram Hashtag Scraper). The full app (invoices, quotations, creative, …) lives
 * on the main deployment, which does not set MAPS_ONLY.
 */
const ALLOWED_PREFIXES = [
  "/maps-extractor",
  "/api/maps",
  "/instagram-extractor",
  "/api/instagram",
  "/api/auth",
  "/login",
  "/register",
];

export function proxy(request: NextRequest) {
  if (process.env.MAPS_ONLY !== "true") return NextResponse.next();

  const { pathname } = request.nextUrl;
  const allowed = ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (allowed) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/maps-extractor";
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon).*)"],
};
