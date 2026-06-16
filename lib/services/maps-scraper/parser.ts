import "server-only";
import type { Page } from "playwright";
import type { RawPlace } from "./types";

/* ────────────────────────────────────────────────────────────────────────────
 * DOM extraction — the reliable baseline.
 * Reads each result card in the side-panel feed. Selectors combine semantic
 * attributes with Google's (obfuscated, drift-prone) class names plus fallbacks.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface DomPlace {
  placeId: string;
  title: string;
  category: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  openingStatus: string | null;
}

export async function extractPlacesFromDom(page: Page, maxResults: number): Promise<DomPlace[]> {
  const raw = await page
    .$$eval('div[role="feed"] a[href*="/maps/place/"]', (anchors) => {
      const STATUS_TOKENS = [
        "Permanently closed",
        "Temporarily closed",
        "Opening soon",
        "Opens soon",
        "Closing soon",
        "Closed",
        "Open 24 hours",
        "Open",
      ];

      function parseFloatSafe(s: string | null | undefined): number | null {
        if (!s) return null;
        const n = parseFloat(s.replace(/[^\d.]/g, ""));
        return Number.isFinite(n) ? n : null;
      }

      return anchors.map((a) => {
        const href = a.getAttribute("href") || "";
        // Card container is the anchor's parent block.
        const card = (a.closest("div[jsaction]") || a.parentElement || a) as HTMLElement;

        // place_id / ftid + coordinates live in the place URL.
        const ftid = href.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i)?.[1] || "";
        const lat = href.match(/!3d(-?\d+\.\d+)/)?.[1];
        const lng = href.match(/!4d(-?\d+\.\d+)/)?.[1];
        const slug = href.split("/maps/place/")[1]?.split("/")[0] || "";
        const placeId = ftid || decodeURIComponent(slug);

        const title = a.getAttribute("aria-label") || card.querySelector(".qBF1Pd")?.textContent || "";

        // Rating + reviews: prefer the role=img summary ("4.4 stars 392 reviews").
        let rating: number | null = null;
        let reviewCount: number | null = null;
        const ratingImg = card.querySelector('[role="img"][aria-label*="star" i]');
        const ratingLabel = ratingImg?.getAttribute("aria-label") || "";
        const ratingNums = ratingLabel.match(/[\d,.]+/g);
        if (ratingNums && ratingNums.length >= 1) rating = parseFloatSafe(ratingNums[0]);
        if (ratingNums && ratingNums.length >= 2) {
          reviewCount = parseInt(ratingNums[1].replace(/[^\d]/g, ""), 10) || null;
        }
        if (rating == null) rating = parseFloatSafe(card.querySelector(".MW4etd")?.textContent);
        if (reviewCount == null) {
          const rc = card.querySelector(".UY7F9")?.textContent || "";
          reviewCount = parseInt(rc.replace(/[^\d]/g, ""), 10) || null;
        }

        // Category / address / phone from the info rows.
        const infoBlocks = Array.from(card.querySelectorAll(".W4Efsd"))
          .map((el) => (el as HTMLElement).innerText.trim())
          .filter(Boolean);
        const infoText = infoBlocks.join(" · ");
        const segments = infoText
          .split("·")
          .map((s) => s.trim())
          .filter(Boolean);

        let category: string | null = null;
        let address: string | null = null;
        if (segments.length) {
          // First segment is usually the category; the segment that contains a
          // street number is the address.
          category = segments[0] || null;
          address = segments.find((s) => /\d/.test(s) && !/^\+?\d[\d\s().-]{7,}\d$/.test(s)) || null;
          if (address === category) address = segments[1] || null;
        }

        // Phone: Google renders it in a dedicated span; fall back to a regex scan.
        let phone: string | null =
          (card.querySelector(".UsdlK") as HTMLElement | null)?.innerText?.trim() || null;
        if (!phone) {
          const m = infoText.match(/(\+?\d[\d\s().-]{7,}\d)/);
          phone = m ? m[1].trim() : null;
        }

        // Website button on the card.
        const siteEl = card.querySelector(
          'a[data-value="Website"], a[aria-label*="website" i], a[aria-label*="Visit" i]'
        ) as HTMLAnchorElement | null;
        const website = siteEl?.href || null;

        // Opening status tag.
        const cardText = card.innerText || "";
        const openingStatus = STATUS_TOKENS.find((t) => cardText.includes(t)) || null;

        return {
          placeId,
          title: (title || "").trim(),
          category,
          address,
          latitude: lat ? parseFloat(lat) : null,
          longitude: lng ? parseFloat(lng) : null,
          phone,
          website,
          rating,
          reviewCount,
          openingStatus,
        };
      });
    })
    .catch(() => [] as DomPlace[]);

  // Dedupe by placeId, keep first, cap at maxResults.
  const seen = new Set<string>();
  const out: DomPlace[] = [];
  for (const p of raw) {
    if (!p.placeId || !p.title) continue;
    if (seen.has(p.placeId)) continue;
    seen.add(p.placeId);
    out.push(p);
    if (out.length >= maxResults) break;
  }
  return out;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Address parsing — split a formatted address into table columns.
 * ──────────────────────────────────────────────────────────────────────────── */

