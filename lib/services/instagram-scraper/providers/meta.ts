import type { ScraperProvider } from "@/lib/validations/instagram";

/**
 * Static, dependency-free metadata for each scrape provider. Kept separate from the
 * provider implementations so the read-only credit/status service can import it
 * without pulling in any network code.
 *
 * `defaultFreeCredits` is the free allowance assumed per refresh period (results),
 * overridable per deployment via the listed env var. The provider is disabled in the
 * UI once `creditsUsed` reaches this number — or sooner if the provider's API reports
 * its own quota exhaustion. `tokenEnv` (and `extraEnv`) must be set for the provider
 * to be selectable at all.
 */
export interface ProviderMeta {
  id: ScraperProvider;
  label: string;
  docsUrl: string;
  tokenEnv: string;
  extraEnv?: string[];
  defaultFreeCredits: number;
  freeCreditsEnv: string;
  unit: string;
  costNote: string;
}

export const PROVIDER_META: Record<ScraperProvider, ProviderMeta> = {
  apify: {
    id: "apify",
    label: "Apify — Instagram Hashtag Scraper",
    docsUrl: "https://apify.com/apify/instagram-hashtag-scraper",
    tokenEnv: "APIFY_TOKEN",
    defaultFreeCredits: 1000,
    freeCreditsEnv: "APIFY_FREE_CREDITS",
    unit: "results",
    costNote: "$5 free platform credits / month · ~$2.60 per 1,000 results after",
  },
  brightdata: {
    id: "brightdata",
    label: "Bright Data — Instagram Hashtags Scraper",
    docsUrl: "https://brightdata.com/products/web-scraper/instagram",
    tokenEnv: "BRIGHTDATA_TOKEN",
    extraEnv: ["BRIGHTDATA_IG_HASHTAG_DATASET_ID"],
    defaultFreeCredits: 500,
    freeCreditsEnv: "BRIGHTDATA_FREE_CREDITS",
    unit: "records",
    costNote: "Free trial credits · pay-as-you-go after",
  },
  scrapingbee: {
    id: "scrapingbee",
    label: "ScrapingBee API",
    docsUrl: "https://www.scrapingbee.com/documentation/",
    tokenEnv: "SCRAPINGBEE_API_KEY",
    defaultFreeCredits: 1000,
    freeCreditsEnv: "SCRAPINGBEE_FREE_CREDITS",
    unit: "credits",
    costNote: "1,000 free API credits to start (best-effort Instagram parsing)",
  },
  crawlbase: {
    id: "crawlbase",
    label: "Crawlbase (formerly ProxyCrawl)",
    docsUrl: "https://crawlbase.com/docs/crawling-api/",
    tokenEnv: "CRAWLBASE_TOKEN",
    defaultFreeCredits: 1000,
    freeCreditsEnv: "CRAWLBASE_FREE_CREDITS",
    unit: "requests",
    costNote: "1,000 free requests to start (best-effort Instagram parsing)",
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDER_META) as ScraperProvider[];

/** The provider's free allowance for a refresh period (env-overridable). */
export function freeCreditsFor(meta: ProviderMeta): number {
  const raw = process.env[meta.freeCreditsEnv];
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : meta.defaultFreeCredits;
}

/** True when every env var the provider needs is present. */
export function isProviderConfigured(meta: ProviderMeta): boolean {
  if (!process.env[meta.tokenEnv]) return false;
  return (meta.extraEnv ?? []).every((k) => !!process.env[k]);
}
