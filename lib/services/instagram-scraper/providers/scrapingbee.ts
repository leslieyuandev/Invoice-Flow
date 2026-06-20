import type { InstagramProvider, ProviderRunOpts, RawPost } from "./types";
import { QuotaExceededError } from "./types";
import { extractIgMediaNodesFromText, normalizeIgMediaNode } from "./normalize";
import { IG_APP_ID, igHashtagInfoUrl } from "./instagram-endpoint";

const ENDPOINT = "https://app.scrapingbee.com/api/v1/";

/**
 * ScrapingBee provider — a general-purpose scraping API (no native Instagram parser),
 * so we fetch Instagram's hashtag JSON endpoint through it and parse with the shared
 * normalizer. Best-effort: it returns fewer fields than the dedicated actors and
 * depends on the IG endpoint staying reachable.
 */
export const scrapingBeeProvider: InstagramProvider = {
  id: "scrapingbee",
  async scrapeHashtag(hashtag: string, opts: ProviderRunOpts): Promise<RawPost[]> {
    const target = igHashtagInfoUrl(hashtag);
    const url =
      `${ENDPOINT}?api_key=${encodeURIComponent(opts.token)}` +
      `&url=${encodeURIComponent(target)}` +
      `&render_js=false&forward_headers=true`;

    const res = await fetch(url, {
      // ScrapingBee forwards request headers prefixed with "Spb-" to the target.
      headers: { "Spb-x-ig-app-id": IG_APP_ID },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 402 || res.status === 429) {
        throw new QuotaExceededError("ScrapingBee free credits exhausted.");
      }
      throw new Error(`ScrapingBee request failed (HTTP ${res.status}): ${body.slice(0, 200)}`);
    }

    const text = await res.text();
    const nodes = extractIgMediaNodesFromText(text);

    const posts: RawPost[] = [];
    const seen = new Set<string>();
    for (const node of nodes) {
      const post = normalizeIgMediaNode(node);
      if (!post || seen.has(post.shortCode)) continue;
      seen.add(post.shortCode);
      posts.push(post);
      if (posts.length >= opts.maxResults) break;
    }
    return posts;
  },
};
