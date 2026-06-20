"use client";

import { CheckCircle2, Loader2, XCircle, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { InstagramJobSummary } from "@/types/instagram";

const STATUS_META: Record<
  InstagramJobSummary["status"],
  { label: string; icon: typeof Clock; cls: string; spin?: boolean }
> = {
  PENDING: { label: "Queued", icon: Clock, cls: "text-amber-600 bg-amber-50" },
  RUNNING: { label: "Running", icon: Loader2, cls: "text-blue-600 bg-blue-50", spin: true },
  SUCCEEDED: { label: "Succeeded", icon: CheckCircle2, cls: "text-green-600 bg-green-50" },
  FAILED: { label: "Failed", icon: XCircle, cls: "text-red-600 bg-red-50" },
  CANCELLED: { label: "Cancelled", icon: XCircle, cls: "text-surface-500 bg-surface-100" },
};

interface JobProgressProps {
  job: InstagramJobSummary;
  onDelete?: (id: string) => void;
}

export function JobProgress({ job, onDelete }: JobProgressProps) {
  const meta = STATUS_META[job.status];
  const Icon = meta.icon;
  const active = job.status === "RUNNING" || job.status === "PENDING";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex flex-wrap items-center gap-x-8 gap-y-3",
        job.status === "FAILED" ? "border-red-200 bg-red-50/40" : "border-surface-200 bg-white"
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", meta.cls)}>
          <Icon className={cn("w-3.5 h-3.5", meta.spin && "animate-spin")} />
          {meta.label}
        </span>
      </div>

      <Stat label="Results" value={String(job.resultCount)} />
      <Stat label={job.searchByKeyword ? "Keywords" : "Hashtags"} value={String(job.hashtags.length)} />
      <Stat label={`Max / ${job.searchByKeyword ? "keyword" : "tag"}`} value={String(job.maxResults)} />
      <Stat label="Type" value={job.resultsType} />
      <Stat label="Provider" value={job.provider} />

      <div className="flex-1 min-w-[8rem] truncate text-sm text-surface-500">
        {job.hashtags.map((h) => `#${h}`).join(", ")}
      </div>

      {active && (
        <span className="text-xs text-surface-400">Scraping… results appear below as they’re found.</span>
      )}
      {job.status === "FAILED" && job.error && (
        <span className="text-xs text-red-600 max-w-md truncate" title={job.error}>
          {job.error}
        </span>
      )}

      {onDelete && !active && (
        <button
          type="button"
          onClick={() => onDelete(job.id)}
          className="p-1.5 rounded-md text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          aria-label="Delete run"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">{label}</span>
      <span className="text-sm font-semibold text-surface-900 capitalize">{value}</span>
    </div>
  );
}
