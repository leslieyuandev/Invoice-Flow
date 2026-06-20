import type { InstagramProvider, ProviderRunOpts, RawPost } from "./types";
import { QuotaExceededError } from "./types";
import { extractIgMediaNodesFromText, normalizeIgMediaNode } from "./normalize";
import { IG_APP_ID, igHashtagInfoUrl } from "./instagram-endpoint";

const ENDPOINT = "https://api.crawlbase.com/";

/**
 * Crawlbase (formerly ProxyCrawl) provider — like ScrapingBee, a generic crawling API,
 * so we fetch Instagram's hashtag JSON endpoint through it and parse with the shared
 * normalizer. Best-effort.
 */
export const crawlbaseProvider: InstagramProvider = {
  id: "crawlbase",
  async scrapeHashtag(hashtag: string, opts: ProviderRunOpts): Promise<RawPost[]> {
    const target = igHashtagInfoUrl(hashtag);
    const url =
      `${ENDPOINT}?token=${encodeURIComponent(opts.token)}` +
      `&url=${encodeURIComponent(target)}` +
      `&format=html&request_headers=${encodeURIComponent(`x-ig-app-id:${IG_APP_ID}`)}`;

    const res = await fetch(url);

    // Crawlbase signals the upstream status in the `pc_status` / `original_status` headers.
    const pcStatus = parseInt(res.headers.get("pc_status") || res.headers.get("original_status") || "0", 10);
    if (res.status === 401 || res.status === 402 || res.status === 429 || pcStatus === 429) {
      const body = await res.text().catch(() => "");
      if (res.status === 402 || res.status === 429 || pcStatus === 429 || /credit|limit|quota/i.test(body)) {
        throw new QuotaExceededError("Crawlbase free requests exhausted.");
      }
      throw new Error(`Crawlbase request failed (HTTP ${res.status}): ${body.slice(0, 200)}`);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Crawlbase request failed (HTTP ${res.status}): ${body.slice(0, 200)}`);
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
