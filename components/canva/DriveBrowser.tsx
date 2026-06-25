"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Folder, ArrowLeft, Search, Loader2, RefreshCw, HardDrive } from "lucide-react";
import { toast } from "sonner";
import type { CanvaAsset } from "@/types/canva";

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
}

interface Crumb {
  id: string;
  name: string;
}

interface Props {
  /** Called after an image is imported into the asset store. */
  onPick: (asset: CanvaAsset) => void;
}

export function DriveBrowser({ onPick }: Props) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crumbs, setCrumbs] = useState<Crumb[]>([{ id: "", name: "Drive" }]);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (folderId: string, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (folderId) params.set("folder", folderId);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/canva/drive?${params}`);
      const j = (await res.json()) as {
        configured?: boolean;
        items?: DriveItem[];
        error?: string;
      };
      setConfigured(j.configured ?? false);
      if (j.error) setError(j.error);
      setItems(j.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Drive");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void load("", "");
  }, [load]);

  // Debounced search (searches across the whole Drive)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const current = crumbs[crumbs.length - 1];
      void load(search.trim() ? "" : current.id, search);
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openFolder(item: DriveItem) {
    setSearch("");
    const next = [...crumbs, { id: item.id, name: item.name }];
    setCrumbs(next);
    void load(item.id, "");
  }

  function goToCrumb(idx: number) {
    setSearch("");
    const next = crumbs.slice(0, idx + 1);
    setCrumbs(next);
    void load(next[next.length - 1].id, "");
  }

  async function pickImage(item: DriveItem) {
    if (importing) return;
    setImporting(item.id);
    try {
      const res = await fetch("/api/canva/drive/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: item.id }),
      });
      const j = (await res.json()) as { asset?: CanvaAsset; error?: string };
      if (!res.ok || !j.asset) throw new Error(j.error ?? "Import failed");
      onPick(j.asset);
      toast.success("Added from Google Drive");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(null);
    }
  }

  const folders = items.filter((i) => i.isFolder);
  const images = items.filter((i) => !i.isFolder);
  const atRoot = crumbs.length === 1;

  if (configured === false) {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-3 text-[11px] text-surface-500 space-y-1.5">
        <p className="flex items-center gap-1.5 font-medium text-surface-600">
          <HardDrive className="w-3.5 h-3.5" /> Google Drive not connected
        </p>
        <p>
          Add a service-account key (<code className="text-[10px]">GOOGLE_DRIVE_SA_KEY_BASE64</code>)
          and <code className="text-[10px]">GOOGLE_DRIVE_ROOT_FOLDER_ID</code> to the server env, then
          share that Drive folder with the service-account email.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Breadcrumbs + refresh */}
      <div className="flex items-center gap-1 text-[11px] text-surface-500 min-w-0">
        {!atRoot && (
          <button
            type="button"
            onClick={() => goToCrumb(crumbs.length - 2)}
            className="p-1 rounded hover:bg-surface-100 shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="flex items-center gap-0.5 overflow-x-auto whitespace-nowrap min-w-0">
          {crumbs.map((c, i) => (
            <span key={c.id || "root"} className="flex items-center gap-0.5">
              {i > 0 && <span className="text-surface-300">/</span>}
              <button
                type="button"
                onClick={() => goToCrumb(i)}
                className={i === crumbs.length - 1 ? "font-medium text-surface-700" : "hover:underline"}
              >
                {c.name}
              </button>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => load(search.trim() ? "" : crumbs[crumbs.length - 1].id, search)}
          className="p-1 rounded hover:bg-surface-100 shrink-0 ml-auto"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-surface-400 absolute left-2 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Drive images…"
          className="w-full pl-7 pr-2 py-1.5 text-xs border border-surface-200 rounded-md focus:outline-none focus:border-brand-400"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6 text-surface-400">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}

      {error && !loading && (
        <p className="text-[11px] text-red-500 break-words">{error}</p>
      )}

      {!loading && !error && (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div className="space-y-0.5">
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => openFolder(f)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-surface-600 hover:bg-surface-100 text-left"
                >
                  <Folder className="w-4 h-4 text-brand-500 shrink-0" />
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Images */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => pickImage(img)}
                  title={img.name}
                  className="relative rounded-lg border border-surface-200 overflow-hidden aspect-square hover:border-brand-400 group/drive"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/canva/drive/thumb/${img.id}`}
                    alt={img.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  {importing === img.id && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {folders.length === 0 && images.length === 0 && (
            <p className="text-[11px] text-surface-400 py-4 text-center">
              {search.trim() ? "No images found." : "This folder is empty."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