export function parseAddress(address: string | null): {
  street: string | null;
  city: string | null;
  state: string | null;
  countryCode: string | null;
} {
  if (!address) return { street: null, city: null, state: null, countryCode: null };
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 1) {
    return { street: parts[0], city: null, state: null, countryCode: null };
  }
  const street = parts[0] || null;
  const city = parts[1] || null;
  // "State ZIP" → keep the state token.
  const stateZip = parts[2] || "";
  const state = stateZip.replace(/\d{4,}.*$/, "").trim() || null;
  const countryCode = parts.length >= 4 ? parts[parts.length - 1] : null;
  return { street, city, state, countryCode };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Payload enrichment — the "fast route" (brittle, isolated, best-effort).
 * Mines the intercepted Maps RPC arrays for deeper fields (full address,
 * website, phone, structured hours, claimed status) keyed by ftid/title.
 * Uses the widely-cited place-array indices; all access is guarded so a format
 * change degrades to "no enrichment" rather than throwing.
 * ──────────────────────────────────────────────────────────────────────────── */

type AnyArr = unknown[];

function isArr(v: unknown): v is AnyArr {
  return Array.isArray(v);
}
function get(node: unknown, ...path: number[]): unknown {
  let cur = node;
  for (const i of path) {
    if (!isArr(cur)) return undefined;
    cur = cur[i];
  }
  return cur;
}
function asStr(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function asNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export interface PayloadPlace {
  ftid: string | null;
  title: string | null;
  address: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  countryCode: string | null;
  website: string | null;
  phone: string | null;
  category: string | null;
  operatingHours: string[] | null;
  claimedStatus: string | null;
  latitude: number | null;
  longitude: number | null;
}

/** Heuristic: does this array look like a Google "place" entry? */
function looksLikePlaceArray(a: AnyArr): boolean {
  // [11] = name (string) and [9] = geo array; ftid often at [10].
  return typeof a[11] === "string" && (isArr(a[9]) || typeof a[10] === "string");
}

function extractPlaceArray(a: AnyArr): PayloadPlace | null {
  const title = asStr(a[11]);
  if (!title) return null;

  const ftid = asStr(a[10]);
  const address = asStr(get(a, 18)) || asStr(get(a, 39));
  // Address component lines live at [2] (array of strings).
  const lines = isArr(a[2]) ? (a[2] as unknown[]).map(asStr).filter(Boolean) as string[] : [];
  const website = asStr(get(a, 7, 0)) || asStr(get(a, 7, 1));
  const phone = asStr(get(a, 178, 0, 0)) || asStr(get(a, 178, 0, 3, 0));
  const category = asStr(get(a, 13, 0));
  const lat = asNum(get(a, 9, 2));
  const lng = asNum(get(a, 9, 3));

  // Structured weekly hours: [34][1] → [[day, [ranges...]], ...].
  let operatingHours: string[] | null = null;
  const hoursNode = get(a, 34, 1);
  if (isArr(hoursNode)) {
    const rows: string[] = [];
    for (const row of hoursNode) {
      const day = asStr(get(row as AnyArr, 0));
      const ranges = get(row as AnyArr, 1);
      if (day && isArr(ranges)) {
        const r = (ranges as unknown[]).map(asStr).filter(Boolean).join(", ");
        rows.push(`${day}: ${r || "Closed"}`);
      }
    }
    if (rows.length) operatingHours = rows;
  }

  // Claimed / unclaimed signal: an "Own this business?"/"Claim" marker → unclaimed.
  const claimedStatus =
    asStr(get(a, 57, 1)) === "1" || website ? "Claimed" : null;

  const cityFromLines = lines.length >= 2 ? lines[lines.length - 2] : null;
  const stateCountry = lines.length >= 1 ? lines[lines.length - 1] : null;

  return {
    ftid,
    title,
    address: address || (lines.length ? lines.join(", ") : null),
    street: lines[0] || null,
    city: cityFromLines,
    state: stateCountry,
    countryCode: null,
    website,
    phone,
    category,
    operatingHours,
    claimedStatus,
    latitude: lat,
    longitude: lng,
  };
}

export function extractPlacesFromPayloads(payloads: unknown[]): PayloadPlace[] {
  const out: PayloadPlace[] = [];
  const seen = new Set<string>();

  const visit = (node: unknown, depth: number) => {
    if (depth > 12 || !isArr(node)) return;
    if (looksLikePlaceArray(node)) {
      const p = extractPlaceArray(node);
      if (p) {
        const key = p.ftid || p.title || "";
        if (key && !seen.has(key)) {
          seen.add(key);
          out.push(p);
        }
      }
    }
    for (const child of node) {
      if (isArr(child)) visit(child, depth + 1);
    }
  };

  for (const payload of payloads) visit(payload, 0);
  return out;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Merge DOM (authoritative) with payload enrichment → final RawPlace records.
 * ──────────────────────────────────────────────────────────────────────────── */

export function mergePlaces(domPlaces: DomPlace[], payloadPlaces: PayloadPlace[]): RawPlace[] {
  const byFtid = new Map<string, PayloadPlace>();
  const byTitle = new Map<string, PayloadPlace>();
  for (const p of payloadPlaces) {
    if (p.ftid) byFtid.set(p.ftid, p);
    if (p.title) byTitle.set(p.title.toLowerCase(), p);
  }

  return domPlaces.map((d) => {
    const enrich =
      (d.placeId && byFtid.get(d.placeId)) || byTitle.get(d.title.toLowerCase()) || null;

    const address = d.address || enrich?.address || null;
    const parsed = parseAddress(address);

    return {
      placeId: d.placeId,
      title: d.title,
      category: d.category || enrich?.category || null,
      address,
      street: parsed.street || enrich?.street || null,
      city: parsed.city || enrich?.city || null,
      state: parsed.state || enrich?.state || null,
      countryCode: parsed.countryCode || enrich?.countryCode || null,
      latitude: d.latitude ?? enrich?.latitude ?? null,
      longitude: d.longitude ?? enrich?.longitude ?? null,
      phone: d.phone || enrich?.phone || null,
      website: d.website || enrich?.website || null,
      claimedStatus: enrich?.claimedStatus || null,
      operatingHours: enrich?.operatingHours || null,
      rating: d.rating,
      reviewCount: d.reviewCount,
      openingStatus: d.openingStatus,
      // Detail-crawl / enrichment fields — populated later only if those add-ons run.
      isClaimed: null,
      description: null,
      plusCode: null,
      priceLevel: null,
      imageUrls: null,
      reviews: null,
      emails: null,
      socialProfiles: null,
      isLikelyNew: false,
      newnessSignals: null,
    };
  });
}
