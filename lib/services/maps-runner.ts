import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type {
  ProxyConfig,
  Coordinates,
  Geolocation,
  ScrapeFilters,
  AddOns,
  PreOpening,
} from "@/lib/validations/maps";
import { scrape } from "./maps-scraper/engine";
import type { RawPlace } from "./maps-scraper/types";

/**
 * Background job runner with an in-process queue. Kept in its own module so the
 * Playwright-backed engine graph is only pulled into the API route that launches a
 * job — never into the read-only query paths used by Server Components.
 *
 * Multi-user safety (single-instance / one container):
 *  - `MAPS_MAX_CONCURRENCY` caps simultaneous headless-Chromium scrapes (default 2)
 *    so a few users hitting "Start" at once can't exhaust RAM.
 *  - `MAPS_MAX_PER_USER` caps how many run at once per user (default 1) for fairness.
 *  - Extra jobs wait as PENDING ("Queued" in the UI) and start when a slot frees.
 * (For multiple app instances, graduate to a shared Redis/BullMQ queue.)
 */

const MAX_CONCURRENT = Math.max(1, parseInt(process.env.MAPS_MAX_CONCURRENCY || "2", 10) || 2);
const PER_USER_MAX = Math.max(1, parseInt(process.env.MAPS_MAX_PER_USER || "1", 10) || 1);

interface Runtime {
  proxy?: ProxyConfig | null;
}
interface QueueEntry {
  jobId: string;
  userId: string;
  runtime?: Runtime;
}

const queue: QueueEntry[] = [];
const tracked = new Set<string>(); // jobIds queued or running (dedupe)
const activeByUser = new Map<string, number>();
let active = 0;

/** Enqueue a job; it starts as soon as a global + per-user slot is free. */
export function runScrapeJob(jobId: string, userId: string, runtime?: Runtime): void {
  if (tracked.has(jobId)) return;
  tracked.add(jobId);
  queue.push({ jobId, userId, runtime });
  pump();
}

function pump(): void {
  while (active < MAX_CONCURRENT) {
    const idx = queue.findIndex((e) => (activeByUser.get(e.userId) ?? 0) < PER_USER_MAX);
    if (idx === -1) break;

    const [entry] = queue.splice(idx, 1);
    active++;
    activeByUser.set(entry.userId, (activeByUser.get(entry.userId) ?? 0) + 1);

    void executeJob(entry.jobId, entry.runtime).finally(() => {
      active--;
      activeByUser.set(entry.userId, Math.max(0, (activeByUser.get(entry.userId) ?? 1) - 1));
      tracked.delete(entry.jobId);
      pump();
    });
  }
}

interface JobConfig {
  location?: string | null;
  startUrls?: string[] | null;
  searchWithoutTerms?: boolean;
  geolocation?: Geolocation | null;
  filters?: ScrapeFilters | null;
  addOns?: AddOns | null;
  preOpening?: PreOpening | null;
}

/** Use the per-job proxy if provided, else a server-wide default from the environment. */
function resolveProxy(p?: ProxyConfig | null): ProxyConfig | null {
  if (p?.enabled && p.server) return p;
  const server = process.env.MAPS_PROXY_SERVER;
  if (server) {
    return {
      enabled: true,
      server,
      username: process.env.MAPS_PROXY_USERNAME,
      password: process.env.MAPS_PROXY_PASSWORD,
    };
  }
  return null;
}

async function executeJob(jobId: string, runtime?: Runtime): Promise<void> {
  const job = await db.mapsScrapeJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "PENDING") return;

  await db.mapsScrapeJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", startedAt: new Date(), error: null },
  });

  const queries = (job.searchQueries as string[]) ?? [];
  const coordinates = (job.coordinates as Coordinates | null) ?? null;
  const config = (job.config as JobConfig | null) ?? {};

  try {
    await scrape({
      searchQueries: queries,
      startUrls: config.startUrls ?? null,
      searchWithoutTerms: config.searchWithoutTerms ?? false,
      location: config.location ?? null,
      coordinates,
      geolocation: config.geolocation ?? null,
      language: job.language,
      maxResults: job.maxResults,
      proxy: resolveProxy(runtime?.proxy),
      filters: config.filters ?? null,
      addOns: config.addOns ?? null,
      preOpening: config.preOpening ?? null,
      onPlaces: async (query, places) => {
        await persistPlaces(jobId, job.userId, query, places);
        const count = await db.mapsPlace.count({ where: { jobId } });
        await db.mapsScrapeJob.update({ where: { id: jobId }, data: { resultCount: count } });
      },
    });

    const finalCount = await db.mapsPlace.count({ where: { jobId } });
    await db.mapsScrapeJob.update({
      where: { id: jobId },
      data: { status: "SUCCEEDED", finishedAt: new Date(), resultCount: finalCount },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scrape failed";
    await db.mapsScrapeJob.update({
      where: { id: jobId },
      data: { status: "FAILED", finishedAt: new Date(), error: message },
    });
  }
}

async function persistPlaces(
  jobId: string,
  userId: string,
  query: string,
  places: RawPlace[]
): Promise<void> {
  const json = (v: unknown): Prisma.InputJsonValue | undefined =>
    v == null ? undefined : (v as Prisma.InputJsonValue);

  for (const p of places) {
    if (!p.placeId) continue;
    const data = {
      searchQuery: query,
      title: p.title,
      category: p.category,
      address: p.address,
      street: p.street,
      city: p.city,
      state: p.state,
      countryCode: p.countryCode,
      latitude: p.latitude,
      longitude: p.longitude,
      phone: p.phone,
      website: p.website,
      claimedStatus: p.claimedStatus,
      operatingHours: json(p.operatingHours),
      rating: p.rating,
      reviewCount: p.reviewCount,
      openingStatus: p.openingStatus,
      isClaimed: p.isClaimed,
      description: p.description,
      plusCode: p.plusCode,
      priceLevel: p.priceLevel,
      imageUrls: json(p.imageUrls),
      reviews: json(p.reviews),
      emails: json(p.emails),
      socialProfiles: json(p.socialProfiles),
      isLikelyNew: p.isLikelyNew,
      newnessSignals: json(p.newnessSignals),
    };
    await db.mapsPlace
      .upsert({
        where: { jobId_placeId: { jobId, placeId: p.placeId } },
        create: { jobId, userId, placeId: p.placeId, ...data },
        update: data,
      })
      .catch(() => {
        // Ignore individual row failures so one bad record can't stop the batch.
      });
  }
}
