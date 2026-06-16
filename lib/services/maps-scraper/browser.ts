import "server-only";
import { chromium, type Browser, type BrowserContext } from "playwright";
import type { ProxyConfig } from "@/lib/validations/maps";
import { toPlaywrightProxy } from "./proxy";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Launch a headless Chromium + context tuned for Google Maps scraping:
 * realistic UA, requested UI language, and optional rotating proxy.
 * Caller is responsible for closing the returned browser.
 */
export async function launchBrowser(
  language: string,
  proxy?: ProxyConfig | null
): Promise<{ browser: Browser; context: BrowserContext }> {
  const proxyOption = toPlaywrightProxy(proxy);

  const browser = await chromium.launch({
    headless: true,
    proxy: proxyOption,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      `--lang=${language}`,
    ],
  });

  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: language,
    viewport: { width: 1366, height: 900 },
    // Bias Google toward serving the requested language UI.
    extraHTTPHeaders: { "Accept-Language": `${language},en;q=0.8` },
  });

  return { browser, context };
}
