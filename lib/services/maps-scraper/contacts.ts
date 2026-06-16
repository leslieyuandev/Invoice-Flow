import "server-only";
import type { BrowserContext } from "playwright";
import type { SocialProfiles } from "./types";

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const JUNK_EMAIL = /\.(png|jpe?g|gif|svg|webp)$|sentry|wixpress|example\.com|@sentry|your-?email|domain\.com/i;

const SOCIAL_HOSTS: { key: keyof SocialProfiles; re: RegExp }[] = [
  { key: "facebook", re: /facebook\.com/i },
  { key: "instagram", re: /instagram\.com/i },
  { key: "linkedin", re: /linkedin\.com/i },
  { key: "twitter", re: /(twitter\.com|x\.com)/i },
  { key: "tiktok", re: /tiktok\.com/i },
  { key: "youtube", re: /youtube\.com|youtu\.be/i },
];

export interface WebsiteContacts {
  emails: string[];
  socials: SocialProfiles | null;
}

/**
 * Best-effort contact enrichment by visiting the business website and scraping emails
 * and social-profile links from the markup. This is what "Company contacts / Business
 * leads enrichment" reduces to without a paid third-party B2B database. Never throws;
 * bounded by a short timeout so one slow/blocking site can't stall the job.
 */
export async function enrichContactsFromWebsite(
  context: BrowserContext,
  url: string
): Promise<WebsiteContacts> {
  const empty: WebsiteContacts = { emails: [], socials: null };
  if (!url) return empty;

  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.waitForTimeout(500);

    const html = await page.content().catch(() => "");
    const hrefs = await page
      .$$eval("a[href]", (as) => as.map((a) => (a as HTMLAnchorElement).href))
      .catch(() => [] as string[]);

    // Emails: mailto links + raw text matches, de-junked and de-duped.
    const fromMailto = hrefs
      .filter((h) => h.toLowerCase().startsWith("mailto:"))
      .map((h) => h.slice(7).split("?")[0].trim());
    const fromText = html.match(EMAIL_RE) ?? [];
    const emails = Array.from(new Set([...fromMailto, ...fromText]))
      .map((e) => e.toLowerCase())
      .filter((e) => e && !JUNK_EMAIL.test(e))
      .slice(0, 10);

    // Social profiles: first matching link per network.
    const socials: SocialProfiles = {};
    for (const href of hrefs) {
      for (const { key, re } of SOCIAL_HOSTS) {
        if (!socials[key] && re.test(href)) socials[key] = href;
      }
    }

    return {
      emails,
      socials: Object.keys(socials).length ? socials : null,
    };
  } catch {
    return empty;
  } finally {
    await page.close().catch(() => {});
  }
}
