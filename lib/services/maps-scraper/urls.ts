import type { Coordinates, Geolocation } from "@/lib/validations/maps";

function appendParam(url: string, param: string): string {
  return url.includes("?") ? `${url}&${param}` : `${url}?${param}`;
}

/** Compose a human-readable area string from structured geolocation parts. */
export function geoToLocationText(geo?: Geolocation | null): string | null {
  if (!geo) return null;
  const parts = [geo.city, geo.state, geo.postalCode, geo.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/** Rough radius(km) → Google Maps zoom level (smaller radius ⇒ higher zoom). */
function radiusToZoom(radiusKm: number): number {
  const z = Math.round(14 - Math.log2(Math.max(0.1, radiusKm)));
  return Math.min(18, Math.max(3, z));
}

/**
 * Build a Google Maps search URL. Location text and geolocation parts are folded into
 * the search term; an explicit lat/lng/zoom (or radius) re-centres the viewport
 * ("Define the search area by other geolocation parameters").
 */
export function buildSearchUrl(
  query: string,
  location: string | null | undefined,
  coordinates: Coordinates | null | undefined,
  geo: Geolocation | null | undefined,
  language: string
): string {
  const areaText = location || geoToLocationText(geo);
  const text = [query, areaText].filter(Boolean).join(" ").trim();

  let url = `https://www.google.com/maps/search/${encodeURIComponent(text || query)}`;

  // Viewport centring precedence: explicit geo lat/lng > bounding box.
  if (geo?.lat != null && geo?.lng != null) {
    const zoom = geo.zoom ?? (geo.radiusKm ? radiusToZoom(geo.radiusKm) : 13);
    url += `/@${geo.lat},${geo.lng},${zoom}z`;
  } else if (coordinates) {
    const lat = (coordinates.north + coordinates.south) / 2;
    const lng = (coordinates.east + coordinates.west) / 2;
    url += `/@${lat},${lng},12z`;
  }

  url += `?hl=${encodeURIComponent(language)}&entry=ttu`;
  return url;
}

/**
 * Normalize a user-supplied start source into a navigable Maps URL. Accepts a full
 * Google Maps URL, a Place ID (ChIJ…), an ftid (0x…:0x…), or falls back to treating
 * the input as a search term.
 */
export function normalizeStartUrl(input: string, language: string): string {
  const value = input.trim();
  const hl = `hl=${encodeURIComponent(language)}`;

  if (/^https?:\/\//i.test(value)) {
    return appendParam(value, hl);
  }
  if (/^0x[0-9a-f]+:0x[0-9a-f]+$/i.test(value)) {
    return `https://www.google.com/maps?ftid=${value}&${hl}`;
  }
  // Place IDs are URL-safe base64-ish tokens, usually starting with ChIJ/GhIJ/Eh.
  if (/^[A-Za-z0-9_-]{20,}$/.test(value)) {
    return `https://www.google.com/maps/place/?q=place_id:${value}&${hl}`;
  }
  return `https://www.google.com/maps/search/${encodeURIComponent(value)}?${hl}`;
}
