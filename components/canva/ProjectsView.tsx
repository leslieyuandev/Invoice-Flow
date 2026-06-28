"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Copy, Trash2, Palette, Star, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageRenderer } from "./PageRenderer";
import { CANVA_TEMPLATES, instantiateTemplate, type CanvaTemplate } from "./templates";
import { CANVA_FORMATS, newPage, type CanvaPage } from "@/types/canva";
import {
  createCanvaProjectAction,
  deleteCanvaProjectAction,
  duplicateCanvaProjectAction,
  toggleCanvaProjectStarAction,
} from "@/actions/canva";
import { cn } from "@/lib/utils/cn";

export interface ProjectListItem {
  id: string;
  title: string;
  format: string;
  width: number;
  height: number;
  pages: CanvaPage[];
  updatedAt: string;
  starred: boolean;
}

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Poppins:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Noto+Sans+SC:wght@400;700&family=Ma+Shan+Zheng&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Dancing+Script:wght@600&family=Bebas+Neue&display=swap";

export function ProjectsView({ projects }: { projects: ProjectListItem[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectListItem | null>(null);
  const [tab, setTab] = useState<"templates" | "blank">("templates");
  const [customW, setCustomW] = useState("1080");
  const [customH, setCustomH] = useState("1080");
  const [viewFilter, setViewFilter] = useState<"all" | "starred">("all");
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  // Optimistic starred state: map of projectId → starred bool
  const [starredMap, setStarredMap] = useState<Record<string, boolean>>(
    () => Object.fromEntries(projects.map((p) => [p.id, p.starred]))
  );

  const templatesByCategory = useMemo(() => {
    const map = new Map<string, CanvaTemplate[]>();
    for (const t of CANVA_TEMPLATES) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return map;
  }, []);

  async function createBlank(formatId: string) {
    const fmt = CANVA_FORMATS.find((f) => f.id === formatId);
    if (!fmt) return;
    setCreating(formatId);
    const res = await createCanvaProjectAction({
      title: `Untitled ${fmt.label}`,
      format: fmt.id,
      width: fmt.width,
      height: fmt.height,
      pages: [newPage()],
    });
    setCreating(null);
    if (res.error || !res.data) {
      toast.error(res.error ?? "Failed to create");
      return;
    }
    router.push(`/canva/${res.data.id}`);
  }

  async function createCustom() {
    const w = Math.max(50, Math.min(8000, Math.round(Number(customW))));
    const h = Math.max(50, Math.min(8000, Math.round(Number(customH))));
    if (!w || !h) { toast.error("Enter a valid width and height"); return; }
    setCreating("custom");
    const res = await createCanvaProjectAction({
      title: `Untitled ${w}×${h}`,
      format: "custom",
      width: w,
      height: h,
      pages: [newPage()],
    });
    setCreating(null);
    if (res.error || !res.data) { toast.error(res.error ?? "Failed to create"); return; }
    router.push(`/canva/${res.data.id}`);
  }

  async function createFromTemplate(tpl: CanvaTemplate) {
    setCreating(tpl.id);
    const res = await createCanvaProjectAction({
      title: tpl.label,
      format: tpl.formatId,
      width: tpl.width,
      height: tpl.height,
      pages: instantiateTemplate(tpl),
    });
    setCreating(null);
    if (res.error || !res.data) {
      toast.error(res.error ?? "Failed to create");
      return;
    }
    router.push(`/canva/${res.data.id}`);
  }

  async function handleDuplicate(id: string) {
    const res = await duplicateCanvaProjectAction(id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Project duplicated");
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await deleteCanvaProjectAction(deleteTarget.id);
    setDeleteTarget(null);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Project deleted");
      router.refresh();
    }
  }

  async function handleImportPptx(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be re-selected
    setImporting(true);
    const toastId = toast.loading(`Importing "${file.name}"…`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/canva/import-pptx", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Import failed");
      toast.success("Import complete!", { id: toastId });
      router.push(`/canva/${json.projectId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed", { id: toastId });
    } finally {
      setImporting(false);
    }
  }

  async function handleToggleStar(e: React.MouseEvent, p: ProjectListItem) {
    e.stopPropagation();
    const next = !starredMap[p.id];
    setStarredMap((m) => ({ ...m, [p.id]: next }));
    const res = await toggleCanvaProjectStarAction(p.id, next);
    if ("error" in res && res.error) {
      setStarredMap((m) => ({ ...m, [p.id]: !next }));
      toast.error(res.error as string);
    }
  }

  const visibleProjects = viewFilter === "starred"
    ? projects.filter((p) => starredMap[p.id])
    : projects;

  return (
    <div className="p-4 md:p-6">
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} precedence="default" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-surface-900">Canva Project</h1>
          <p className="text-xs text-surface-500">Design social posts, presentations, docs, whiteboards, and more</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".pptx"
            className="hidden"
            onChange={handleImportPptx}
          />
          <Button
            variant="outline"
            disabled={importing}
            onClick={() => importInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            {importing ? "Importing…" : "Import PPTX"}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Design
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      {projects.length > 0 && (
        <div className="flex gap-1 mb-4">
          {(["all", "starred"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setViewFilter(f)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                viewFilter === f
                  ? "bg-brand-50 text-brand-700 border border-brand-200"
                  : "text-surface-500 hover:bg-surface-100 border border-transparent"
              )}
            >
              {f === "starred" && <Star className="w-3.5 h-3.5" />}
              {f === "all" ? "All designs" : "Starred"}
              {f === "starred" && (
                <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 ml-0.5">
                  {Object.values(starredMap).filter(Boolean).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 text-center py-24 border-2 border-dashed border-surface-200 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center">
            <Palette className="w-8 h-8 text-surface-400" />
          </div>
          <p className="text-sm font-medium text-surface-600">No designs yet</p>
          <p className="text-xs text-surface-400">Start from a template or a blank canvas</p>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Create your first design
          </Button>
        </div>
      ) : visibleProjects.length === 0 ? (
        <div className="flex flex-col items-center gap-2 text-center py-16 border-2 border-dashed border-surface-200 rounded-2xl">
          <Star className="w-8 h-8 text-surface-300" />
          <p className="text-sm font-medium text-surface-600">No starred designs</p>
          <p className="text-xs text-surface-400">Click the star on any design card to favourite it</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visibleProjects.map((p) => (
            <div
              key={p.id}
              className="group rounded-xl border border-surface-200 bg-white overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/canva/${p.id}`)}
            >
              {/* Thumbnail */}
              <div className="relative bg-surface-100 flex items-center justify-center overflow-hidden" style={{ height: 160 }}>
                {p.pages[0] ? (
                  <PageRenderer
                    page={p.pages[0]}
                    width={p.width}
                    height={p.height}
                    displayWidth={Math.min(220, (160 * p.width) / p.height)}
                    className="shadow-sm"
                  />
                ) : (
                  <Palette className="w-8 h-8 text-surface-300" />
                )}
                {/* Star overlay — always visible when starred, hover-visible otherwise */}
                <button
                  type="button"
                  title={starredMap[p.id] ? "Remove from starred" : "Add to starred"}
                  onClick={(e) => handleToggleStar(e, p)}
                  className={cn(
                    "absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all",
                    starredMap[p.id]
                      ? "bg-amber-400/90 text-white opacity-100"
                      : "bg-white/70 text-surface-400 opacity-60 hover:opacity-100 hover:text-amber-500"
                  )}
                >
                  <Star className={cn("w-3.5 h-3.5", starredMap[p.id] && "fill-current")} />
                </button>
              </div>

              <div className="p-3">
                <p className="text-sm font-medium text-surface-900 truncate">{p.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-surface-400">
                    {p.pages.length} page{p.pages.length === 1 ? "" : "s"} · {p.width}×{p.height}
                  </p>
                  <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      title="Duplicate"
                      onClick={() => handleDuplicate(p.id)}
                      className="p-1.5 rounded text-surface-500 hover:text-surface-700 hover:bg-surface-100"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => setDeleteTarget(p)}
                      className="p-1.5 rounded text-surface-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent title="Create a design" className="sm:max-w-[min(56rem,calc(100vw-2rem))]">
          <div className="flex gap-1 rounded-lg bg-surface-100 p-0.5 mb-4 mt-2 w-fit">
            {([
              { v: "templates", l: "Templates" },
              { v: "blank", l: "Blank Canvas" },
            ] as const).map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => setTab(v)}
                className={cn(
                  "px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
                  tab === v ? "bg-white text-surface-900 shadow-sm" : "text-surface-500 hover:text-surface-700"
                )}
              >
                {l}
              </button>
            ))}
          </div>

          {tab === "blank" ? (
            <>
            <div className="rounded-xl border border-surface-200 p-3 mb-3">
              <p className="text-xs font-semibold text-surface-700 mb-2">Custom size</p>
              <div className="flex flex-wrap items-center gap-2">
                <input type="number" min={50} max={8000} value={customW} onChange={(e) => setCustomW(e.target.value)} className="w-24 rounded-lg border border-surface-200 px-2 py-1.5 text-sm" placeholder="Width" />
                <span className="text-surface-400 text-sm">×</span>
                <input type="number" min={50} max={8000} value={customH} onChange={(e) => setCustomH(e.target.value)} className="w-24 rounded-lg border border-surface-200 px-2 py-1.5 text-sm" placeholder="Height" />
                <span className="text-xs text-surface-400">px</span>
                <div className="flex-1" />
                <Button size="sm" disabled={creating !== null} onClick={createCustom}>
                  {creating === "custom" ? "Creating…" : "Create"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {CANVA_FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  disabled={creating !== null}
                  onClick={() => createBlank(f.id)}
                  className="rounded-xl border border-surface-200 p-3 text-left hover:border-brand-400 hover:bg-brand-50/40 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center justify-center h-20 mb-2">
                    <div
                      className="bg-surface-200 rounded"
                      style={{
                        width: f.width >= f.height ? 72 : (72 * f.width) / f.height,
                        height: f.width >= f.height ? (72 * f.height) / f.width : 72,
                      }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-surface-800">{creating === f.id ? "Creating…" : f.label}</p>
                  <p className="text-[10px] text-surface-400">{f.width} × {f.height} px · {f.category}</p>
                </button>
              ))}
            </div>
            </>
          ) : (
            <div className="space-y-5">
              {[...templatesByCategory.entries()].map(([category, tpls]) => (
                <div key={category}>
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">{category}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {tpls.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        disabled={creating !== null}
                        onClick={() => createFromTemplate(tpl)}
                        className="rounded-xl border border-surface-200 overflow-hidden text-left hover:border-brand-400 transition-colors disabled:opacity-50"
                      >
                        <div className="bg-surface-100 flex items-center justify-center p-2 overflow-hidden" style={{ height: 120 }}>
                          <PageRenderer
                            page={{ id: "tpl", background: tpl.pages[0].background, elements: tpl.pages[0].elements.map((el, i) => ({ ...el, id: `t${i}` })) }}
                            width={tpl.width}
                            height={tpl.height}
                            displayWidth={Math.min(150, (104 * tpl.width) / tpl.height)}
                            className="shadow-sm"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-semibold text-surface-800">{creating === tpl.id ? "Creating…" : tpl.label}</p>
                          <p className="text-[10px] text-surface-400">
                            {tpl.pages.length} page{tpl.pages.length === 1 ? "" : "s"} · {tpl.width}×{tpl.height}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete design?"
        message={`"${deleteTarget?.title}" will be deleted. This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
