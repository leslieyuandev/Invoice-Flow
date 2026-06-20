import type { InstagramProvider, ProviderRunOpts, RawPost } from "./types";
import { QuotaExceededError, ProviderConfigError } from "./types";
import { normalizeBrightDataRecord } from "./normalize";

const TRIGGER = "https://api.brightdata.com/datasets/v3/trigger";
const PROGRESS = "https://api.brightdata.com/datasets/v3/progress";
const SNAPSHOT = "https://api.brightdata.com/datasets/v3/snapshot";

const POLL_INTERVAL_MS = 5_000;
const MAX_WAIT_MS = 280_000;

function isQuota(status: number, body: string): boolean {
  return status === 402 || status === 429 || (status === 403 && /quota|credit|limit|balance/i.test(body));
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Bright Data provider — triggers the "Instagram Hashtags Scraper" dataset, polls the
 * snapshot to completion, then downloads the records. Requires both BRIGHTDATA_TOKEN
 * and a BRIGHTDATA_IG_HASHTAG_DATASET_ID for the hashtag-discovery dataset.
 */
export const brightDataProvider: InstagramProvider = {
  id: "brightdata",
  async scrapeHashtag(hashtag: string, opts: ProviderRunOpts): Promise<RawPost[]> {
    const datasetId = process.env.BRIGHTDATA_IG_HASHTAG_DATASET_ID;
    if (!datasetId) {
      throw new ProviderConfigError("BRIGHTDATA_IG_HASHTAG_DATASET_ID is not set.");
    }
    const auth = { Authorization: `Bearer ${opts.token}` };

    // 1) Trigger a discover-by-hashtag collection.
    const triggerUrl =
      `${TRIGGER}?dataset_id=${encodeURIComponent(datasetId)}` +
      `&include_errors=true&type=discover_new&discover_by=hashtag`;
    const trigRes = await fetch(triggerUrl, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify([{ hashtag, num_of_posts: opts.maxResults }]),
    });
    if (!trigRes.ok) {
      const body = await trigRes.text().catch(() => "");
      if (isQuota(trigRes.status, body)) throw new QuotaExceededError("Bright Data credits exhausted.");
      throw new Error(`Bright Data trigger failed (HTTP ${trigRes.status}): ${body.slice(0, 300)}`);
    }
    const { snapshot_id: snapshotId } = (await trigRes.json()) as { snapshot_id?: string };
    if (!snapshotId) throw new Error("Bright Data did not return a snapshot id.");

    // 2) Poll progress until ready.
    const deadline = Date.now() + MAX_WAIT_MS;
    for (;;) {
      if (Date.now() > deadline) throw new Error("Bright Data snapshot timed out.");
      await sleep(POLL_INTERVAL_MS);
      const pRes = await fetch(`${PROGRESS}/${snapshotId}`, { headers: auth });
      if (!pRes.ok) {
        const body = await pRes.text().catch(() => "");
        if (isQuota(pRes.status, body)) throw new QuotaExceededError("Bright Data credits exhausted.");
        continue;
      }
      const { status } = (await pRes.json()) as { status?: string };
      if (status === "ready") break;
      if (status === "failed") throw new Error("Bright Data snapshot failed.");
    }

    // 3) Download the records.
    const sRes = await fetch(`${SNAPSHOT}/${snapshotId}?format=json`, { headers: auth });
    if (!sRes.ok) {
      const body = await sRes.text().catch(() => "");
      if (isQuota(sRes.status, body)) throw new QuotaExceededError("Bright Data credits exhausted.");
      throw new Error(`Bright Data download failed (HTTP ${sRes.status}).`);
    }
    const data = (await sRes.json()) as unknown;
    const records = Array.isArray(data) ? data : [];

    const posts: RawPost[] = [];
    const seen = new Set<string>();
    for (const rec of records) {
      const post = normalizeBrightDataRecord(rec);
      if (!post || seen.has(post.shortCode)) continue;
      seen.add(post.shortCode);
      posts.push(post);
      if (posts.length >= opts.maxResults) break;
    }
    return posts;
  },
};
