import "server-only";
import type { ScraperProvider, ResultsType } from "@/lib/validations/instagram";
import { getProvider } from "./providers";
import { QuotaExceededError, ProviderConfigError } from "./providers/types";
import type { RawPost } from "./providers/types";

export interface EngineOptions {
  provider: ScraperProvider;
  token: string;
  hashtags: string[];
  searchByKeyword: boolean;
  resultsType: ResultsType;
  maxResults: number;
  onResults?: (hashtag: string, posts: RawPost[]) => Promise<void>;
}

/**
 * Run the selected provider across each hashtag, streaming each batch back through
 * `onResults`. A QuotaExceededError / ProviderConfigError aborts immediately so the
 * runner can disable the provider; other per-hashtag failures are isolated, but if
 * NO hashtag produced results the first error is rethrown to fail the job.
 */
export async function scrapeInstagram(opts: EngineOptions): Promise<void> {
  const provider = getProvider(opts.provider);
  let producedAny = false;
  let firstError: Error | null = null;

  for (const hashtag of opts.hashtags) {
    try {
      const posts = await provider.scrapeHashtag(hashtag, {
        token: opts.token,
        resultsType: opts.resultsType,
        maxResults: opts.maxResults,
        searchByKeyword: opts.searchByKeyword,
      });
      if (posts.length) producedAny = true;
      if (opts.onResults) await opts.onResults(hashtag, posts);
    } catch (err) {
      if (err instanceof QuotaExceededError || err instanceof ProviderConfigError) throw err;
      console.error(`[instagram-scraper] hashtag "${hashtag}" failed:`, err);
      if (!firstError) firstError = err instanceof Error ? err : new Error(String(err));
    }
    await new Promise((r) => setTimeout(r, 800)); // be gentle between hashtags
  }

  if (!producedAny && firstError) throw firstError;
}
