"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import type { MapsJobSummary, MapsJobDetail } from "@/types/maps";
import type { ScrapeInput } from "@/lib/validations/maps";
import { ScrapeForm } from "./ScrapeForm";
import { JobProgress } from "./JobProgress";
import { ResultsTable } from "./ResultsTable";

const STATUS_DOT: Record<MapsJobSummary["status"], string> = {
  PENDING: "bg-amber-400",
  RUNNING: "bg-blue-500 animate-pulse",
  SUCCEEDED: "bg-green-500",
  FAILED: "bg-red-500",
  CANCELLED: "bg-surface-300",
};

export function MapsExtractorView({ initialJobs }: { initialJobs: MapsJobSummary[] }) {
  const [jobs, setJobs] = useState<MapsJobSummary[]>(initialJobs);
  const [selectedId, setSelectedId] = useState<string | null>(initialJobs[0]?.id ?? null);
  const [detail, setDetail] = useState<MapsJobDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch + poll the selected job. Recursive setTimeout keeps requests from
  // overlapping and stops automatically once the job reaches a terminal state.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/maps/jobs/${selectedId}`);
        if (!res.ok || cancelled) return;
        const { data } = (await res.json()) as { data: MapsJobDetail };
        if (cancelled) return;
        setDetail(data);
        setJobs((js) => js.map((j) => (j.id === data.id ? { ...j, ...stripPlaces(data) } : j)));
        if (data.status === "PENDING" || data.status === "RUNNING") {
          timer = setTimeout(poll, 2000);
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
  }, [selectedId]);

  async function handleSubmit(input: ScrapeInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/maps/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to start the run");
      }
      const { data } = (await res.json()) as { data: MapsJobSummary };
      setJobs((js) => [data, ...js]);
      setSelectedId(data.id);
      toast.success("Extraction started");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/maps/jobs/${id}`, { method: "DELETE" });
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
      <ScrapeForm onSubmit={handleSubmit} busy={submitting} />

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
                  {j.searchQueries.join(", ")}
                </span>
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
          <ResultsTable jobId={detail.id} places={detail.places} />
        </>
      )}
    </div>
  );
}

function stripPlaces(d: MapsJobDetail): MapsJobSummary {
  // Reuse the polled detail to refresh the matching summary row in the list.
  const { places: _places, ...summary } = d;
  void _places;
  return summary;
}
