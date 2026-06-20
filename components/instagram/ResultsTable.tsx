"use client";

import { useMemo, useState } from "react";
import { Download, FileJson, Heart, MessageCircle, Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { InstagramPostRow } from "@/types/instagram";

type ViewTab = "overview" | "engagement" | "media" | "all";
type Mode = "table" | "json";

interface Column {
  key: keyof InstagramPostRow;
  label: string;
  render?: (row: InstagramPostRow) => React.ReactNode;
}

const dash = <span className="text-surface-300">—</span>;
const num = (n: number | null) => (n == null ? dash : <span>{n.toLocaleString()}</span>);

const captionCell = (r: InstagramPostRow) =>
  r.caption ? (
    <span className="block max-w-[24rem] truncate" title={r.caption}>
      {r.caption}
    </span>
  ) : (
    dash
  );

const usernameCell = (r: InstagramPostRow) =>
  r.ownerUsername ? (
    <a
      href={`https://www.instagram.com/${r.ownerUsername}/`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-600 hover:underline"
    >
      @{r.ownerUsername}
    </a>
  ) : (
    dash
  );

const urlCell = (r: InstagramPostRow) => (
  <a
    href={r.postUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-brand-600 hover:underline"
  >
    View <ExternalLink className="w-3 h-3" />
  </a>
);

const timeCell = (r: InstagramPostRow) =>
  r.timestamp ? <span className="whitespace-nowrap">{new Date(r.timestamp).toLocaleString()}</span> : dash;

const hashtagsCell = (r: InstagramPostRow) =>
  r.hashtags?.length ? (
    <span className="block max-w-[16rem] truncate text-xs text-surface-500" title={r.hashtags.map((h) => `#${h}`).join(" ")}>
      {r.hashtags.map((h) => `#${h}`).join(" ")}
    </span>
  ) : (
    dash
  );

const audioCell = (r: InstagramPostRow) => {
  const a = [r.musicInfo?.artist, r.musicInfo?.title].filter(Boolean).join(" – ");
  return a ? <span className="truncate inline-block max-w-[14rem]">{a}</span> : dash;
};

const thumbCell = (r: InstagramPostRow) =>
  r.displayUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={r.displayUrl} alt="" className="h-10 w-10 rounded object-cover" loading="lazy" />
  ) : (
    dash
  );

const COLUMNS: Record<ViewTab, Column[]> = {
  overview: [
    { key: "caption", label: "Text (caption)", render: captionCell },
    { key: "ownerFullName", label: "Author" },
    { key: "ownerUsername", label: "Username", render: usernameCell },
    { key: "postUrl", label: "Post", render: urlCell },
    { key: "commentsCount", label: "Comments", render: (r) => num(r.commentsCount) },
    { key: "likesCount", label: "Likes", render: (r) => num(r.likesCount) },
    { key: "timestamp", label: "Posted on", render: timeCell },
    { key: "hashtags", label: "Hashtags", render: hashtagsCell },
  ],
  engagement: [
    { key: "ownerUsername", label: "Username", render: usernameCell },
    { key: "likesCount", label: "Likes", render: (r) => num(r.likesCount) },
    { key: "commentsCount", label: "Comments", render: (r) => num(r.commentsCount) },
    { key: "videoViewCount", label: "Plays / Views", render: (r) => num(r.videoViewCount) },
    { key: "sharesCount", label: "Shares", render: (r) => num(r.sharesCount) },
    { key: "type", label: "Type" },
    { key: "firstComment", label: "First comment", render: (r) => (r.firstComment ? <span className="block max-w-[20rem] truncate" title={r.firstComment}>{r.firstComment}</span> : dash) },
  ],
  media: [
    { key: "displayUrl", label: "Preview", render: thumbCell },
    { key: "type", label: "Type" },
    { key: "images", label: "Images", render: (r) => <span>{r.images?.length ?? (r.displayUrl ? 1 : 0)}</span> },
    { key: "musicInfo", label: "Audio", render: audioCell },
    { key: "locationName", label: "Location" },
    { key: "postUrl", label: "Post", render: urlCell },
  ],
  all: [
    { key: "caption", label: "Caption", render: captionCell },
    { key: "ownerFullName", label: "Author" },
    { key: "ownerUsername", label: "Username", render: usernameCell },
    { key: "type", label: "Type" },
    { key: "likesCount", label: "Likes", render: (r) => num(r.likesCount) },
    { key: "commentsCount", label: "Comments", render: (r) => num(r.commentsCount) },
    { key: "videoViewCount", label: "Plays", render: (r) => num(r.videoViewCount) },
    { key: "sharesCount", label: "Shares", render: (r) => num(r.sharesCount) },
    { key: "locationName", label: "Location" },
    { key: "timestamp", label: "Posted on", render: timeCell },
    { key: "hashtags", label: "Hashtags", render: hashtagsCell },
    { key: "musicInfo", label: "Audio", render: audioCell },
    { key: "postUrl", label: "Post", render: urlCell },
    { key: "shortCode", label: "Shortcode" },
  ],
};

interface ResultsTableProps {
  jobId: string;
  posts: InstagramPostRow[];
}

export function ResultsTable({ jobId, posts }: ResultsTableProps) {
  const [tab, setTab] = useState<ViewTab>("overview");
  const [mode, setMode] = useState<Mode>("table");

  const columns = COLUMNS[tab];
  const jsonText = useMemo(() => JSON.stringify(posts, null, 2), [posts]);

  const TABS: { id: ViewTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "engagement", label: "Engagement" },
    { id: "media", label: "Media & audio" },
    { id: "all", label: "All fields" },
  ];

  function cellValue(row: InstagramPostRow, col: Column) {
    if (col.render) return col.render(row);
    const v = row[col.key];
    if (v == null || v === "") return dash;
    return String(v);
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 p-3">
        <div className="flex items-center gap-1 rounded-lg bg-surface-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                tab === t.id ? "bg-white text-surface-900 shadow-sm" : "text-surface-600 hover:text-surface-900"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-surface-100 p-1">
            {(["table", "json"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors",
                  mode === m ? "bg-white text-surface-900 shadow-sm" : "text-surface-600 hover:text-surface-900"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/instagram/jobs/${jobId}/export?format=csv`} download>
              <Download className="w-3.5 h-3.5" />
              CSV
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/instagram/jobs/${jobId}/export?format=json`} download>
              <FileJson className="w-3.5 h-3.5" />
              JSON
            </a>
          </Button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="p-10 text-center text-sm text-surface-500">
          No results yet. They’ll appear here as the run progresses.
        </div>
      ) : mode === "json" ? (
        <pre className="max-h-[32rem] overflow-auto p-4 text-xs leading-relaxed text-surface-700">{jsonText}</pre>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-left">
                <th className="w-10 px-2 py-2.5 text-xs font-semibold text-surface-400">#</th>
                {columns.map((c) => (
                  <th
                    key={String(c.key)}
                    className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-surface-500 whitespace-nowrap"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map((row, i) => (
                <tr key={row.id} className="border-b border-surface-100 hover:bg-surface-50/60 transition-colors">
                  <td className="px-2 py-2.5 text-xs text-surface-400">{i + 1}</td>
                  {columns.map((c) => (
                    <td key={String(c.key)} className="px-3 py-2.5 align-top text-surface-700">
                      {c.key === "likesCount" && row.likesCount != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-rose-400" />
                          {row.likesCount.toLocaleString()}
                        </span>
                      ) : c.key === "commentsCount" && row.commentsCount != null && tab !== "all" ? (
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5 text-surface-400" />
                          {row.commentsCount.toLocaleString()}
                        </span>
                      ) : c.key === "videoViewCount" && row.videoViewCount != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Play className="w-3.5 h-3.5 text-surface-400" />
                          {row.videoViewCount.toLocaleString()}
                        </span>
                      ) : (
                        cellValue(row, c)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
