"use client";

import { useMemo, useState } from "react";
import { Plus, X, Hash, Loader2, AlertTriangle, CheckCircle2, Lock, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import type { InstagramInput, ScraperProvider, ResultsType } from "@/lib/validations/instagram";
import type { ProviderStatus } from "@/types/instagram";

const inputCls =
  "flex h-9 w-full rounded-md border border-surface-200 bg-white px-3 py-1 text-sm text-surface-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600";

interface ScrapeFormProps {
  onSubmit: (input: InstagramInput) => Promise<void>;
  busy?: boolean;
  providers: ProviderStatus[];
}

function pickDefaultProvider(providers: ProviderStatus[]): ScraperProvider {
  return (
    providers.find((p) => p.provider === "apify" && p.available)?.provider ??
    providers.find((p) => p.available)?.provider ??
    "apify"
  );
}

export function ScrapeForm({ onSubmit, busy, providers }: ScrapeFormProps) {
  const [hashtags, setHashtags] = useState<string[]>([""]);
  const [bulk, setBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [resultsType, setResultsType] = useState<ResultsType>("posts");
  const [maxResults, setMaxResults] = useState(20);
  const [searchByKeyword, setSearchByKeyword] = useState(false);
  const [provider, setProvider] = useState<ScraperProvider>(() => pickDefaultProvider(providers));
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => providers.find((p) => p.provider === provider) ?? null,
    [providers, provider]
  );
  const anyAvailable = providers.some((p) => p.available);

  function updateHashtag(i: number, value: string) {
    setHashtags((h) => h.map((v, idx) => (idx === i ? value : v)));
  }

  function collectHashtags(): string[] {
    const raw = bulk ? bulkText.split(/[\n,]/) : hashtags;
    return raw.map((s) => s.trim().replace(/^#+/, "")).filter(Boolean);
  }

  async function handleSubmit() {
    setError(null);
    const cleaned = collectHashtags();
    if (!cleaned.length) {
      setError(searchByKeyword ? "Add at least one keyword." : "Add at least one hashtag.");
      return;
    }
    if (!selected?.available) {
      setError("The selected provider isn't available. Pick an available provider below.");
      return;
    }

    const payload: InstagramInput = {
      hashtags: cleaned,
      searchByKeyword,
      resultsType,
      maxResults: Math.max(1, Math.min(1000, maxResults || 20)),
      provider,
    };

    try {
      await onSubmit(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start the run.");
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Hash className="w-4 h-4 text-brand-600" />
          New scrape run
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Hashtags (required) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{searchByKeyword ? "Keywords" : "Hashtags"} (required)</Label>
            <button
              type="button"
              onClick={() => {
                if (!bulk) setBulkText(hashtags.filter(Boolean).join("\n"));
                else setHashtags(bulkText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean).length
                  ? bulkText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
                  : [""]);
                setBulk((b) => !b);
              }}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              {bulk ? "Single fields" : "Bulk edit"}
            </button>
          </div>

          {bulk ? (
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={4}
              placeholder={"comingsoonkl\nklmegamall\nnewmallkl"}
              className={cn(inputCls, "h-auto py-2 font-mono text-xs")}
            />
          ) : (
            <div className="space-y-2">
              {hashtags.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-surface-400">#</span>
                  <Input
                    value={h}
                    placeholder="e.g. comingsoonkl"
                    onChange={(e) => updateHashtag(i, e.target.value)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setHashtags((hs) => (hs.length === 1 ? hs : hs.filter((_, idx) => idx !== i)))}
                    disabled={hashtags.length === 1}
                    className="p-2 rounded-md text-surface-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition-colors"
                    aria-label="Remove hashtag"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setHashtags((h) => [...h, ""])}>
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
          )}
        </div>

        {/* Content type + count */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Content type</Label>
            <select
              value={resultsType}
              onChange={(e) => setResultsType(e.target.value as ResultsType)}
              className={inputCls}
            >
              <option value="posts">Scrape posts</option>
              <option value="reels">Scrape reels</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Maximum {resultsType} per {searchByKeyword ? "keyword" : "hashtag"}</Label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>

        {/* Keyword toggle */}
        <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-lg border border-surface-200 p-3">
          <input
            type="checkbox"
            checked={searchByKeyword}
            onChange={(e) => setSearchByKeyword(e.target.checked)}
            className="mt-0.5 rounded border-surface-300"
          />
          <span>
            <span className="block text-sm font-medium text-surface-800">
              Scrape with a keyword instead of hashtag
            </span>
            <span className="block text-xs text-surface-500 mt-0.5">
              Treats each input as a free-text search term rather than an exact hashtag.
            </span>
          </span>
        </label>

        {/* Provider selector */}
        <div className="space-y-2">
          <Label>Scraping provider</Label>
          {!anyAvailable && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                No provider is available yet. Set a provider API token on the server (e.g.{" "}
                <code className="text-xs">APIFY_TOKEN</code>) to enable scraping. Free credits refresh monthly.
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {providers.map((p) => (
              <ProviderCard
                key={p.provider}
                p={p}
                selected={provider === p.provider}
                onSelect={() => p.available && setProvider(p.provider)}
              />
            ))}
          </div>
        </div>

        {/* Hit-limit message for the selected provider */}
        {selected && selected.limited && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <Lock className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>{selected.label}</strong> has hit its free {selected.unit} limit
              {selected.limitReason ? ` (${selected.limitReason})` : ""}. It’s disabled until the free credits
              refresh{selected.resetInDays != null ? ` in ${selected.resetInDays} day${selected.resetInDays === 1 ? "" : "s"}` : ""}
              {selected.resetsAt ? ` (${selected.resetsAt.slice(0, 10)})` : ""}. Pick another provider or wait for the refresh.
            </span>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-surface-400">
            {selected
              ? `${selected.costNote} · ${selected.remaining}/${selected.freeCredits} free ${selected.unit} left this period`
              : ""}
          </p>
          <Button onClick={handleSubmit} disabled={busy || !selected?.available}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
            {busy ? "Starting…" : "Start scrape"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProviderCard({
  p,
  selected,
  onSelect,
}: {
  p: ProviderStatus;
  selected: boolean;
  onSelect: () => void;
}) {
  const disabled = !p.available;
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
        selected ? "border-brand-500 ring-1 ring-brand-500 bg-brand-50/40" : "border-surface-200 hover:border-surface-300",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-surface-800 truncate">{p.label}</span>
        <StatusPill p={p} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-surface-500">{p.costNote}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-surface-100 overflow-hidden">
          <div
            className={cn("h-full rounded-full", p.limited ? "bg-red-400" : "bg-brand-500")}
            style={{ width: `${p.freeCredits ? Math.min(100, (p.creditsUsed / p.freeCredits) * 100) : 0}%` }}
          />
        </div>
        <span className="text-[10px] text-surface-400 whitespace-nowrap">
          {p.remaining}/{p.freeCredits} {p.unit} left
        </span>
      </div>
    </button>
  );
}

function StatusPill({ p }: { p: ProviderStatus }) {
  if (!p.configured)
    return (
      <a
        href={p.docsUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-semibold text-surface-500"
      >
        Not configured <ExternalLink className="w-2.5 h-2.5" />
      </a>
    );
  if (p.limited)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
        <Lock className="w-2.5 h-2.5" /> Limit hit
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
      <CheckCircle2 className="w-2.5 h-2.5" /> Available
    </span>
  );
}
