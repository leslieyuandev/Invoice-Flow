import type { InstagramProvider, ProviderRunOpts, RawPost } from "./types";
import { QuotaExceededError } from "./types";
import { normalizeApifyItem } from "./normalize";

const ACTOR = "apify~instagram-hashtag-scraper";
const RUN_TIMEOUT_MS = 290_000; // run-sync server limit is ~5 min

/** Map an Apify HTTP error to a quota error when it looks like a credit/rate problem. */
function isQuotaStatus(status: number, body: string): boolean {
  if (status === 402 || status === 429) return true;
  if (status === 403 && /credit|quota|usage|limit|exceed|monthly/i.test(body)) return true;
  return false;
}

/**
 * Apify provider — runs the real `apify/instagram-hashtag-scraper` actor via the
 * "run actor synchronously and get dataset items" endpoint, one call per hashtag so
 * results can be attributed. Honours free credits only (the runner stops the provider
 * at its free allowance; a 402/429 from Apify also flips it to limited).
 */
export const apifyProvider: InstagramProvider = {
  id: "apify",
  async scrapeHashtag(hashtag: string, opts: ProviderRunOpts): Promise<RawPost[]> {
    const endpoint =
      `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items` +
      `?token=${encodeURIComponent(opts.token)}&clean=true`;

    // The hashtag actor returns both image and video posts; "reels" are the video ones,
    // which we filter from the results below.
    const input = {
      hashtags: [hashtag],
      resultsType: "posts",
      resultsLimit: opts.maxResults,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RUN_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (isQuotaStatus(res.status, body)) {
        throw new QuotaExceededError(`Apify free credits exhausted (HTTP ${res.status}).`);
      }
      throw new Error(`Apify run failed (HTTP ${res.status}): ${body.slice(0, 300)}`);
    }

    const items = (await res.json()) as unknown;
    if (!Array.isArray(items)) return [];

    const posts: RawPost[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      const post = normalizeApifyItem(item);
      if (!post || seen.has(post.shortCode)) continue;
      if (opts.resultsType === "reels" && post.type && !/video|reel|clips/i.test(post.type)) continue;
      seen.add(post.shortCode);
      posts.push(post);
      if (posts.length >= opts.maxResults) break;
    }
    return posts;
  },
};
