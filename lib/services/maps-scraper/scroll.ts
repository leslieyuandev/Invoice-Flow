import "server-only";
import type { Page } from "playwright";

const FEED_SELECTOR = 'div[role="feed"]';
// Result cards are anchors to a place; this attribute pair has been stable.
const CARD_SELECTOR = 'a[href*="/maps/place/"]';
// Text Google shows once every result has loaded (matched loosely across locales).
const END_MARKERS = [
  "You've reached the end of the list",
  "reached the end",
  "Au bout de la liste",
  "Ende der Liste",
];

async function countCards(page: Page): Promise<number> {
  return page.locator(`${FEED_SELECTOR} ${CARD_SELECTOR}`).count().catch(() => 0);
}

async function hasEndMarker(page: Page): Promise<boolean> {
  const feedText = await page.locator(FEED_SELECTOR).innerText().catch(() => "");
  return END_MARKERS.some((m) => feedText.toLowerCase().includes(m.toLowerCase()));
}

/**
 * Dynamic pagination: scroll the side-panel feed until the "end of the list"
 * marker appears OR `maxResults` cards are loaded. Bounded by a stall counter and
 * a hard iteration cap so it can never loop forever on a layout change.
 */
export async function autoScrollFeed(page: Page, maxResults: number): Promise<number> {
  const feed = page.locator(FEED_SELECTOR).first();
  if (!(await feed.count())) {
    // Single-result queries land directly on a place page with no feed.
    return 0;
  }

  let lastCount = await countCards(page);
  let stalled = 0;
  const maxIterations = 60;

  for (let i = 0; i < maxIterations; i++) {
    if (lastCount >= maxResults) break;
    if (await hasEndMarker(page)) break;

    // Scroll the feed container to its bottom to trigger the next page fetch.
    await feed.evaluate((el) => el.scrollBy(0, el.scrollHeight)).catch(() => {});
    await page.waitForTimeout(1100 + Math.floor(Math.random() * 600));

    const count = await countCards(page);
    if (count <= lastCount) {
      stalled++;
      if (stalled >= 4) break; // no growth after several tries → assume done
    } else {
      stalled = 0;
    }
    lastCount = count;
  }

  return lastCount;
}
