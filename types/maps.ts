import type { MapsJobStatus } from "@prisma/client";

export interface PlaceReview {
  author: string | null;
  rating: number | null;
  text: string | null;
  date: string | null;
}

export interface SocialProfiles {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
}

export interface NewnessSignals {
  zeroReviews: boolean;
  unclaimed: boolean;
  tempWords: boolean;
  openingSoon: boolean;
  matched: string[];
}

/**
 * Strict output schema for a scraped place — used for JSON export.
 */
export interface ScrapedPlace {
  place_id: string;
  title: string;
  category: string | null;
  address: string | null;
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  };
  contact_info: {
    phone: string | null;
    website: string | null;
    claimed_status: string | null;
    is_claimed: boolean | null;
    emails: string[] | null;
    socials: SocialProfiles | null;
  };
  operating_hours: string[] | Record<string, string> | null;
  rating: number | null;
  review_count: number | null;
  opening_status: string | null;
  description: string | null;
  plus_code: string | null;
  price_level: string | null;
  images: string[] | null;
  reviews: PlaceReview[] | null;
  // Pre-opening / newly-opened detection
  is_likely_new: boolean;
  newness_signals: NewnessSignals | null;
}

/**
 * Flat row used by the results table and CSV export (mirrors the Apify "All fields" view).
 */
export interface MapsPlaceRow {
  id: string;
  placeId: string;
  searchQuery: string;
  title: string;
  category: string | null;
  totalScore: number | null;
  reviewsCount: number | null;
  address: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  countryCode: string | null;
  phone: string | null;
  website: string | null;
  claimedStatus: string | null;
  isClaimed: boolean | null;
  openingStatus: string | null;
  description: string | null;
  plusCode: string | null;
  priceLevel: string | null;
  latitude: number | null;
  longitude: number | null;
  operatingHours: string[] | Record<string, string> | null;
  imageUrls: string[] | null;
  reviews: PlaceReview[] | null;
  emails: string[] | null;
  socialProfiles: SocialProfiles | null;
  isLikelyNew: boolean;
  newnessSignals: NewnessSignals | null;
}

export interface MapsJobSummary {
  id: string;
  status: MapsJobStatus;
  searchQueries: string[];
  maxResults: number;
  language: string;
  resultCount: number;
  requestedCount: number;
  newCount: number; // # of rows flagged isLikelyNew
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface MapsJobDetail extends MapsJobSummary {
  places: MapsPlaceRow[];
}

export type { MapsJobStatus };
