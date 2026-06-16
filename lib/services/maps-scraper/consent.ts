import "server-only";
import type { Page } from "playwright";

/**
 * Dismiss Google's consent / cookie wall. From EU IPs, navigating to Google
 * redirects to `consent.google.com` ("Before you continue") with an
 * "Accept all" / "Agree to all" button; elsewhere a cookie dialog may appear
 * inside Maps. Idempotent and never throws — a missing dialog is the happy path.
 */
export async function dismissConsent(page: Page): Promise<void> {
  // Multilingual button labels for "Accept all" across the locales we support.
  const acceptLabels = [
    "Accept all",
    "Agree to all",
    "I agree",
    "Accept",
    "Alle akzeptieren", // de
    "Tout accepter", // fr
    "Aceptar todo", // es
    "Terima semua", // ms
    "全部接受", // zh
  ];

  try {
    // Case 1: full-page consent form on consent.google.com.
    if (page.url().includes("consent.google.")) {
      for (const label of acceptLabels) {
        const btn = page.locator(`button:has-text("${label}")`).first();
        if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null),
            btn.click({ timeout: 5000 }).catch(() => null),
          ]);
          return;
        }
      }
    }

    // Case 2: in-page cookie dialog (aria-label or button text variants).
    const dialogButton = page
      .locator(
        [
          'button[aria-label*="Accept all" i]',
          'button[aria-label*="Agree" i]',
          'form[action*="consent"] button',
          ...acceptLabels.map((l) => `button:has-text("${l}")`),
        ].join(", ")
      )
      .first();

    if (await dialogButton.isVisible({ timeout: 1500 }).catch(() => false)) {
      await dialogButton.click({ timeout: 5000 }).catch(() => null);
      await page.waitForTimeout(800);
    }
  } catch {
    // Consent handling is best-effort; ignore and continue.
  }
}
