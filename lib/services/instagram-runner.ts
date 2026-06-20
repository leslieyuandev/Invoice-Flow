import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { ScraperProvider, ResultsType } from "@/lib/validations/instagram";
import { scrapeInstagram } from "./instagram-scraper/engine";
import { QuotaExceededError, ProviderConfigError } from "./instagram-scraper/providers/types";
import type { RawPost } from "./instagram-scraper/providers/types";
import {
  assertProviderAvailable,
  getProviderToken,
  recordUsage,
  markProviderLimited,
  recordProviderError,
  ProviderUnavailableError,
} from "./instagram-credits";

/**
 * Background job runner with an in-process queue, mirroring the Maps runner. Kept in
 * its own module and lazy-loaded by the POST route so the read-only query paths (used
 * by Server Components) never import the provider/network graph.
 *
 * Provider calls are HTTP (no headless browser), so the concurrency caps are higher
 * than Maps: `INSTAGRAM_MAX_CONCURRENCY` (default 3) globally + `INSTAGRAM_MAX_PER_USER`
 * (default 1). Extra jobs wait as PENDING ("Queued") until a slot frees.
 */

const MAX_CONCURRENT = Math.max(1, parseInt(process.env.INSTAGRAM_MAX_CONCURRENCY || "3", 10) || 3);
const PER_USER_MAX = Math.max(1, parseInt(process.env.INSTAGRAM_MAX_PER_USER || "1", 10) || 1);

interface QueueEntry {
  jobId: string;
  userId: string;
}

const queue: QueueEntry[] = [];
const tracked = new Set<string>();
const activeByUser = new Map<string, number>();
let active = 0;

/** Enqueue a job; it starts as soon as a global + per-user slot is free. */
export function runInstagramJob(jobId: string, userId: string): void {
  if (tracked.has(jobId)) return;
  tracked.add(jobId);
  queue.push({ jobId, userId });
  pump();
}

function pump(): void {
  while (active < MAX_CONCURRENT) {
    const idx = queue.findIndex((e) => (activeByUser.get(e.userId) ?? 0) < PER_USER_MAX);
    if (idx === -1) break;

    const [entry] = queue.splice(idx, 1);
    active++;
    activeByUser.set(entry.userId, (activeByUser.get(entry.userId) ?? 0) + 1);

    void executeJob(entry.jobId).finally(() => {
      active--;
      activeByUser.set(entry.userId, Math.max(0, (activeByUser.get(entry.userId) ?? 1) - 1));
      tracked.delete(entry.jobId);
      pump();
    });
  }
}

async function executeJob(jobId: string): Promise<void> {
  const job = await db.instagramScrapeJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "PENDING") return;

  const provider = job.provider as ScraperProvider;

  // Re-check availability at run time (it may have hit its limit while queued).
  try {
    await assertProviderAvailable(provider);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provider unavailable";
    await db.instagramScrapeJob.update({
      where: { id: jobId },
      data: { status: "FAILED", finishedAt: new Date(), error: message },
    });
    return;
  }

  await db.instagramScrapeJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", startedAt: new Date(), error: null },
  });

  const hashtags = (job.hashtags as string[]) ?? [];

  try {
    await scrapeInstagram({
      provider,
      token: getProviderToken(provider),
      hashtags,
      searchByKeyword: job.searchByKeyword,
      resultsType: job.resultsType as ResultsType,
      maxResults: job.maxResults,
      onResults: async (hashtag, posts) => {
        await persistPosts(jobId, job.userId, provider, hashtag, posts);
        if (posts.length) await recordUsage(provider, posts.length);
        const count = await db.instagramPost.count({ where: { jobId } });
        await db.instagramScrapeJob.update({ where: { id: jobId }, data: { resultCount: count } });
      },
    });

    const finalCount = await db.instagramPost.count({ where: { jobId } });
    await db.instagramScrapeJob.update({
      where: { id: jobId },
      data: { status: "SUCCEEDED", finishedAt: new Date(), resultCount: finalCount },
    });
  } catch (err) {
    let message: string;
    if (err instanceof QuotaExceededError) {
      message = err.message;
      await markProviderLimited(provider, err.message);
    } else if (err instanceof ProviderUnavailableError || err instanceof ProviderConfigError) {
      message = err.message;
    } else {
      message = err instanceof Error ? err.message : "Scrape failed";
      await recordProviderError(provider, message);
    }
    await db.instagramScrapeJob.update({
      where: { id: jobId },
      data: { status: "FAILED", finishedAt: new Date(), error: message },
    });
  }
}

async function persistPosts(
  jobId: string,
  userId: string,
  provider: ScraperProvider,
  hashtag: string,
  posts: RawPost[]
): Promise<void> {
  const json = (v: unknown): Prisma.InputJsonValue | undefined =>
    v == null ? undefined : (v as Prisma.InputJsonValue);

  for (const p of posts) {
    if (!p.shortCode) continue;
    const data = {
      hashtag,
      provider,
      postUrl: p.postUrl,
      type: p.type,
      caption: p.caption,
      ownerFullName: p.ownerFullName,
      ownerUsername: p.ownerUsername,
      ownerId: p.ownerId,
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      videoViewCount: p.videoViewCount,
      videoPlayCount: p.videoPlayCount,
      sharesCount: p.sharesCount,
      firstComment: p.firstComment,
      locationName: p.locationName,
      locationId: p.locationId,
      timestamp: p.timestamp ? new Date(p.timestamp) : null,
      displayUrl: p.displayUrl,
      images: json(p.images),
      hashtags: json(p.hashtags),
      mentions: json(p.mentions),
      musicInfo: json(p.musicInfo),
      productType: p.productType,
      isSponsored: p.isSponsored,
    };
    await db.instagramPost
      .upsert({
        where: { jobId_shortCode: { jobId, shortCode: p.shortCode } },
        create: { jobId, userId, shortCode: p.shortCode, ...data },
        update: data,
      })
      .catch(() => {
        // Ignore individual row failures so one bad record can't stop the batch.
      });
  }
}
