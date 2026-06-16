import "server-only";
import { db } from "@/lib/db";
import type { Prisma, MapsScrapeJob, MapsPlace } from "@prisma/client";
import type { ScrapeInput } from "@/lib/validations/maps";
import type {
  MapsJobSummary,
  MapsJobDetail,
  MapsPlaceRow,
  ScrapedPlace,
  PlaceReview,
  SocialProfiles,
  NewnessSignals,
} from "@/types/maps";

/* ── Mappers ──────────────────────────────────────────────────────────────── */

export function toJobSummary(job: MapsScrapeJob, newCount: number): MapsJobSummary {
  return {
    id: job.id,
    status: job.status,
    searchQueries: (job.searchQueries as string[]) ?? [],
    maxResults: job.maxResults,
    language: job.language,
    resultCount: job.resultCount,
    requestedCount: job.requestedCount,
    newCount,
    error: job.error,
    startedAt: job.startedAt?.toISOString() ?? null,
    finishedAt: job.finishedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
  };
}

export function toPlaceRow(p: MapsPlace): MapsPlaceRow {
  return {
    id: p.id,
    placeId: p.placeId,
    searchQuery: p.searchQuery,
    title: p.title,
    category: p.category,
    totalScore: p.rating,
    reviewsCount: p.reviewCount,
    address: p.address,
    street: p.street,
    city: p.city,
    state: p.state,
    countryCode: p.countryCode,
    phone: p.phone,
    website: p.website,
    claimedStatus: p.claimedStatus,
    isClaimed: p.isClaimed,
    openingStatus: p.openingStatus,
    description: p.description,
    plusCode: p.plusCode,
    priceLevel: p.priceLevel,
    latitude: p.latitude,
    longitude: p.longitude,
    operatingHours: (p.operatingHours as string[] | Record<string, string> | null) ?? null,
    imageUrls: (p.imageUrls as string[] | null) ?? null,
    reviews: (p.reviews as PlaceReview[] | null) ?? null,
    emails: (p.emails as string[] | null) ?? null,
    socialProfiles: (p.socialProfiles as SocialProfiles | null) ?? null,
    isLikelyNew: p.isLikelyNew,
    newnessSignals: (p.newnessSignals as NewnessSignals | null) ?? null,
  };
}

export function toScrapedPlace(p: MapsPlace): ScrapedPlace {
  return {
    place_id: p.placeId,
    title: p.title,
    category: p.category,
    address: p.address,
    coordinates: { latitude: p.latitude, longitude: p.longitude },
    contact_info: {
      phone: p.phone,
      website: p.website,
      claimed_status: p.claimedStatus,
      is_claimed: p.isClaimed,
      emails: (p.emails as string[] | null) ?? null,
      socials: (p.socialProfiles as SocialProfiles | null) ?? null,
    },
    operating_hours: (p.operatingHours as string[] | Record<string, string> | null) ?? null,
    rating: p.rating,
    review_count: p.reviewCount,
    opening_status: p.openingStatus,
    description: p.description,
    plus_code: p.plusCode,
    price_level: p.priceLevel,
    images: (p.imageUrls as string[] | null) ?? null,
    reviews: (p.reviews as PlaceReview[] | null) ?? null,
    is_likely_new: p.isLikelyNew,
    newness_signals: (p.newnessSignals as NewnessSignals | null) ?? null,
  };
}

/* ── CRUD ─────────────────────────────────────────────────────────────────── */

/** Non-secret run config persisted on the job for display + the runner to read back. */
function buildJobConfig(input: ScrapeInput): Prisma.InputJsonValue {
  const config = {
    location: input.location ?? null,
    startUrls: input.startUrls ?? null,
    searchWithoutTerms: input.searchWithoutTerms ?? false,
    geolocation: input.geolocation ?? null,
    filters: input.filters ?? null,
    addOns: input.addOns ?? null,
    preOpening: input.preOpening ?? null,
  };
  // Strip undefined so it is valid JSON for Prisma.
  return JSON.parse(JSON.stringify(config)) as Prisma.InputJsonValue;
}

export async function createJob(userId: string, input: ScrapeInput): Promise<MapsScrapeJob> {
  const sourceCount =
    (input.searchQueries.length || (input.filters?.categories?.length ?? 0)) +
    (input.startUrls?.length ?? 0);

  return db.mapsScrapeJob.create({
    data: {
      userId,
      status: "PENDING",
      searchQueries: input.searchQueries,
      coordinates: (input.coordinates as Prisma.InputJsonValue) ?? undefined,
      maxResults: input.maxResults,
      language: input.language,
      proxyConfig: input.proxy?.enabled
        ? ({ enabled: true, server: input.proxy.server, username: input.proxy.username } as Prisma.InputJsonValue)
        : undefined,
      config: buildJobConfig(input),
      requestedCount: Math.max(1, sourceCount) * input.maxResults,
    },
  });
}

export async function listJobs(userId: string): Promise<MapsJobSummary[]> {
  const jobs = await db.mapsScrapeJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const grouped = await db.mapsPlace.groupBy({
    by: ["jobId"],
    where: { jobId: { in: jobs.map((j) => j.id) }, isLikelyNew: true },
    _count: true,
  });
  const newCounts = new Map(grouped.map((g) => [g.jobId, g._count]));

  return jobs.map((j) => toJobSummary(j, newCounts.get(j.id) ?? 0));
}

export async function getJob(jobId: string, userId: string): Promise<MapsJobDetail | null> {
  const job = await db.mapsScrapeJob.findFirst({
    where: { id: jobId, userId },
    include: { places: { orderBy: [{ isLikelyNew: "desc" }, { createdAt: "asc" }] } },
  });
  if (!job) return null;
  const newCount = job.places.filter((p) => p.isLikelyNew).length;
  return { ...toJobSummary(job, newCount), places: job.places.map(toPlaceRow) };
}

export async function getPlacesForExport(
  jobId: string,
  userId: string
): Promise<MapsPlace[] | null> {
  const job = await db.mapsScrapeJob.findFirst({ where: { id: jobId, userId }, select: { id: true } });
  if (!job) return null;
  return db.mapsPlace.findMany({ where: { jobId }, orderBy: { createdAt: "asc" } });
}

export async function deleteJob(jobId: string, userId: string): Promise<boolean> {
  const res = await db.mapsScrapeJob.deleteMany({ where: { id: jobId, userId } });
  return res.count > 0;
}

/**
 * Push selected scraped places into the CRM as Clients. Reuses the existing Client model;
 * the first scraped email (if any) becomes the client email.
 */
export async function saveAsClients(
  jobId: string,
  userId: string,
  placeIds: string[]
): Promise<number> {
  const places = await db.mapsPlace.findMany({
    where: { jobId, userId, placeId: { in: placeIds } },
  });
  if (!places.length) return 0;

  const result = await db.client.createMany({
    data: places.map((p) => ({
      userId,
      name: p.title,
      company: p.title,
      email: ((p.emails as string[] | null) ?? [])[0] ?? null,
      phone: p.phone,
      addressLine1: p.street,
      city: p.city,
      state: p.state,
      country: p.countryCode,
    })),
  });
  return result.count;
}
