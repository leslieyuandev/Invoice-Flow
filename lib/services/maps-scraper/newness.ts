import type { RawPlace, NewnessSignals } from "./types";

/**
 * Words that signal a business is about to open or has just opened. Used to detect
 * pre-opening / newly-opened leads (prime targets for launch décor / events).
 */
export const TEMPORARY_WORDS = [
  "opening soon",
  "coming soon",
  "now open",
  "newly opened",
  "new opening",
  "grand opening",
  "soft opening",
  "under construction",
  "pre-opening",
  "pre opening",
  "opening shortly",
  "будет открыт", // keep multilingual hooks minimal; extend as needed
];

const TEMP_REGEX = new RegExp(
  TEMPORARY_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i"
);

const OPENING_SOON_STATUS = /opening soon|opens soon|not yet open|temporarily closed/i;

function hasTempWords(place: RawPlace): boolean {
  const haystack = [place.title, place.description, place.category].filter(Boolean).join(" ");
  return TEMP_REGEX.test(haystack);
}

/**
 * "Balanced" rule (chosen): a place is a likely pre-opening / new business when it has
 * **zero reviews** AND (it is **unclaimed** OR shows **temporary words / opening-soon status**).
 * Returns the flag plus the individual signals for the UI badge.
 */
export function computeNewness(place: RawPlace): { isLikelyNew: boolean; signals: NewnessSignals } {
  const zeroReviews = place.reviewCount === 0;
  const unclaimed = place.isClaimed === false;
  const tempWords = hasTempWords(place);
  const openingSoon = !!place.openingStatus && OPENING_SOON_STATUS.test(place.openingStatus);

  const matched: string[] = [];
  if (zeroReviews) matched.push("0 reviews");
  if (unclaimed) matched.push("Unclaimed listing");
  if (tempWords) matched.push("Temporary wording in name/description");
  if (openingSoon) matched.push(`Status: ${place.openingStatus}`);

  const isLikelyNew = zeroReviews && (unclaimed || tempWords || openingSoon);

  return {
    isLikelyNew,
    signals: { zeroReviews, unclaimed, tempWords, openingSoon, matched },
  };
}
