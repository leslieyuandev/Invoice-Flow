import "server-only";
import { db } from "@/lib/db";
import type { InstagramScrapeJob, InstagramPost } from "@prisma/client";
import type { InstagramInput, ScraperProvider } from "@/lib/validations/instagram";
import type {
  InstagramJobSummary,
  InstagramJobDetail,
  InstagramPostRow,
  ScrapedPost,
  MusicInfo,
} from "@/types/instagram";

/* ── Mappers ──────────────────────────────────────────────────────────────── */

export function toJobSummary(job: InstagramScrapeJob): InstagramJobSummary {
  return {
    id: job.id,
    status: job.status,
    hashtags: (job.hashtags as string[]) ?? [],
    searchByKeyword: job.searchByKeyword,
    resultsType: job.resultsType,
    maxResults: job.maxResults,
    provider: job.provider as ScraperProvider,
    resultCount: job.resultCount,
    requestedCount: job.requestedCount,
    error: job.error,
    startedAt: job.startedAt?.toISOString() ?? null,
    finishedAt: job.finishedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
  };
}

export function toPostRow(p: InstagramPost): InstagramPostRow {
  return {
    id: p.id,
    shortCode: p.shortCode,
    hashtag: p.hashtag,
    provider: p.provider,
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
    timestamp: p.timestamp?.toISOString() ?? null,
    displayUrl: p.displayUrl,
    images: (p.images as string[] | null) ?? null,
    hashtags: (p.hashtags as string[] | null) ?? null,
    mentions: (p.mentions as string[] | null) ?? null,
    musicInfo: (p.musicInfo as MusicInfo | null) ?? null,
    productType: p.productType,
    isSponsored: p.isSponsored,
  };
}

export function toScrapedPost(p: InstagramPost): ScrapedPost {
  return {
    shortCode: p.shortCode,
    url: p.postUrl,
    type: p.type,
    caption: p.caption,
    hashtags: (p.hashtags as string[] | null) ?? null,
    mentions: (p.mentions as string[] | null) ?? null,
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
    timestamp: p.timestamp?.toISOString() ?? null,
    displayUrl: p.displayUrl,
    images: (p.images as string[] | null) ?? null,
    musicInfo: (p.musicInfo as MusicInfo | null) ?? null,
    productType: p.productType,
    isSponsored: p.isSponsored,
    inputHashtag: p.hashtag,
    provider: p.provider,
  };
}

/* ── CRUD ─────────────────────────────────────────────────────────────────── */

export async function createJob(userId: string, input: InstagramInput): Promise<InstagramScrapeJob> {
  return db.instagramScrapeJob.create({
    data: {
      userId,
      status: "PENDING",
      hashtags: input.hashtags,
      searchByKeyword: input.searchByKeyword,
      resultsType: input.resultsType,
      maxResults: input.maxResults,
      provider: input.provider,
      requestedCount: input.hashtags.length * input.maxResults,
    },
  });
}

export async function listJobs(userId: string): Promise<InstagramJobSummary[]> {
  const jobs = await db.instagramScrapeJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jobs.map(toJobSummary);
}

export async function getJob(jobId: string, userId: string): Promise<InstagramJobDetail | null> {
  const job = await db.instagramScrapeJob.findFirst({
    where: { id: jobId, userId },
    include: { posts: { orderBy: [{ likesCount: "desc" }, { createdAt: "asc" }] } },
  });
  if (!job) return null;
  return { ...toJobSummary(job), posts: job.posts.map(toPostRow) };
}

export async function getPostsForExport(jobId: string, userId: string): Promise<InstagramPost[] | null> {
  const job = await db.instagramScrapeJob.findFirst({ where: { id: jobId, userId }, select: { id: true } });
  if (!job) return null;
  return db.instagramPost.findMany({ where: { jobId }, orderBy: { createdAt: "asc" } });
}

export async function deleteJob(jobId: string, userId: string): Promise<boolean> {
  const res = await db.instagramScrapeJob.deleteMany({ where: { id: jobId, userId } });
  return res.count > 0;
}
