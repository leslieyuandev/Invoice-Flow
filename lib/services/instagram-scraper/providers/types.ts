import type { ScraperProvider, ResultsType } from "@/lib/validations/instagram";
import type { MusicInfo } from "@/types/instagram";

/** Normalized post produced by every provider; persisted by the runner. */
export interface RawPost {
  shortCode: string;
  postUrl: string;
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
}

export interface ProviderRunOpts {
  token: string;
  resultsType: ResultsType;
  maxResults: number;
  searchByKeyword: boolean;
}

export interface InstagramProvider {
  id: ScraperProvider;
  /** Scrape a single hashtag/keyword. Throws QuotaExceededError when the provider's
   *  free allowance / paid quota is exhausted so the run can disable it. */
  scrapeHashtag(hashtag: string, opts: ProviderRunOpts): Promise<RawPost[]>;
}

/** The provider reports it is out of credits / over quota. */
export class QuotaExceededError extends Error {
  constructor(message = "Provider free credit limit reached") {
    super(message);
    this.name = "QuotaExceededError";
  }
}

/** A required env var (token / dataset id) is missing. */
export class ProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigError";
  }
}
