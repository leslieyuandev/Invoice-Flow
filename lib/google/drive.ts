// Server-side Google Drive access for a single SHARED business account
// (haloballoonevent@gmail.com). Uses a stored OAuth refresh token so every
// app user browses the same Drive library without logging in themselves.
//
// Required env vars (server-only — NOT NEXT_PUBLIC):
//   GOOGLE_DRIVE_CLIENT_ID
//   GOOGLE_DRIVE_CLIENT_SECRET
//   GOOGLE_DRIVE_REFRESH_TOKEN
//   GOOGLE_DRIVE_ROOT_FOLDER_ID  (optional — restrict browsing to one folder)

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const FILES_URL = "https://www.googleapis.com/drive/v3/files";
const FOLDER_MIME = "application/vnd.google-apps.folder";

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
}

export function driveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
      process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
      process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  );
}

export function driveRootFolder(): string {
  return process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "root";
}

// Cache the short-lived access token across warm invocations.
let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_DRIVE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
    refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN!,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Google token refresh failed (${res.status}) ${txt.slice(0, 200)}`);
  }
  const j = (await res.json()) as { access_token: string; expires_in?: number };
  cachedToken = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return cachedToken.token;
}

// List sub-folders + image files inside a folder, or search images by name.
export async function listDrive(folderId: string, q?: string): Promise<DriveItem[]> {
  const token = await getAccessToken();
  const safe = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const typeClause = `(mimeType = '${FOLDER_MIME}' or mimeType contains 'image/')`;
  const query =
    q && q.trim()
      ? `name contains '${safe(q.trim())}' and trashed = false and ${typeClause}`
      : `'${safe(folderId || driveRootFolder())}' in parents and trashed = false and ${typeClause}`;

  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name,mimeType)",
    pageSize: "300",
    orderBy: "folder,name",
    spaces: "drive",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const res = await fetch(`${FILES_URL}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Drive list failed (${res.status}) ${txt.slice(0, 200)}`);
  }
  const j = (await res.json()) as { files?: Array<{ id: string; name: string; mimeType: string }> };
  return (j.files ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    isFolder: f.mimeType === FOLDER_MIME,
  }));
}

// Fetch a small thumbnail for previewing in the browser grid.
export async function getDriveThumb(
  id: string
): Promise<{ buf: ArrayBuffer; contentType: string } | null> {
  const token = await getAccessToken();
  const metaRes = await fetch(`${FILES_URL}/${id}?fields=thumbnailLink&supportsAllDrives=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (metaRes.ok) {
    const meta = (await metaRes.json()) as { thumbnailLink?: string };
    if (meta.thumbnailLink) {
      const link = meta.thumbnailLink.replace(/=s\d+$/, "=s400");
      const tRes = await fetch(link, { headers: { Authorization: `Bearer ${token}` } });
      if (tRes.ok)
        return { buf: await tRes.arrayBuffer(), contentType: tRes.headers.get("content-type") ?? "image/jpeg" };
    }
  }
  // Fallback: stream the full media.
  const mRes = await fetch(`${FILES_URL}/${id}?alt=media&supportsAllDrives=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!mRes.ok) return null;
  return { buf: await mRes.arrayBuffer(), contentType: mRes.headers.get("content-type") ?? "image/jpeg" };
}

// Download a file's full bytes (for importing into the asset store).
export async function downloadDriveFile(
  id: string
): Promise<{ buf: ArrayBuffer; contentType: string; name: string }> {
  const token = await getAccessToken();
  const metaRes = await fetch(`${FILES_URL}/${id}?fields=name,mimeType&supportsAllDrives=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meta = metaRes.ok
    ? ((await metaRes.json()) as { name?: string; mimeType?: string })
    : {};
  const mRes = await fetch(`${FILES_URL}/${id}?alt=media&supportsAllDrives=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!mRes.ok) {
    const txt = await mRes.text().catch(() => "");
    throw new Error(`Drive download failed (${mRes.status}) ${txt.slice(0, 200)}`);
  }
  return {
    buf: await mRes.arrayBuffer(),
    contentType: meta.mimeType ?? mRes.headers.get("content-type") ?? "image/png",
    name: meta.name ?? `${id}.png`,
  };
}
