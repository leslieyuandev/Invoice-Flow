import type {
  Coordinates,
  ProxyConfig,
  Geolocation,
  ScrapeFilters,
  AddOns,
  PreOpening,
} from "@/lib/validations/maps";

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
  matched: string[]; // human-readable matched signals for the badge tooltip
}

/** Normalized record the engine produces per place before it is written to the DB. */
export interface RawPlace {
  placeId: string;
  title: string;
  category: string | null;
  address: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  claimedStatus: string | null;
  operatingHours: string[] | Record<string, string> | null;
  rating: number | null;
  reviewCount: number | null;
  openingStatus: string | null;

  // Detail-crawl / enrichment fields (null/empty unless those add-ons ran)
  isClaimed: boolean | null;
  description: string | null;
  plusCode: string | null;
  priceLevel: string | null;
  imageUrls: string[] | null;
  reviews: PlaceReview[] | null;
  emails: string[] | null;
  socialProfiles: SocialProfiles | null;

  // Pre-opening / newly-opened detection
  isLikelyNew: boolean;
  newnessSignals: NewnessSignals | null;
}

export interface EngineOptions {
  searchQueries: string[];
  startUrls?: string[] | null;
  searchWithoutTerms?: boolean | null;
  location?: string | null;
  coordinates?: Coordinates | null;
  geolocation?: Geolocation | null;
  language: string;
  maxResults: number;
  proxy?: ProxyConfig | null;
  filters?: ScrapeFilters | null;
  addOns?: AddOns | null;
  preOpening?: PreOpening | null;
  /** Called as places stream in for a query, so the caller can persist incrementally. */
  onPlaces?: (query: string, places: RawPlace[]) => Promise<void> | void;
}
