"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Copy, Trash2, Palette } from "lucide-react";
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

  return (
    <div className="p-4 md:p-6">
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} precedence="default" />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-surface-900">Canva Project</h1>
          <p className="text-xs text-surface-500">Design social posts, presentations, docs, whiteboards, and more</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          Create Design
        </Button>
      </div>

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
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="group rounded-xl border border-surface-200 bg-white overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/canva/${p.id}`)}
            >
              <div className="bg-surface-100 flex items-center justify-center overflow-hidden" style={{ height: 160 }}>
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
