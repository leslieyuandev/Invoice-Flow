import "server-only";
import type { Page, Response } from "playwright";

/**
 * Captures the raw JSON payloads Google Maps fetches in the background (the "fast
 * route"). These responses are prefixed with `)]}'` and contain the same data the
 * UI renders. We collect them so the parser can mine deeper fields (full address
 * components, claimed status, structured hours) that aren't always in the DOM card.
 *
 * The format is undocumented and changes, so consumers must treat the payloads as
 * best-effort enrichment and degrade gracefully.
 */
export interface InterceptedStore {
  /** Decoded JSON payloads from Maps RPC endpoints, in arrival order. */
  payloads: unknown[];
  detach: () => void;
}

const MAPS_ENDPOINT_HINTS = [
  "/search?tbm=map",
  "/maps/preview/place",
  "/maps/preview/search",
  "/locationhistory/preview",
  "/_/AdsMeasurementService",
];

function looksLikeMapsRpc(url: string): boolean {
  if (!url.includes("google.")) return false;
  return MAPS_ENDPOINT_HINTS.some((h) => url.includes(h)) || /\/search\?[^]*pb=/.test(url);
}

/** Strip Google's anti-JSON-hijacking prefix and parse. */
function parseRpcBody(body: string): unknown | null {
  const cleaned = body.replace(/^\)\]\}'\n?/, "").trim();
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export function attachInterceptor(page: Page): InterceptedStore {
  const store: InterceptedStore = { payloads: [], detach: () => {} };

  const handler = async (response: Response) => {
    try {
      const url = response.url();
      if (!looksLikeMapsRpc(url)) return;
      // Only text-ish bodies; skip images/binary.
      const ct = (response.headers()["content-type"] ?? "").toLowerCase();
      if (ct && !ct.includes("json") && !ct.includes("text") && !ct.includes("javascript")) return;

      const body = await response.text().catch(() => "");
      const parsed = parseRpcBody(body);
      if (parsed != null) store.payloads.push(parsed);
    } catch {
      // Never let interception break the run.
    }
  };

  page.on("response", handler);
  store.detach = () => page.off("response", handler);
  return store;
}
