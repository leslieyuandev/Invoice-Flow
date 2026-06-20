import type { InstagramJobStatus } from "@prisma/client";
import type { ScraperProvider } from "@/lib/validations/instagram";

export interface MusicInfo {
  artist?: string | null;
  title?: string | null;
  usesOriginalAudio?: boolean | null;
}

/**
 * Strict output schema for a scraped Instagram post — used for JSON export.
 * Field names follow the Apify actor's dataset shape so exports are interchangeable.
 */
export interface ScrapedPost {
  shortCode: string;
  url: string;
  type: string | null;
  caption: string | null;
  hashtags: string[] | null;
  mentions: string[] | null;
  ownerFullName: string | null;
  ownerUsername: string | null;
  ownerId: string | null;
  likesCount: number | null;
  commentsCount: number | null;
  videoViewCount: number | null; // plays
  videoPlayCount: number | null;
  sharesCount: number | null;
  firstComment: string | null;
  locationName: string | null;
  locationId: string | null;
  timestamp: string | null; // ISO
  displayUrl: string | null;
  images: string[] | null;
  musicInfo: MusicInfo | null;
  productType: string | null;
  isSponsored: boolean | null;
  inputHashtag: string;
  provider: string;
}

/** Flat row used by the results table + CSV export (mirrors the Apify "Overview" view). */
export interface InstagramPostRow {
  id: string;
  shortCode: string;
  hashtag: string;
  provider: string;
  postUrl: string;
  type: string | null;
  caption: string | null;
  ownerFullName: string | null;
  ownerUsername: string | null;
  ownerId: string | null;
  likesCount: number | null;
  commentsCount: number | null;
  videoViewCount: number | null;
  videoPlayCount: number | null;
  sharesCount: number | null;
  firstComment: string | null;
  locationName: string | null;
  locationId: string | null;
  timestamp: string | null;
  displayUrl: string | null;
  images: string[] | null;
  hashtags: string[] | null;
  mentions: string[] | null;
  musicInfo: MusicInfo | null;
  productType: string | null;
  isSponsored: boolean | null;
}

export interface InstagramJobSummary {
  id: string;
  status: InstagramJobStatus;
  hashtags: string[];
  searchByKeyword: boolean;
  resultsType: string;
  maxResults: number;
  provider: ScraperProvider;
  resultCount: number;
  requestedCount: number;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface InstagramJobDetail extends InstagramJobSummary {
  posts: InstagramPostRow[];
}

/** Per-provider availability + free-credit status, surfaced to the scrape form. */
export interface ProviderStatus {
  provider: ScraperProvider;
  label: string;
  docsUrl: string;
  /** Token env var is set on the server. */
  configured: boolean;
  /** configured && not currently limited. */
  available: boolean;
  limited: boolean;
  limitReason: string | null;
  creditsUsed: number;
  freeCredits: number;
  remaining: number;
  unit: string;
  costNote: string;
  resetsAt: string | null;
  resetInDays: number | null;
}

export type { InstagramJobStatus };
