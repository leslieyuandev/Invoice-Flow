import "server-only";
import type { Page } from "playwright";
import type { PlaceReview } from "./types";

export interface PlaceDetail {
  title: string | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  plusCode: string | null;
  priceLevel: string | null;
  rating: number | null;
  reviewCount: number | null;
  openingStatus: string | null;
  description: string | null;
  isClaimed: boolean | null;
}

/**
 * Extract rich fields from an open place panel. Relies on Google's stable
 * `data-item-id` attributes for address/phone/website/plus-code, plus defensive
 * text heuristics for rating/reviews/claimed-status/description.
 *
 * `isClaimed`: a visible "Claim this business" / "Own this business?" control means the
 * listing is unclaimed (false); a "Suggest an edit" with no claim control implies claimed
 * (true); otherwise unknown (null). This is the key signal for pre-opening lead detection.
 */
export async function extractPlaceDetail(page: Page): Promise<PlaceDetail> {
  // Wait for the panel heading; bail to a mostly-empty record if it never appears.
  await page.waitForSelector("h1", { timeout: 15_000 }).catch(() => null);

  return page
    .evaluate(() => {
      const q = (sel: string) => document.querySelector(sel);
      const txt = (el: Element | null) => (el && el.textContent ? el.textContent.trim() : null);
      const ariaValue = (sel: string, label: RegExp) => {
        const el = q(sel);
        if (!el) return null;
        const a = el.getAttribute("aria-label") || "";
        return a.replace(label, "").trim() || txt(el);
      };

      const main = (q('[role="main"]') as HTMLElement | null) || document.body;
      const bodyText = main.innerText || "";

      const title = txt(q("h1.DUwDvf")) || txt(q("h1"));
      const category =
        txt(q('button[jsaction*="category"]')) || txt(q(".DkEaL")) || txt(q("button.DkEaL"));
      const address = ariaValue('button[data-item-id="address"]', /^Address:\s*/i);
      const phone = ariaValue('button[data-item-id^="phone"]', /^Phone:\s*/i);
      const websiteEl = q('a[data-item-id="authority"]') as HTMLAnchorElement | null;
      const website = websiteEl ? websiteEl.href : null;
      const plusCode = ariaValue('button[data-item-id="oloc"]', /^Plus code:\s*/i);

      // Rating + review count from the header cluster.
      let rating: number | null = null;
      let reviewCount: number | null = null;
      const header = q("div.F7nice");
      if (header) {
        const nums = (header.textContent || "").match(/[\d.,]+/g);
        if (nums && nums[0]) rating = parseFloat(nums[0].replace(/,/g, "")) || null;
        if (nums && nums[1]) reviewCount = parseInt(nums[1].replace(/[^\d]/g, ""), 10);
      }
      if (reviewCount == null && /\bno reviews\b/i.test(bodyText)) reviewCount = 0;

      // Price level ($ … $$$$).
      const priceMatch = bodyText.match(/\${1,4}(?!\w)/);
      const priceLevel = priceMatch ? priceMatch[0] : null;

      // Opening status tag.
      const STATUS = [
        "Permanently closed",
        "Temporarily closed",
        "Opening soon",
        "Opens soon",
        "Closing soon",
        "Closed",
        "Open 24 hours",
        "Open",
      ];
      const openingStatus = STATUS.find((s) => bodyText.includes(s)) || null;

      // Description / editorial summary.
      const description =
        txt(q(".PYvSYb")) || txt(q('div[data-attrid="description"]')) || null;

      // Claimed status.
      const controls = Array.from(document.querySelectorAll("a, button"));
      const claim = controls.find((el) =>
        /claim this business|own this business/i.test(el.textContent || "")
      );
      const suggestEdit = controls.some((el) => /suggest an edit/i.test(el.textContent || ""));
      let isClaimed: boolean | null = null;
      if (claim) isClaimed = false;
      else if (suggestEdit) isClaimed = true;

      return {
        title,
        category,
        address,
        phone,
        website,
        plusCode,
        priceLevel,
        rating,
        reviewCount,
        openingStatus,
        description,
        isClaimed,
      };
    })
    .catch(
      (): PlaceDetail => ({
        title: null,
        category: null,
        address: null,
        phone: null,
        website: null,
        plusCode: null,
        priceLevel: null,
        rating: null,
        reviewCount: null,
        openingStatus: null,
        description: null,
        isClaimed: null,
      })
    );
}

/** Open the Reviews tab and scrape up to `max` reviews. Best-effort; returns [] on failure. */
export async function extractReviews(page: Page, max: number): Promise<PlaceReview[]> {
  try {
    // Click a "Reviews" tab/button if present.
    const reviewsTab = page
      .locator('button[role="tab"]:has-text("Reviews"), button[aria-label*="Reviews for" i]')
      .first();
    if (await reviewsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reviewsTab.click({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }

    // Scroll the reviews feed to load more.
    const feed = page.locator('div[role="main"] div.m6QErb, div[role="main"]').first();
    for (let i = 0; i < 6; i++) {
      const count = await page.locator("div[data-review-id]").count().catch(() => 0);
      if (count >= max) break;
      await feed.evaluate((el) => el.scrollBy(0, el.scrollHeight)).catch(() => {});
      await page.waitForTimeout(900);
    }

    return await page
      .$$eval(
        "div[data-review-id]",
        (cards, lim) =>
          cards.slice(0, lim as number).map((c) => {
            const t = (sel: string) => {
              const el = c.querySelector(sel);
              return el && el.textContent ? el.textContent.trim() : null;
            };
            const ratingEl = c.querySelector('span[role="img"][aria-label*="star" i]');
            const ratingLabel = ratingEl?.getAttribute("aria-label") || "";
            const ratingNum = parseFloat((ratingLabel.match(/[\d.]+/) || [])[0] || "");
            return {
              author: t(".d4r55") || t(".TSUbDb"),
              rating: Number.isFinite(ratingNum) ? ratingNum : null,
              text: t(".wiI7pd") || t(".MyEned"),
              date: t(".rsqaWe") || t(".xRkPPb"),
            };
          }),
        max
      )
      .catch(() => [] as PlaceReview[]);
  } catch {
    return [];
  }
}

/** Collect up to `max` photo URLs visible on the place panel. Best-effort. */
export async function extractImages(page: Page, max: number): Promise<string[]> {
  try {
    const urls = await page
      .$$eval('div[role="main"] img', (imgs) =>
        imgs
          .map((i) => (i as HTMLImageElement).src)
          .filter((s) => s && /googleusercontent\.com|ggpht\.com/.test(s))
      )
      .catch(() => [] as string[]);

    // Also pull background-image URLs (Google often lazy-loads photos as backgrounds).
    const bgUrls = await page
      .$$eval('div[role="main"] [style*="background-image"]', (els) =>
        els
          .map((e) => {
            const m = (e as HTMLElement).style.backgroundImage.match(/url\("?(.+?)"?\)/);
            return m ? m[1] : "";
          })
          .filter((s) => s && /googleusercontent\.com|ggpht\.com/.test(s))
      )
      .catch(() => [] as string[]);

    return Array.from(new Set([...urls, ...bgUrls])).slice(0, max);
  } catch {
    return [];
  }
}
