import { z } from "zod";

/**
 * Input schema for a Google Maps extraction job — the project's "Pydantic/TypedDict"
 * analog (zod is used across `lib/validations/*`). Mirrors the parameters + add-ons
 * offered by commercial scrapers (Apify / Outscraper).
 */

// Optional lat/long bounding box used to force a localized search.
export const coordinatesSchema = z.object({
  north: z.number().min(-90).max(90),
  south: z.number().min(-90).max(90),
  east: z.number().min(-180).max(180),
  west: z.number().min(-180).max(180),
});

export const proxyConfigSchema = z.object({
  enabled: z.boolean().default(false),
  // e.g. http://gate.smartproxy.com:7000 — one entry; the provider rotates residential IPs.
  server: z.string().trim().optional(),
  username: z.string().trim().optional(),
  password: z.string().optional(),
});

// "Define the search area by other geolocation parameters" (asterisked Apify section).
export const geolocationSchema = z.object({
  country: z.string().trim().optional(),
  state: z.string().trim().optional(),
  city: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  zoom: z.number().min(1).max(21).optional(),
  radiusKm: z.number().min(0.1).max(500).optional(),
});

// "Search filters & categories" add-on.
export const filtersSchema = z.object({
  categories: z.array(z.string().trim().min(1)).optional(),
  minStars: z.number().min(0).max(5).optional(),
  minReviews: z.number().int().min(0).optional(),
  maxReviews: z.number().int().min(0).optional(),
  skipClosedPlaces: z.boolean().optional(),
  titleMustMatch: z.boolean().optional(),
});

// Toggle bundle for the per-place / enrichment add-ons.
export const addOnsSchema = z.object({
  placeDetails: z.boolean().optional(), // Additional place details scraping
  contacts: z.boolean().optional(),     // Company contacts enrichment (website emails/socials)
  leads: z.boolean().optional(),        // Business leads enrichment (website-derived, see note)
  reviews: z.boolean().optional(),
  maxReviews: z.number().int().min(1).max(100).optional(),
  images: z.boolean().optional(),
  maxImages: z.number().int().min(1).max(50).optional(),
});

// The pre-opening / newly-opened lead-detection use case.
export const preOpeningSchema = z.object({
  detect: z.boolean().optional(), // compute isLikelyNew + signals (auto-enables placeDetails)
  onlyNew: z.boolean().optional(), // keep only flagged rows
});

export const scrapeInputSchema = z
  .object({
    searchQueries: z
      .array(z.string().trim().min(1, "Query cannot be empty"))
      .max(20, "At most 20 queries per job")
      .default([]),
    // Direct Google Maps URLs OR place IDs / ftids ("Scrape with Google Maps URLs or place IDs").
    startUrls: z.array(z.string().trim().min(1)).max(50).optional(),
    // "Scraping places without search terms or URLs" — scrape an area by category only.
    searchWithoutTerms: z.boolean().optional(),
    // Free-text location hint appended to each query (e.g. "New York, USA").
    location: z.string().trim().optional(),
    coordinates: coordinatesSchema.optional().nullable(),
    geolocation: geolocationSchema.optional(),
    language: z.string().trim().min(2).max(5).default("en"),
    maxResults: z.number().int().min(1).max(500).default(50),
    proxy: proxyConfigSchema.optional(),
    filters: filtersSchema.optional(),
    addOns: addOnsSchema.optional(),
    preOpening: preOpeningSchema.optional(),
  })
  .refine(
    (v) =>
      v.searchQueries.length > 0 ||
      (v.startUrls?.length ?? 0) > 0 ||
      (v.searchWithoutTerms && (v.filters?.categories?.length ?? 0) > 0),
    {
      message:
        "Provide at least one search term, a start URL/place ID, or enable area-only scraping with a category.",
      path: ["searchQueries"],
    }
  );

export type ScrapeInput = z.infer<typeof scrapeInputSchema>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type ProxyConfig = z.infer<typeof proxyConfigSchema>;
export type Geolocation = z.infer<typeof geolocationSchema>;
export type ScrapeFilters = z.infer<typeof filtersSchema>;
export type AddOns = z.infer<typeof addOnsSchema>;
export type PreOpening = z.infer<typeof preOpeningSchema>;

export const saveClientsSchema = z.object({
  placeIds: z.array(z.string().min(1)).min(1, "Select at least one place"),
});
