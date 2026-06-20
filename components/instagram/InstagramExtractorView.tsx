"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import type { InstagramJobSummary, InstagramJobDetail, ProviderStatus } from "@/types/instagram";
import type { InstagramInput } from "@/lib/validations/instagram";
import { ScrapeForm } from "./ScrapeForm";
import { JobProgress } from "./JobProgress";
import { ResultsTable } from "./ResultsTable";

const STATUS_DOT: Record<InstagramJobSummary["status"], string> = {
  PENDING: "bg-amber-400",
  RUNNING: "bg-blue-500 animate-pulse",
  SUCCEEDED: "bg-green-500",
  FAILED: "bg-red-500",
  CANCELLED: "bg-surface-300",
};

interface Props {
  initialJobs: InstagramJobSummary[];
  initialProviders: ProviderStatus[];
}

export function InstagramExtractorView({ initialJobs, initialProviders }: Props) {
  const [jobs, setJobs] = useState<InstagramJobSummary[]>(initialJobs);
  const [providers, setProviders] = useState<ProviderStatus[]>(initialProviders);
  const [selectedId, setSelectedId] = useState<string | null>(initialJobs[0]?.id ?? null);
  const [detail, setDetail] = useState<InstagramJobDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refreshProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/instagram/providers");
      if (!res.ok) return;
      const { data } = (await res.json()) as { data: ProviderStatus[] };
      setProviders(data);
    } catch {
      /* ignore — non-critical */
    }
  }, []);

  // Fetch + poll the selected job. Recursive setTimeout avoids overlapping requests
  // and stops automatically once the job reaches a terminal state.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/instagram/jobs/${selectedId}`);
        if (!res.ok || cancelled) return;
        const { data } = (await res.json()) as { data: InstagramJobDetail };
        if (cancelled) return;
        setDetail(data);
        setJobs((js) => js.map((j) => (j.id === data.id ? { ...j, ...stripPosts(data) } : j)));
        if (data.status === "PENDING" || data.status === "RUNNING") {
          timer = setTimeout(poll, 2500);
        } else {
          // Terminal: credits may have changed — refresh the provider statuses.
          void refreshProviders();
        }
      } catch {
        /* transient fetch error — next interaction will retry */
      }
    }
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedId, refreshProviders]);

  async function handleSubmit(input: InstagramInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/instagram/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err?.code === "PROVIDER_UNAVAILABLE") void refreshProviders();
        throw new Error(err?.error || "Failed to start the run");
      }
      const { data } = (await res.json()) as { data: InstagramJobSummary };
      setJobs((js) => [data, ...js]);
      setSelectedId(data.id);
      toast.success("Scrape started");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/instagram/jobs/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setJobs((js) => js.filter((j) => j.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setDetail(null);
      }
      toast.success("Run deleted");
    } else {
      toast.error("Failed to delete run");
    }
  }

  return (
    <div className="space-y-6">
      <ScrapeForm onSubmit={handleSubmit} busy={submitting} providers={providers} />

      {jobs.length > 0 && (
        <div className="rounded-xl border border-surface-200 bg-white">
          <div className="px-4 py-2.5 border-b border-surface-200 text-xs font-semibold uppercase tracking-wider text-surface-400">
            Recent runs
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-surface-100">
            {jobs.map((j) => (
              <button
                key={j.id}
                onClick={() => setSelectedId(j.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-50",
                  selectedId === j.id && "bg-brand-50/50"
                )}
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[j.status])} />
                <span className="flex-1 min-w-0 truncate text-sm text-surface-800">
                  {j.hashtags.map((h) => `#${h}`).join(", ")}
                </span>
                <span className="shrink-0 text-xs text-surface-400 capitalize">{j.provider}</span>
                <span className="shrink-0 text-xs text-surface-500">{j.resultCount} results</span>
                <span className="shrink-0 text-xs text-surface-400">
                  {new Date(j.createdAt).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {detail && (
        <>
          <JobProgress job={detail} onDelete={handleDelete} />
          <ResultsTable jobId={detail.id} posts={detail.posts} />
        </>
      )}
    </div>
  );
}

function stripPosts(d: InstagramJobDetail): InstagramJobSummary {
  const { posts: _posts, ...summary } = d;
  void _posts;
  return summary;
}
