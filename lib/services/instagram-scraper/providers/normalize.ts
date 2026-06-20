import type { RawPost } from "./types";
import type { MusicInfo } from "@/types/instagram";

/* ── primitive coercers ──────────────────────────────────────────────────── */

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() !== "" ? v : v == null ? null : String(v);

const int = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseInt(String(v).replace(/[, ]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

const bool = (v: unknown): boolean | null =>
  v == null ? null : v === true || v === "true" || v === 1 ? true : v === false || v === "false" || v === 0 ? false : null;

const strArray = (v: unknown): string[] | null => {
  if (!Array.isArray(v)) return null;
  const out = v.map((x) => (typeof x === "string" ? x : x == null ? null : String(x))).filter((x): x is string => !!x);
  return out.length ? out : null;
};

/** Pick the first defined value among several candidate keys on an object. */
function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) if (obj[k] != null && obj[k] !== "") return obj[k];
  return undefined;
}

/* ── shared helpers ──────────────────────────────────────────────────────── */

/** Extract the Instagram shortcode from a /p/ or /reel/ URL. */
export function shortCodeFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/)?.[1] ?? null;
}

/** Pull #hashtags and @mentions out of a caption. */
export function parseCaptionEntities(caption: string | null): {
  hashtags: string[] | null;
  mentions: string[] | null;
} {
  if (!caption) return { hashtags: null, mentions: null };
  const hashtags = [...caption.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1]);
  const mentions = [...caption.matchAll(/@([A-Za-z0-9._]+)/g)].map((m) => m[1]);
  return {
    hashtags: hashtags.length ? Array.from(new Set(hashtags)) : null,
    mentions: mentions.length ? Array.from(new Set(mentions)) : null,
  };
}

