import type { ScraperProvider } from "@/lib/validations/instagram";
import type { InstagramProvider } from "./types";
import { apifyProvider } from "./apify";
import { brightDataProvider } from "./brightdata";
import { scrapingBeeProvider } from "./scrapingbee";
import { crawlbaseProvider } from "./crawlbase";

const REGISTRY: Record<ScraperProvider, InstagramProvider> = {
  apify: apifyProvider,
  brightdata: brightDataProvider,
  scrapingbee: scrapingBeeProvider,
  crawlbase: crawlbaseProvider,
};

export function getProvider(id: ScraperProvider): InstagramProvider {
  return REGISTRY[id];
}

export type { InstagramProvider, RawPost, ProviderRunOpts } from "./types";
export { QuotaExceededError, ProviderConfigError } from "./types";
