import { z } from "zod";

/**
 * Input schema for an Instagram Hashtag Scraper job — mirrors the parameters
 * offered by the Apify `apify/instagram-hashtag-scraper` actor (the reference):
 * one or more hashtags, posts vs. reels, a max-per-hashtag cap, and an option to
 * search by keyword instead of hashtag. The scrape itself is delegated to a
 * pluggable provider (Apify / Bright Data / ScrapingBee / Crawlbase).
 */

export const SCRAPER_PROVIDERS = ["apify", "brightdata", "scrapingbee", "crawlbase"] as const;
export const providerSchema = z.enum(SCRAPER_PROVIDERS);
export type ScraperProvider = z.infer<typeof providerSchema>;

export const resultsTypeSchema = z.enum(["posts", "reels"]);
export type ResultsType = z.infer<typeof resultsTypeSchema>;

// A bare hashtag/keyword: strip a leading "#" and surrounding spaces.
const hashtag = z
  .string()
  .trim()
  .transform((s) => s.replace(/^#+/, "").trim())
  .pipe(z.string().min(1, "Hashtag cannot be empty").max(100));

export const instagramInputSchema = z.object({
  hashtags: z
    .array(hashtag)
    .min(1, "Add at least one hashtag")
    .max(30, "At most 30 hashtags per run"),
  // Treat the inputs as free-text keywords instead of exact hashtags.
  searchByKeyword: z.boolean().default(false),
  resultsType: resultsTypeSchema.default("posts"),
  // Max posts/reels to scrape per hashtag.
  maxResults: z.number().int().min(1).max(1000).default(20),
  provider: providerSchema.default("apify"),
});

export type InstagramInput = z.infer<typeof instagramInputSchema>;