function toIso(v: unknown): string | null {
  if (v == null || v === "") return null;
  // Unix seconds or ms
  if (typeof v === "number" || /^\d+$/.test(String(v))) {
    const n = Number(v);
    const ms = n > 1e12 ? n : n * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function emptyPost(shortCode: string, postUrl: string): RawPost {
  return {
    shortCode,
    postUrl,
    type: null,
    caption: null,
    hashtags: null,
    mentions: null,
    ownerFullName: null,
    ownerUsername: null,
    ownerId: null,
    likesCount: null,
    commentsCount: null,
    videoViewCount: null,
    videoPlayCount: null,
    sharesCount: null,
    firstComment: null,
    locationName: null,
    locationId: null,
    timestamp: null,
    displayUrl: null,
    images: null,
    musicInfo: null,
    productType: null,
    isSponsored: null,
  };
}

function firstCommentFrom(item: Record<string, unknown>): string | null {
  const direct = str(pick(item, "firstComment", "first_comment"));
  if (direct) return direct;
  const list = (item.latestComments ?? item.comments ?? item.latest_comments) as unknown;
  if (Array.isArray(list) && list.length) {
    const c = list[0];
    if (typeof c === "string") return c;
    if (c && typeof c === "object") return str((c as Record<string, unknown>).text);
  }
  return null;
}

function musicFrom(item: Record<string, unknown>): MusicInfo | null {
  const m = (item.musicInfo ?? item.music_info ?? item.music) as Record<string, unknown> | undefined;
  if (!m || typeof m !== "object") return null;
  const artist = str(pick(m, "artist_name", "artist", "artistName"));
  const title = str(pick(m, "song_name", "title", "songName"));
  const usesOriginal = bool(pick(m, "uses_original_audio", "usesOriginalAudio"));
  if (!artist && !title && usesOriginal == null) return null;
  return { artist, title, usesOriginalAudio: usesOriginal };
}

/* ── source-specific normalizers ─────────────────────────────────────────── */

/**
 * Apify `apify/instagram-hashtag-scraper` dataset item → RawPost.
 * Field names follow the actor's documented output schema.
 */
export function normalizeApifyItem(raw: unknown): RawPost | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const url = str(pick(item, "url", "postUrl"));
  const shortCode = str(pick(item, "shortCode", "shortcode", "code")) || shortCodeFromUrl(url);
  if (!shortCode) return null;

  const post = emptyPost(shortCode, url || `https://www.instagram.com/p/${shortCode}/`);
  post.type = str(pick(item, "type", "productType"));
  post.caption = str(item.caption);
  post.hashtags = strArray(item.hashtags) ?? parseCaptionEntities(post.caption).hashtags;
  post.mentions = strArray(item.mentions) ?? parseCaptionEntities(post.caption).mentions;
  post.ownerFullName = str(pick(item, "ownerFullName", "owner_full_name"));
  post.ownerUsername = str(pick(item, "ownerUsername", "owner_username", "username"));
  post.ownerId = str(pick(item, "ownerId", "owner_id"));
  post.likesCount = int(pick(item, "likesCount", "likes"));
  post.commentsCount = int(pick(item, "commentsCount", "comments"));
  post.videoViewCount = int(pick(item, "videoViewCount", "videoViews", "views"));
  post.videoPlayCount = int(pick(item, "videoPlayCount", "playCount", "plays"));
  post.sharesCount = int(pick(item, "sharesCount", "reshareCount", "shares"));
  post.firstComment = firstCommentFrom(item);
  post.locationName = str(pick(item, "locationName", "location_name"));
  post.locationId = str(pick(item, "locationId", "location_id"));
  post.timestamp = toIso(pick(item, "timestamp", "takenAt", "taken_at_timestamp"));
  post.displayUrl = str(pick(item, "displayUrl", "display_url", "thumbnailUrl"));
  post.images = strArray(item.images);
  post.musicInfo = musicFrom(item);
  post.productType = str(item.productType);
  post.isSponsored = bool(item.isSponsored);
  return post;
}

/**
 * Bright Data "Instagram Hashtags Scraper" dataset record → RawPost.
 * Bright Data field names vary by dataset version, so candidate keys are tried.
 */
export function normalizeBrightDataRecord(raw: unknown): RawPost | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const url = str(pick(item, "url", "post_url", "input_url"));
  const shortCode = str(pick(item, "shortcode", "post_id", "id")) || shortCodeFromUrl(url);
  if (!shortCode) return null;

  const post = emptyPost(shortCode, url || `https://www.instagram.com/p/${shortCode}/`);
  post.caption = str(pick(item, "caption", "description", "content"));
  post.hashtags = strArray(item.hashtags) ?? parseCaptionEntities(post.caption).hashtags;
  post.mentions = strArray(pick(item, "mentions", "tagged_users")) ?? parseCaptionEntities(post.caption).mentions;
  post.ownerUsername = str(pick(item, "user_posted", "owner_username", "username", "profile_name"));
  post.ownerFullName = str(pick(item, "user_full_name", "full_name"));
  post.ownerId = str(pick(item, "user_id", "owner_id"));
  post.likesCount = int(pick(item, "likes", "num_likes", "likes_count"));
  post.commentsCount = int(pick(item, "num_comments", "comments", "comments_count"));
  post.videoViewCount = int(pick(item, "video_view_count", "views", "video_play_count"));
  post.sharesCount = int(pick(item, "shares", "num_shares"));
  post.locationName = str(pick(item, "location", "location_name"));
  post.timestamp = toIso(pick(item, "date_posted", "timestamp", "taken_at"));
  post.displayUrl = str(pick(item, "display_url", "thumbnail", "image_url"));
  post.images = strArray(pick(item, "photos", "images", "image_urls"));
  const videoFlag = pick(item, "is_video", "video_url");
  post.type = videoFlag ? "Video" : str(pick(item, "content_type", "type"));
  return post;
}

/**
 * Instagram web GraphQL / web_info media node → RawPost. Used by the generic proxy
 * providers (ScrapingBee, Crawlbase) which return Instagram's own JSON.
 */
