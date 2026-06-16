import "server-only";
import type { BrowserContext, Page } from "playwright";
import { launchBrowser } from "./browser";
import { dismissConsent } from "./consent";
import { attachInterceptor } from "./interceptor";
import { autoScrollFeed } from "./scroll";
import {
  extractPlacesFromDom,
  extractPlacesFromPayloads,
  mergePlaces,
  parseAddress,
} from "./parser";
import { buildSearchUrl, normalizeStartUrl } from "./urls";
import { extractPlaceDetail, extractReviews, extractImages } from "./detail";
import { enrichContactsFromWebsite } from "./contacts";
import { computeNewness } from "./newness";
import { applyFilters, applyPreOpening } from "./filters";
import type { EngineOptions, RawPlace } from "./types";

const NAV_TIMEOUT = 60_000;

/** Whether any add-on requires opening each place's detail panel. */
function needsDetailCrawl(opts: EngineOptions): boolean {
  const a = opts.addOns;
  return !!(
    a?.placeDetails ||
    a?.contacts ||
    a?.leads ||
    a?.reviews ||
    a?.images ||
    opts.preOpening?.detect
  );
}

function emptyRawPlace(placeId: string, title: string): RawPlace {
  return {
    placeId,
    title,
    category: null,
    address: null,
    street: null,
    city: null,
    state: null,
    countryCode: null,
    latitude: null,
    longitude: null,
    phone: null,
    website: null,
    claimedStatus: null,
    operatingHours: null,
    rating: null,
    reviewCount: null,
    openingStatus: null,
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
}

function placeIdFromUrl(url: string): string | null {
  return (
    url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i)?.[1] ||
    url.match(/[?&]ftid=(0x[0-9a-f]+:0x[0-9a-f]+)/i)?.[1] ||
    null
  );
}

/**
 * Open a place's detail panel and merge richer fields onto an existing list record,
 * then optionally scrape reviews/images and enrich contacts from its website.
 * Mutates `place` in place. Never throws — a failed enrichment leaves the list data intact.
 */
async function enrichPlace(
  context: BrowserContext,
  page: Page,
  place: RawPlace,
  opts: EngineOptions
): Promise<void> {
  try {
    const url = normalizeStartUrl(place.placeId, opts.language);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
    await dismissConsent(page);

    const d = await extractPlaceDetail(page);
    place.category = d.category ?? place.category;
    if (d.address) {
      place.address = d.address;
      const a = parseAddress(d.address);
      place.street = a.street ?? place.street;
      place.city = a.city ?? place.city;
      place.state = a.state ?? place.state;
      place.countryCode = a.countryCode ?? place.countryCode;
    }
    place.phone = d.phone ?? place.phone;
    place.website = d.website ?? place.website;
    place.plusCode = d.plusCode ?? place.plusCode;
    place.priceLevel = d.priceLevel ?? place.priceLevel;
    place.rating = d.rating ?? place.rating;
    if (d.reviewCount != null) place.reviewCount = d.reviewCount;
    place.openingStatus = d.openingStatus ?? place.openingStatus;
    place.description = d.description ?? place.description;
    place.isClaimed = d.isClaimed;
    if (place.isClaimed != null) place.claimedStatus = place.isClaimed ? "Claimed" : "Unclaimed";

    if (opts.addOns?.reviews) {
      place.reviews = await extractReviews(page, opts.addOns.maxReviews ?? 20);
    }
    if (opts.addOns?.images) {
      place.imageUrls = await extractImages(page, opts.addOns.maxImages ?? 10);
    }
    if ((opts.addOns?.contacts || opts.addOns?.leads) && place.website) {
      const c = await enrichContactsFromWebsite(context, place.website);
      place.emails = c.emails.length ? c.emails : null;
      place.socialProfiles = c.socials;
    }
  } catch (err) {
    console.error(`[maps-scraper] detail enrichment failed for "${place.title}":`, err);
  }
}

/** Compute and apply pre-opening detection + filters, then hand off the batch. */
async function finalize(query: string, places: RawPlace[], opts: EngineOptions): Promise<void> {
  if (opts.preOpening?.detect) {
    for (const p of places) {
      const { isLikelyNew, signals } = computeNewness(p);
      p.isLikelyNew = isLikelyNew;
      p.newnessSignals = signals;
    }
  }
  let out = applyFilters(places, opts.filters, query);
  out = applyPreOpening(out, opts.preOpening?.onlyNew);
  if (opts.onPlaces) await opts.onPlaces(query, out);
}

