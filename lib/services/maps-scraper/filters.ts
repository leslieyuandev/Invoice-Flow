import "server-only";
import type { ScrapeFilters } from "@/lib/validations/maps";
import type { RawPlace } from "./types";

const CLOSED_STATUS = /permanently closed|temporarily closed/i;

/** "Search filters & categories" — applied after extraction. */
export function applyFilters(
  places: RawPlace[],
  filters: ScrapeFilters | null | undefined,
  searchTerm?: string
): RawPlace[] {
  if (!filters) return places;

  return places.filter((p) => {
    if (filters.minStars != null && (p.rating ?? 0) < filters.minStars) return false;
    if (filters.minReviews != null && (p.reviewCount ?? 0) < filters.minReviews) return false;
    if (filters.maxReviews != null && (p.reviewCount ?? Infinity) > filters.maxReviews) return false;

    if (filters.skipClosedPlaces && p.openingStatus && CLOSED_STATUS.test(p.openingStatus)) {
      return false;
    }

    if (filters.categories?.length) {
      const cat = (p.category ?? "").toLowerCase();
      const ok = filters.categories.some((c) => cat.includes(c.toLowerCase()));
      if (!ok) return false;
    }

    if (filters.titleMustMatch && searchTerm) {
      if (!p.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    }

    return true;
  });
}

/** Keep only pre-opening / newly-opened flagged rows when requested. */
export function applyPreOpening(places: RawPlace[], onlyNew: boolean | null | undefined): RawPlace[] {
  return onlyNew ? places.filter((p) => p.isLikelyNew) : places;
}
