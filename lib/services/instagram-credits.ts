import "server-only";
import { db } from "@/lib/db";
import type { ScraperProviderState } from "@prisma/client";
import type { ScraperProvider } from "@/lib/validations/instagram";
import type { ProviderStatus } from "@/types/instagram";
import {
  PROVIDER_META,
  PROVIDER_IDS,
  freeCreditsFor,
  isProviderConfigured,
} from "./instagram-scraper/providers/meta";

/**
 * Per-provider free-credit accounting. Each provider gets a free allowance per refresh
 * period (calendar month, UTC); usage is counted as results are scraped. When usage
 * reaches the allowance — or the provider's API reports quota exhaustion — the provider
 * is marked `limited` and disabled in the UI until the period rolls over.
 */

/** Raised when a run is attempted against an unconfigured or limited provider. */
export class ProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

/** First day of the next calendar month (UTC) — when free credits refresh. */
function nextResetDate(from: Date): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

/** Get (creating if needed) the provider's state row, rolling over an expired period. */
async function ensureState(provider: ScraperProvider): Promise<ScraperProviderState> {
  const meta = PROVIDER_META[provider];
  const free = freeCreditsFor(meta);
  const now = new Date();

  let state = await db.scraperProviderState.findUnique({ where: { provider } });
  if (!state) {
    state = await db.scraperProviderState.create({
      data: { provider, freeCredits: free, unit: meta.unit, periodStart: now, resetsAt: nextResetDate(now) },
    });
  }

  if (now >= state.resetsAt) {
    // New period — wipe usage + any limit flag and refresh the allowance.
    state = await db.scraperProviderState.update({
      where: { provider },
      data: {
        creditsUsed: 0,
        limited: false,
        limitReason: null,
        lastError: null,
        periodStart: now,
        resetsAt: nextResetDate(now),
        freeCredits: free,
        unit: meta.unit,
      },
    });
  } else if (state.freeCredits !== free || state.unit !== meta.unit) {
    // Reflect an env/allowance change without resetting current usage.
    state = await db.scraperProviderState.update({
      where: { provider },
      data: { freeCredits: free, unit: meta.unit },
    });
  }

  return state;
}

/** Build the availability + free-credit status for every provider (for the form). */
export async function getProviderStatuses(): Promise<ProviderStatus[]> {
  const out: ProviderStatus[] = [];
  for (const id of PROVIDER_IDS) {
    const meta = PROVIDER_META[id];
    const state = await ensureState(id);
    const configured = isProviderConfigured(meta);
    const remaining = Math.max(0, state.freeCredits - state.creditsUsed);
    const limited = state.limited || remaining <= 0;
    out.push({
      provider: id,
      label: meta.label,
      docsUrl: meta.docsUrl,
      configured,
      available: configured && !limited,
      limited,
      limitReason: limited ? state.limitReason ?? `Free ${state.unit} limit reached` : null,
      creditsUsed: state.creditsUsed,
      freeCredits: state.freeCredits,
      remaining,
      unit: state.unit,
      costNote: meta.costNote,
      resetsAt: state.resetsAt.toISOString(),
      resetInDays: Math.max(0, Math.ceil((state.resetsAt.getTime() - Date.now()) / 86_400_000)),
    });
  }
  return out;
}

/** The provider's API token (caller must have asserted availability first). */
export function getProviderToken(provider: ScraperProvider): string {
  return process.env[PROVIDER_META[provider].tokenEnv] ?? "";
}

/** Throw ProviderUnavailableError if the provider can't run right now. */
export async function assertProviderAvailable(provider: ScraperProvider): Promise<void> {
  const meta = PROVIDER_META[provider];
  if (!isProviderConfigured(meta)) {
    const need = [meta.tokenEnv, ...(meta.extraEnv ?? [])].join(", ");
    throw new ProviderUnavailableError(`${meta.label} is not configured. Set ${need} on the server to enable it.`);
  }
  const state = await ensureState(provider);
  if (state.limited || state.creditsUsed >= state.freeCredits) {
    const on = state.resetsAt.toISOString().slice(0, 10);
    throw new ProviderUnavailableError(
      `${meta.label} has hit its free ${state.unit} limit. It will refresh on ${on}.`
    );
  }
}

/** Count `count` results against the provider's allowance; auto-limit when reached. */
export async function recordUsage(provider: ScraperProvider, count: number): Promise<void> {
  if (count <= 0) return;
  const state = await ensureState(provider);
  const used = state.creditsUsed + count;
  const limited = used >= state.freeCredits;
  await db.scraperProviderState.update({
    where: { provider },
    data: {
      creditsUsed: used,
      limited: limited || state.limited,
      limitReason: limited
        ? `Free ${state.unit} limit reached (${used}/${state.freeCredits})`
        : state.limitReason,
    },
  });
}

/** Force-disable a provider (used when its API reports quota exhaustion). */
export async function markProviderLimited(provider: ScraperProvider, reason: string): Promise<void> {
  await ensureState(provider);
  await db.scraperProviderState.update({
    where: { provider },
    data: { limited: true, limitReason: reason, lastError: reason.slice(0, 500) },
  });
}

/** Record a non-fatal provider error for diagnostics (does not disable it). */
export async function recordProviderError(provider: ScraperProvider, message: string): Promise<void> {
  await ensureState(provider);
  await db.scraperProviderState.update({
    where: { provider },
    data: { lastError: message.slice(0, 500) },
  });
}