export function normalizeIgMediaNode(raw: unknown): RawPost | null {
  if (!raw || typeof raw !== "object") return null;
  const node = (("node" in (raw as object) ? (raw as Record<string, unknown>).node : raw) ?? raw) as Record<
    string,
    unknown
  >;
  const shortCode = str(pick(node, "shortcode", "code", "shortCode"));
  if (!shortCode) return null;

  const post = emptyPost(shortCode, `https://www.instagram.com/p/${shortCode}/`);
  // Caption can be a string or the edge structure.
  const capEdge = (node.edge_media_to_caption as Record<string, unknown> | undefined)?.edges;
  if (Array.isArray(capEdge) && capEdge[0]) {
    post.caption = str(((capEdge[0] as Record<string, unknown>).node as Record<string, unknown>)?.text);
  } else {
    post.caption = str(pick(node, "caption", "accessibility_caption"));
  }
  const ent = parseCaptionEntities(post.caption);
  post.hashtags = ent.hashtags;
  post.mentions = ent.mentions;
  post.likesCount = int(
    (node.edge_liked_by as Record<string, unknown> | undefined)?.count ??
      (node.edge_media_preview_like as Record<string, unknown> | undefined)?.count ??
      pick(node, "like_count", "likesCount")
  );
  post.commentsCount = int(
    (node.edge_media_to_comment as Record<string, unknown> | undefined)?.count ?? pick(node, "comment_count", "commentsCount")
  );
  post.videoViewCount = int(pick(node, "video_view_count", "view_count", "play_count"));
  post.timestamp = toIso(pick(node, "taken_at_timestamp", "taken_at", "device_timestamp"));
  post.displayUrl = str(pick(node, "display_url", "thumbnail_src"));
  post.type = node.is_video || node.media_type === 2 ? "Video" : "Image";
  const owner = node.owner as Record<string, unknown> | undefined;
  if (owner) {
    post.ownerId = str(owner.id);
    post.ownerUsername = str(owner.username);
    post.ownerFullName = str(owner.full_name);
  }
  return post;
}

/**
 * Best-effort: dig Instagram media nodes out of an HTML page or a JSON string
 * returned by a generic scraping proxy. Looks for the common hashtag containers.
 */
export function extractIgMediaNodesFromText(text: string): unknown[] {
  const nodes: unknown[] = [];
  // 1) Try to parse the whole body as JSON (web_info / GraphQL responses).
  const tryJson = (s: string): unknown => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };
  const roots: unknown[] = [];
  const whole = tryJson(text);
  if (whole) roots.push(whole);
  // 2) Otherwise scan for embedded JSON blobs that contain media sections.
  if (!roots.length) {
    for (const m of text.matchAll(/\{[^<]*?"(?:edge_hashtag_to_media|edge_hashtag_to_top_posts|sections|recent)"[^<]*\}/g)) {
      const parsed = tryJson(m[0]);
      if (parsed) roots.push(parsed);
    }
  }

  const visit = (obj: unknown, depth: number): void => {
    if (!obj || typeof obj !== "object" || depth > 8) return;
    const rec = obj as Record<string, unknown>;
    // GraphQL edge containers
    for (const key of ["edge_hashtag_to_media", "edge_hashtag_to_top_posts"]) {
      const edges = (rec[key] as Record<string, unknown> | undefined)?.edges;
      if (Array.isArray(edges)) for (const e of edges) nodes.push(e);
    }
    // web_info "sections" → layout_content.medias[].media
    if (Array.isArray(rec.sections)) {
      for (const sec of rec.sections as Record<string, unknown>[]) {
        const medias = ((sec.layout_content as Record<string, unknown>)?.medias ?? sec.medias) as unknown;
        if (Array.isArray(medias)) for (const m of medias) nodes.push((m as Record<string, unknown>).media ?? m);
      }
    }
    // Recurse into nested objects (e.g. web_info's `recent` → `sections`, `data`, etc.).
    for (const v of Object.values(rec)) if (v && typeof v === "object") visit(v, depth + 1);
  };
  for (const r of roots) visit(r, 0);
  return nodes;
}