/** Search path: list-scroll + extraction, then optional per-place detail crawl. */
async function scrapeSearch(
  context: BrowserContext,
  query: string,
  opts: EngineOptions
): Promise<void> {
  const page = await context.newPage();
  const store = attachInterceptor(page);
  try {
    const url = buildSearchUrl(query, opts.location, opts.coordinates, opts.geolocation, opts.language);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
    await dismissConsent(page);
    if (!page.url().includes("/maps/")) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT }).catch(() => {});
    }

    await page.waitForSelector('div[role="feed"]', { timeout: 15_000 }).catch(() => null);
    await autoScrollFeed(page, opts.maxResults);
    await page.waitForTimeout(800);

    const domPlaces = await extractPlacesFromDom(page, opts.maxResults);
    const payloadPlaces = extractPlacesFromPayloads(store.payloads);
    store.detach();
    const places = mergePlaces(domPlaces, payloadPlaces).slice(0, opts.maxResults);

    if (needsDetailCrawl(opts)) {
      for (const place of places) {
        await enrichPlace(context, page, place, opts);
        await page.waitForTimeout(400);
      }
    }

    await finalize(query, places, opts);
  } catch (err) {
    console.error(`[maps-scraper] query "${query}" failed:`, err);
  } finally {
    store.detach();
    await page.close().catch(() => {});
  }
}

/** Direct path: scrape specific places from Google Maps URLs / place IDs (detail only). */
async function scrapeStartUrls(context: BrowserContext, opts: EngineOptions): Promise<void> {
  const inputs = opts.startUrls ?? [];
  if (!inputs.length) return;

  const page = await context.newPage();
  const places: RawPlace[] = [];
  try {
    for (const input of inputs.slice(0, opts.maxResults)) {
      try {
        const url = normalizeStartUrl(input, opts.language);
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
        await dismissConsent(page);

        const d = await extractPlaceDetail(page);
        const placeId = placeIdFromUrl(page.url()) || input;
        const place = emptyRawPlace(placeId, d.title || input);
        // Treat the start-url input like a detail crawl by reusing the same enrichment.
        place.title = d.title || input;
        place.category = d.category;
        place.address = d.address;
        if (d.address) {
          const a = parseAddress(d.address);
          place.street = a.street;
          place.city = a.city;
          place.state = a.state;
          place.countryCode = a.countryCode;
        }
        place.phone = d.phone;
        place.website = d.website;
        place.plusCode = d.plusCode;
        place.priceLevel = d.priceLevel;
        place.rating = d.rating;
        place.reviewCount = d.reviewCount;
        place.openingStatus = d.openingStatus;
        place.description = d.description;
        place.isClaimed = d.isClaimed;
        if (place.isClaimed != null) place.claimedStatus = place.isClaimed ? "Claimed" : "Unclaimed";

        if (opts.addOns?.reviews) place.reviews = await extractReviews(page, opts.addOns.maxReviews ?? 20);
        if (opts.addOns?.images) place.imageUrls = await extractImages(page, opts.addOns.maxImages ?? 10);
        if ((opts.addOns?.contacts || opts.addOns?.leads) && place.website) {
          const c = await enrichContactsFromWebsite(context, place.website);
          place.emails = c.emails.length ? c.emails : null;
          place.socialProfiles = c.socials;
        }

        if (place.title) places.push(place);
        await page.waitForTimeout(400);
      } catch (err) {
        console.error(`[maps-scraper] start-url "${input}" failed:`, err);
      }
    }
    await finalize("URLs / place IDs", places, opts);
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Core scraper. Opens one browser for the whole job; runs the chosen start sources
 * (search queries, direct URLs/place-IDs, or area-by-category) and streams each batch
 * back through `onPlaces`. Per-source failures are isolated so one bad source can't
 * abort the whole job.
 */
export async function scrape(options: EngineOptions): Promise<void> {
  const { browser, context } = await launchBrowser(options.language, options.proxy);

  // "Scraping places without search terms or URLs" → use the chosen categories as terms.
  let queries = [...(options.searchQueries ?? [])];
  if (!queries.length && options.searchWithoutTerms && options.filters?.categories?.length) {
    queries = [...options.filters.categories];
  }

  try {
    if (options.startUrls?.length) {
      await scrapeStartUrls(context, options);
    }
    for (const query of queries) {
      await scrapeSearch(context, query, options);
      await new Promise((r) => setTimeout(r, 1500));
    }
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}
