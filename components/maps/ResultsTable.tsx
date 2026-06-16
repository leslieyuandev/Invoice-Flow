"use client";

import { useMemo, useState } from "react";
import { Download, FileJson, Users, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { MapsPlaceRow } from "@/types/maps";

type ViewTab = "overview" | "contact" | "rating" | "new" | "all";
type Mode = "table" | "json";

interface Column {
  key: keyof MapsPlaceRow;
  label: string;
  render?: (row: MapsPlaceRow) => React.ReactNode;
}

const websiteCell = (row: MapsPlaceRow) =>
  row.website ? (
    <a href={row.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline truncate inline-block max-w-[16rem]">
      {row.website.replace(/^https?:\/\//, "")}
    </a>
  ) : (
    <span className="text-surface-300">—</span>
  );

const claimedCell = (row: MapsPlaceRow) =>
  row.isClaimed == null ? (
    <span className="text-surface-300">—</span>
  ) : row.isClaimed ? (
    <span className="text-green-700">Yes</span>
  ) : (
    <span className="text-amber-700 font-medium">No</span>
  );

const emailsCell = (row: MapsPlaceRow) =>
  row.emails?.length ? <span className="truncate inline-block max-w-[16rem]">{row.emails.join(", ")}</span> : <span className="text-surface-300">—</span>;

const signalsCell = (row: MapsPlaceRow) =>
  row.newnessSignals?.matched?.length ? <span className="text-xs">{row.newnessSignals.matched.join(" · ")}</span> : <span className="text-surface-300">—</span>;

const titleCell = (row: MapsPlaceRow) => (
  <span className="flex items-center gap-1.5">
    <span className="truncate">{row.title}</span>
    {row.isLikelyNew && (
      <span
        title={row.newnessSignals?.matched?.join(" · ") || "Likely new / pre-opening"}
        className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700 shrink-0"
      >
        <Sparkles className="w-2.5 h-2.5" /> NEW
      </span>
    )}
  </span>
);

const COLUMNS: Record<ViewTab, Column[]> = {
  overview: [
    { key: "title", label: "Place name", render: titleCell },
    { key: "totalScore", label: "Total Score" },
    { key: "reviewsCount", label: "Reviews Count" },
    { key: "street", label: "Street" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "countryCode", label: "Country Code" },
    { key: "website", label: "Website", render: websiteCell },
  ],
  contact: [
    { key: "title", label: "Place name", render: titleCell },
    { key: "phone", label: "Phone" },
    { key: "website", label: "Website", render: websiteCell },
    { key: "emails", label: "Emails", render: emailsCell },
    { key: "isClaimed", label: "Claimed", render: claimedCell },
    { key: "address", label: "Address" },
  ],
  rating: [
    { key: "title", label: "Place name", render: titleCell },
    { key: "category", label: "Category" },
    { key: "totalScore", label: "Total Score" },
    { key: "reviewsCount", label: "Reviews Count" },
    { key: "openingStatus", label: "Opening Status" },
  ],
  new: [
    { key: "title", label: "Place name", render: titleCell },
    { key: "reviewsCount", label: "Reviews" },
    { key: "isClaimed", label: "Claimed", render: claimedCell },
    { key: "openingStatus", label: "Opening Status" },
    { key: "newnessSignals", label: "Why flagged", render: signalsCell },
    { key: "phone", label: "Phone" },
    { key: "website", label: "Website", render: websiteCell },
  ],
  all: [
    { key: "title", label: "Place name", render: titleCell },
    { key: "category", label: "Category" },
    { key: "totalScore", label: "Total Score" },
    { key: "reviewsCount", label: "Reviews Count" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "phone", label: "Phone" },
    { key: "website", label: "Website", render: websiteCell },
    { key: "emails", label: "Emails", render: emailsCell },
    { key: "isClaimed", label: "Claimed", render: claimedCell },
    { key: "openingStatus", label: "Opening Status" },
    { key: "description", label: "Description" },
    { key: "imageUrls", label: "Images", render: (r) => <span>{r.imageUrls?.length ?? 0}</span> },
    { key: "placeId", label: "Place ID" },
  ],
};

interface ResultsTableProps {
  jobId: string;
  places: MapsPlaceRow[];
  onSavedClients?: () => void;
}

export function ResultsTable({ jobId, places, onSavedClients }: ResultsTableProps) {
  const [tab, setTab] = useState<ViewTab>("overview");
  const [mode, setMode] = useState<Mode>("table");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const newCount = useMemo(() => places.filter((p) => p.isLikelyNew).length, [places]);
  const TABS: { id: ViewTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "contact", label: "Contact info" },
    { id: "rating", label: "Rating" },
    { id: "new", label: `🆕 New${newCount ? ` (${newCount})` : ""}` },
    { id: "all", label: "All fields" },
  ];

  const rows = tab === "new" ? places.filter((p) => p.isLikelyNew) : places;
  const columns = COLUMNS[tab];
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.placeId));
  const jsonText = useMemo(() => JSON.stringify(rows, null, 2), [rows]);

  function toggle(placeId: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((p) => p.placeId)));
  }

  async function saveToClients() {
    if (!selected.size) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/maps/jobs/${jobId}/save-clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Failed to save");
      const { data } = await res.json();
      toast.success(`Saved ${data.saved} place(s) to Clients`);
      setSelected(new Set());
      onSavedClients?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save to clients");
    } finally {
      setSaving(false);
    }
  }

  function cellValue(row: MapsPlaceRow, col: Column) {
    if (col.render) return col.render(row);
    const v = row[col.key];
    if (v == null || v === "") return <span className="text-surface-300">—</span>;
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
              <button key={m} onClick={() => setMode(m)} className={cn("px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors", mode === m ? "bg-white text-surface-900 shadow-sm" : "text-surface-600 hover:text-surface-900")}>
                {m}
              </button>
            ))}
          </div>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/maps/jobs/${jobId}/export?format=csv`} download><Download className="w-3.5 h-3.5" />CSV</a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/maps/jobs/${jobId}/export?format=json`} download><FileJson className="w-3.5 h-3.5" />JSON</a>
          </Button>
          <Button size="sm" onClick={saveToClients} disabled={!selected.size || saving} loading={saving}>
            <Users className="w-3.5 h-3.5" />
            Save to Clients{selected.size ? ` (${selected.size})` : ""}
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-10 text-center text-sm text-surface-500">
          {tab === "new" ? "No pre-opening / new businesses flagged in this run." : "No results yet. They’ll appear here as the run progresses."}
        </div>
      ) : mode === "json" ? (
        <pre className="max-h-[32rem] overflow-auto p-4 text-xs leading-relaxed text-surface-700">{jsonText}</pre>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-left">
                <th className="w-10 px-3 py-2.5"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-surface-300" /></th>
                <th className="w-10 px-2 py-2.5 text-xs font-semibold text-surface-400">#</th>
                {columns.map((c) => (
                  <th key={String(c.key)} className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-surface-500 whitespace-nowrap">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className={cn("border-b border-surface-100 hover:bg-surface-50/60 transition-colors", selected.has(row.placeId) && "bg-brand-50/40", row.isLikelyNew && "bg-green-50/40")}>
                  <td className="px-3 py-2.5"><input type="checkbox" checked={selected.has(row.placeId)} onChange={() => toggle(row.placeId)} className="rounded border-surface-300" /></td>
                  <td className="px-2 py-2.5 text-xs text-surface-400">{i + 1}</td>
                  {columns.map((c) => (
                    <td key={String(c.key)} className="px-3 py-2.5 align-top text-surface-700">
                      {c.key === "totalScore" && row.totalScore != null ? (
                        <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{row.totalScore}</span>
                      ) : (
                        <span className="block max-w-[18rem] truncate" title={typeof row[c.key] === "string" ? String(row[c.key]) : undefined}>
                          {cellValue(row, c)}
                        </span>
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
