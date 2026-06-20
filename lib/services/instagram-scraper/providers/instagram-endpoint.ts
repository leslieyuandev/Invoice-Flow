/**
 * Shared bits for the generic scraping-proxy providers (ScrapingBee, Crawlbase).
 * They don't ship an Instagram-specific parser, so we point them at Instagram's own
 * public hashtag JSON endpoint and parse the result with the shared normalizer. The
 * `x-ig-app-id` header is required for that endpoint to return JSON.
 */
export const IG_APP_ID = "936619743392459";

export function igHashtagInfoUrl(hashtag: string): string {
  return `https://www.instagram.com/api/v1/tags/web_info/?tag_name=${encodeURIComponent(hashtag)}`;
}
