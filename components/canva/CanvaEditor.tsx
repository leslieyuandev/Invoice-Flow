"use client";

import { useState, useRef, useEffect, useCallback, useMemo, useReducer } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Download, Save, X,
  LayoutTemplate, Shapes, Type, ImagePlus, PaintBucket, Plus, Copy, Trash2,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, ChevronUp, ChevronDown,
  Minus, Grid3x3, Loader2,
  Underline, Strikethrough, List, SlidersHorizontal, Scaling, Lock,
  Link2, Paintbrush, ClipboardPaste, Search, ChevronRight, Layers, AlignVerticalJustifyCenter, Accessibility,
  FlipHorizontal, FlipVertical, Crop, Sparkles, Sun, Wand2, Move, FileType, FileImage, Eraser, Group, Ungroup,
  Play, RotateCcw, PenTool, Check, ChevronLeft,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FontBrowserPanel } from "./FontPicker";
import { FILTER_PRESETS, SHADOW_PRESETS, IMAGE_EFFECTS } from "./imagePresets";
import { SHAPES, SHAPE_GROUPS, shapeElement } from "./shapes";
import { EMOJI_GRAPHICS, SVG_GRAPHICS, type SvgGraphic } from "./graphics";
import { FRAMES, FRAME_GROUPS, type FrameDef } from "./frames";
import { BALLOON_PRESETS, BALLOON_TEMPLATES, applyBalloonColors } from "./balloons";
import { injectCustomFont, ensureGoogleFont, familyFromCss } from "./fonts";
import type { CanvaAsset } from "@/types/canva";
import { deleteCanvaAssetAction } from "@/actions/canva";
import { MagicEraserModal } from "./MagicEraserModal";
import { MagicLayersModal } from "./MagicLayersModal";
import { PixelEraserModal } from "./PixelEraserModal";
import { AnimationPanel } from "./AnimationPanel";
import { DriveBrowser } from "./DriveBrowser";

// Rounded-corner indicator icon
function CornerRadiusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 19v-7a7 7 0 0 1 7-7h7" />
    </svg>
  );
}
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { saveCanvaProjectAction } from "@/actions/canva";
import { ElementView, PageRenderer, getAnimKeyframeName, getAnimDuration } from "./PageRenderer";
import { CANVA_TEMPLATES, instantiateTemplate } from "./templates";
import { uid, newPage, CANVA_FORMATS, type CanvaElement, type CanvaPage, type CanvaProjectData, type ElementAnimation } from "@/types/canva";

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Poppins:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Noto+Sans+SC:wght@400;700&family=Ma+Shan+Zheng&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Dancing+Script:wght@600&family=Bebas+Neue&display=swap";

const BG_SWATCHES = [
  "#ffffff", "#f8f9fa", "#1a1a1a", "#10222e", "#101820", "#0f3d3e",
  "#fde7ef", "#f6b6cd", "#fff3b0", "#f7c948", "#c8e6c9", "#bbdefb",
  "#d1c4e9", "#b71c1c", "#1c1430", "#fdf8f2", "#fafaf7", "#e0f2f1",
];

type PanelTab = "design" | "elements" | "text" | "uploads" | "background";
type DragMode = "move" | "resize" | "rotate" | "group-resize";

interface DragState {
  mode: DragMode;
  id: string;
  startX: number;
  startY: number;
  orig: CanvaElement;
  handle: [number, number];
  pushed: boolean;
  group?: { id: string; x: number; y: number }[]; // move: original positions of all selected
  groupResize?: { bbox: { x: number; y: number; w: number; h: number }; els: CanvaElement[] };
}


interface CtxMenuState {
  x: number;
  y: number;
  elId: string;
}

interface CropDragState {
  mode: "pan" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
  startX: number;
  startY: number;
  startCropX: number;
  startCropY: number;
  startCropW: number;
  startCropH: number;
}

interface HistoryEntry {
  pages: CanvaPage[];
  w: number;
  h: number;
}

export function CanvaEditor({
  project,
  imageAssets,
  fontAssets,
}: {
  project: CanvaProjectData;
  imageAssets: CanvaAsset[];
  fontAssets: CanvaAsset[];
}) {
  const [dims, setDims] = useState({ w: project.width, h: project.height });
  const W = dims.w;
  const H = dims.h;

  const [title, setTitle] = useState(project.title);
  const [pages, setPages] = useState<CanvaPage[]>(project.pages.length ? project.pages : [newPage()]);
  const [pageIdx, setPageIdx] = useState(0);
  // Multi-selection is the source of truth; selectedId is the single-selection view.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const setSelectedId = useCallback((id: string | null) => setSelectedIds(id ? [id] : []), []);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.5);
  const [panel, setPanel] = useState<PanelTab>("design");
  const [panelOpen, setPanelOpen] = useState(true);
  const [elementsTab, setElementsTab] = useState<"shapes" | "graphics" | "frames">("shapes");
  const [graphicsCat, setGraphicsCat] = useState<string>("");
  const [balloonPresetIdx, setBalloonPresetIdx] = useState(0);
  const [graphicsSearch, setGraphicsSearch] = useState("");
  const [imgAssets, setImgAssets] = useState<CanvaAsset[]>(imageAssets);
  const [fonts, setFonts] = useState<CanvaAsset[]>(fontAssets);
  const [uploading, setUploading] = useState(false);
  const [uploadingFont, setUploadingFont] = useState(false);
  const [uploadsTab, setUploadsTab] = useState<"uploads" | "drive">("uploads");
  // Triggers re-render (updating portal chrome position) when viewport is scrolled
  const [, vpScrollTick] = useReducer((n: number) => n + 1, 0);
  const [bgRemoving, setBgRemoving] = useState<string | null>(null);
  // Tool panel rendered in the LEFT sidebar (replaces the icon-rail panel while set)
  const [toolPanel, setToolPanel] = useState<"fonts" | "adjust" | "filters" | "crop" | "effects" | "position" | "animate" | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"pdf" | "png" | "jpg">("pdf");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [pageOver, setPageOver] = useState<number | null>(null);
  const [draggingPageId, setDraggingPageId] = useState<string | null>(null);
  const pageDragRef = useRef<{ from: number; startX: number; moved: boolean } | null>(null);
  const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({ v: null, h: null });
  const [showGrid, setShowGrid] = useState(false);
  const [exportingAs, setExportingAs] = useState<"png" | "jpg" | "pdf" | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving">("saved");
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState | null>(null);
  // Spacing popover is keyed to the element id so it auto-closes when selection changes
  const [spacingFor, setSpacingFor] = useState<string | null>(null);
  const [resizeOpen, setResizeOpen] = useState(false);
  const [resizeSearch, setResizeSearch] = useState("");
  const [customW, setCustomW] = useState(String(project.width));
  const [customH, setCustomH] = useState(String(project.height));
  const [scaleOnResize, setScaleOnResize] = useState(true);
  // Present mode
  const [presentMode, setPresentMode] = useState(false);
  const [presentIdx, setPresentIdx] = useState(0);
  // Frame Maker
  const [showFrameMaker, setShowFrameMaker] = useState(false);
  const [fmPts, setFmPts] = useState<{ x: number; y: number }[]>([
    { x: 0.5, y: 0.0 }, { x: 1.0, y: 1.0 }, { x: 0.0, y: 1.0 },
  ]);
  const [fmGridSnap, setFmGridSnap] = useState(true);
  const [fmGridCols, setFmGridCols] = useState(14);
  const [fmDraggingPt, setFmDraggingPt] = useState<number | null>(null);
  // Crop drag ref
  const cropDragRef = useRef<CropDragState | null>(null);
  // Natural aspect ratio (naturalW/naturalH) of the image currently being cropped,
  // so the crop image rect is always kept undistorted.
  const cropNaturalRef = useRef<{ id: string; ratio: number } | null>(null);
  // Magic eraser
  const [eraserEl, setEraserEl] = useState<CanvaElement | null>(null);
  // Pixel eraser
  const [pixelEraserEl, setPixelEraserEl] = useState<CanvaElement | null>(null);
  const [eraserDropOpen, setEraserDropOpen] = useState(false);
  const eraserBtnRef = useRef<HTMLButtonElement>(null);
  const [eraserDropPos, setEraserDropPos] = useState<{ top: number; left: number } | null>(null);
  const [cropTab, setCropTab] = useState<"crop" | "expand">("crop");
  const [animPreviewVersion, setAnimPreviewVersion] = useState<Record<string, number>>({});
  // Magic layers
  const [magicLayersEl, setMagicLayersEl] = useState<CanvaElement | null>(null);
  // Frame drag-and-drop (HTML5 drops from panels + pointer-dragged canvas elements)
  const [frameDragOver, setFrameDragOver] = useState<string | null>(null);
  // Frame hovered while pointer-dragging an image element across the canvas
  const frameHoverRef = useRef<string | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const undoStack = useRef<HistoryEntry[]>([]);
  const redoStack = useRef<HistoryEntry[]>([]);
  const clipboard = useRef<CanvaElement | null>(null);
  const styleClipboard = useRef<Partial<CanvaElement> | null>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const pageIdxRef = useRef(pageIdx);
  pageIdxRef.current = pageIdx;
  const dimsRef = useRef(dims);
  dimsRef.current = dims;
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  const page = pages[Math.min(pageIdx, pages.length - 1)];
  const selected = useMemo(
    () => page.elements.find((e) => e.id === selectedId) ?? null,
    [page, selectedId]
  );
  const selectedEls = useMemo(() => page.elements.filter((e) => selectedIds.includes(e.id)), [page, selectedIds]);
  const selectionBBox = useMemo(() => {
    if (selectedEls.length === 0) return null;
    const x1 = Math.min(...selectedEls.map((e) => e.x));
    const y1 = Math.min(...selectedEls.map((e) => e.y));
    const x2 = Math.max(...selectedEls.map((e) => e.x + e.w));
    const y2 = Math.max(...selectedEls.map((e) => e.y + e.h));
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }, [selectedEls]);

  // ── Fit zoom on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    fitZoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Crop: capture the image's natural aspect ratio and cover-fit on entry ────
  useEffect(() => {
    if (toolPanel !== "crop" || !selected || !selected.src) return;
    const id = selected.id;
    const img = new window.Image();
    img.onload = () => {
      const ratio = img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
      cropNaturalRef.current = { id, ratio };
      const cur = pagesRef.current[pageIdxRef.current].elements.find((x) => x.id === id);
      if (cur && cur.cropW === undefined) {
        patchEl(id, coverRect(cur.w, cur.h, ratio));
      }
    };
    img.src = selected.src;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolPanel, selected?.id, selected?.src]);

  // Register uploaded custom fonts so they render and export
  useEffect(() => {
    fonts.forEach((f) => injectCustomFont(f.name, f.url));
  }, [fonts]);

  // Load any Google fonts referenced by the saved design (custom fonts handled above)
  useEffect(() => {
    const customNames = new Set(fonts.map((f) => f.name));
    const families = new Set<string>();
    for (const p of pagesRef.current) {
      for (const el of p.elements) {
        if (el.type === "text" && el.fontFamily) families.add(familyFromCss(el.fontFamily));
      }
    }
    families.forEach((fam) => { if (!customNames.has(fam)) ensureGoogleFont(fam); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fitZoom() {
    const vp = viewportRef.current;
    if (!vp) return;
    const z = Math.min((vp.clientWidth - 120) / W, (vp.clientHeight - 120) / H, 1);
    setZoom(Math.max(0.05, Math.round(z * 100) / 100));
  }

  function setZoomCentered(newZoom: number) {
    const vp = viewportRef.current;
    if (vp) {
      const prevZ = zoomRef.current;
      const ratio = newZoom / prevZ;
      requestAnimationFrame(() => {
        vp.scrollLeft = (vp.scrollLeft + vp.clientWidth / 2) * ratio - vp.clientWidth / 2;
        vp.scrollTop = (vp.scrollTop + vp.clientHeight / 2) * ratio - vp.clientHeight / 2;
      });
    }
    setZoom(newZoom);
  }

  // ── History ─────────────────────────────────────────────────────────────────
  const snapshot = useCallback((): HistoryEntry => ({
    pages: JSON.parse(JSON.stringify(pagesRef.current)),
    w: dimsRef.current.w,
    h: dimsRef.current.h,
  }), []);

  const pushHistory = useCallback(() => {
    undoStack.current.push(snapshot());
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
    setSaveState("dirty");
  }, [snapshot]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(snapshot());
    setPages(prev.pages);
    setDims({ w: prev.w, h: prev.h });
    setSelectedId(null);
    setEditingId(null);
    setSaveState("dirty");
  }, [snapshot]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(snapshot());
    setPages(next.pages);
    setDims({ w: next.w, h: next.h });
    setSelectedId(null);
    setSaveState("dirty");
  }, [snapshot]);

  // ── Mutation helpers ────────────────────────────────────────────────────────
  const setPageAt = useCallback((idx: number, fn: (p: CanvaPage) => CanvaPage) => {
    setPages((ps) => ps.map((p, i) => (i === idx ? fn(p) : p)));
    setSaveState("dirty");
  }, []);

  const patchEl = useCallback(
    (id: string, patch: Partial<CanvaElement>) => {
      setPageAt(pageIdxRef.current, (p) => ({
        ...p,
        elements: p.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
    },
    [setPageAt]
  );

  // Toolbar property change — single history push per change burst
  const commitPatch = useCallback(
    (id: string, patch: Partial<CanvaElement>) => {
      pushHistory();
      patchEl(id, patch);
    },
    [pushHistory, patchEl]
  );

  const addElement = useCallback(
    (el: Omit<CanvaElement, "id">) => {
      pushHistory();
      const id = uid();
      setPageAt(pageIdxRef.current, (p) => ({ ...p, elements: [...p.elements, { ...el, id }] }));
      setSelectedId(id);
    },
    [pushHistory, setPageAt]
  );

  const deleteSelected = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (!ids.length) return;
    pushHistory();
    setPageAt(pageIdxRef.current, (p) => ({ ...p, elements: p.elements.filter((e) => !ids.includes(e.id)) }));
    setSelectedIds([]);
    setEditingId(null);
  }, [pushHistory, setPageAt]);

  const duplicateSelected = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (!ids.length) return;
    const cur = pagesRef.current[pageIdxRef.current];
    const toDup = cur.elements.filter((e) => ids.includes(e.id));
    if (!toDup.length) return;
    pushHistory();
    const newIds: string[] = [];
    const clones = toDup.map((el) => { const id = uid(); newIds.push(id); return { ...el, id, x: el.x + 24, y: el.y + 24 }; });
    setPageAt(pageIdxRef.current, (p) => ({ ...p, elements: [...p.elements, ...clones] }));
    setSelectedIds(newIds);
  }, [pushHistory, setPageAt]);

  const groupSelected = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (ids.length < 2) return;
    pushHistory();
    const gid = uid();
    setPageAt(pageIdxRef.current, (p) => ({ ...p, elements: p.elements.map((e) => (ids.includes(e.id) ? { ...e, groupId: gid } : e)) }));
  }, [pushHistory, setPageAt]);

  const ungroupSelected = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (!ids.length) return;
    pushHistory();
    setPageAt(pageIdxRef.current, (p) => ({ ...p, elements: p.elements.map((e) => (ids.includes(e.id) ? { ...e, groupId: undefined } : e)) }));
  }, [pushHistory, setPageAt]);

  const alignSelected = useCallback((where: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    const ids = selectedIdsRef.current;
    if (ids.length < 2) return;
    const els = pagesRef.current[pageIdxRef.current].elements.filter((e) => ids.includes(e.id));
    const bx = Math.min(...els.map((e) => e.x));
    const by = Math.min(...els.map((e) => e.y));
    const bw = Math.max(...els.map((e) => e.x + e.w)) - bx;
    const bh = Math.max(...els.map((e) => e.y + e.h)) - by;
    pushHistory();
    setPageAt(pageIdxRef.current, (p) => ({
      ...p,
      elements: p.elements.map((el) => {
        if (!ids.includes(el.id)) return el;
        const patch: Partial<CanvaElement> = {};
        if (where === "left") patch.x = bx;
        if (where === "center") patch.x = Math.round(bx + (bw - el.w) / 2);
        if (where === "right") patch.x = bx + bw - el.w;
        if (where === "top") patch.y = by;
        if (where === "middle") patch.y = Math.round(by + (bh - el.h) / 2);
        if (where === "bottom") patch.y = by + bh - el.h;
        return { ...el, ...patch };
      }),
    }));
  }, [pushHistory, setPageAt]);

  const moveLayer = useCallback(
    (dir: 1 | -1) => {
      if (!selectedId) return;
      pushHistory();
      setPageAt(pageIdxRef.current, (p) => {
        const i = p.elements.findIndex((e) => e.id === selectedId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= p.elements.length) return p;
        const els = [...p.elements];
        [els[i], els[j]] = [els[j], els[i]];
        return { ...p, elements: els };
      });
    },
    [selectedId, pushHistory, setPageAt]
  );

  const moveLayerToEnd = useCallback(
    (front: boolean) => {
      if (!selectedId) return;
      pushHistory();
      setPageAt(pageIdxRef.current, (p) => {
        const el = p.elements.find((e) => e.id === selectedId);
        if (!el) return p;
        const rest = p.elements.filter((e) => e.id !== selectedId);
        return { ...p, elements: front ? [...rest, el] : [el, ...rest] };
      });
    },
    [selectedId, pushHistory, setPageAt]
  );

  const alignToPage = useCallback(
    (where: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      const el = pagesRef.current[pageIdxRef.current].elements.find((e) => e.id === selectedId);
      if (!el) return;
      const { w, h } = dimsRef.current;
      const patch: Partial<CanvaElement> = {};
      if (where === "left") patch.x = 0;
      if (where === "center") patch.x = Math.round((w - el.w) / 2);
      if (where === "right") patch.x = w - el.w;
      if (where === "top") patch.y = 0;
      if (where === "middle") patch.y = Math.round((h - el.h) / 2);
      if (where === "bottom") patch.y = h - el.h;
      commitPatch(el.id, patch);
    },
    [selectedId, commitPatch]
  );

  const STYLE_KEYS: (keyof CanvaElement)[] = [
    "fontSize", "fontFamily", "fontWeight", "fontStyle", "textAlign", "lineHeight",
    "letterSpacing", "color", "underline", "strike", "textTransform", "effect",
    "effectColor", "fill", "stroke", "strokeWidth", "radius", "opacity",
  ];

  const copyStyle = useCallback(() => {
    const el = pagesRef.current[pageIdxRef.current].elements.find((e) => e.id === selectedId);
    if (!el) return;
    const style: Partial<CanvaElement> = {};
    for (const k of STYLE_KEYS) {
      if (el[k] !== undefined) (style as Record<string, unknown>)[k] = el[k];
    }
    styleClipboard.current = style;
    toast.success("Style copied — select another element and choose Paste style");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const pasteStyle = useCallback(() => {
    if (!selectedId || !styleClipboard.current) return;
    commitPatch(selectedId, styleClipboard.current);
  }, [selectedId, commitPatch]);

  const toggleLock = useCallback(() => {
    const el = pagesRef.current[pageIdxRef.current].elements.find((e) => e.id === selectedId);
    if (!el) return;
    commitPatch(el.id, { locked: !el.locked });
  }, [selectedId, commitPatch]);

  const editLink = useCallback(() => {
    const el = pagesRef.current[pageIdxRef.current].elements.find((e) => e.id === selectedId);
    if (!el) return;
    const url = window.prompt("Link URL (leave empty to remove):", el.link ?? "");
    if (url === null) return;
    commitPatch(el.id, { link: url.trim() || undefined });
  }, [selectedId, commitPatch]);

  const editAltText = useCallback(() => {
    const el = pagesRef.current[pageIdxRef.current].elements.find((e) => e.id === selectedId);
    if (!el) return;
    const alt = window.prompt("Alternative text (describes this element for accessibility):", el.altText ?? "");
    if (alt === null) return;
    commitPatch(el.id, { altText: alt.trim() || undefined });
  }, [selectedId, commitPatch]);

  const toggleBullets = useCallback(() => {
    const el = pagesRef.current[pageIdxRef.current].elements.find((e) => e.id === selectedId);
    if (!el || el.type !== "text") return;
    const lines = (el.text ?? "").split("\n");
    const isList = lines.filter((l) => l.trim()).every((l) => l.trimStart().startsWith("• "));
    const next = lines
      .map((l) => {
        if (!l.trim()) return l;
        return isList ? l.replace(/^(\s*)• /, "$1") : l.trimStart().startsWith("• ") ? l : `• ${l}`;
      })
      .join("\n");
    commitPatch(el.id, { text: next });
  }, [selectedId, commitPatch]);

  const cycleCase = useCallback(() => {
    const el = pagesRef.current[pageIdxRef.current].elements.find((e) => e.id === selectedId);
    if (!el || el.type !== "text") return;
    const order: NonNullable<CanvaElement["textTransform"]>[] = ["none", "uppercase", "capitalize"];
    const cur = el.textTransform ?? "none";
    const next = order[(order.indexOf(cur) + 1) % order.length];
    commitPatch(el.id, { textTransform: next });
  }, [selectedId, commitPatch]);

  const applyResize = useCallback(
    (newW: number, newH: number, scaleElements: boolean) => {
      newW = Math.max(50, Math.min(8000, Math.round(newW)));
      newH = Math.max(50, Math.min(8000, Math.round(newH)));
      const { w: oldW, h: oldH } = dimsRef.current;
      if (newW === oldW && newH === oldH) {
        setResizeOpen(false);
        return;
      }
      pushHistory();
      if (scaleElements) {
        const fx = newW / oldW;
        const fy = newH / oldH;
        const fu = Math.min(fx, fy);
        setPages((ps) =>
          ps.map((p) => ({
            ...p,
            elements: p.elements.map((el) => ({
              ...el,
              x: Math.round(el.x * fx),
              y: Math.round(el.y * fy),
              w: Math.max(10, Math.round(el.w * fu)),
              h: Math.max(10, Math.round(el.h * fu)),
              fontSize: el.fontSize ? Math.max(6, Math.round(el.fontSize * fu)) : el.fontSize,
              strokeWidth: el.strokeWidth ? Math.max(1, Math.round(el.strokeWidth * fu)) : el.strokeWidth,
              radius: el.radius ? Math.round(el.radius * fu) : el.radius,
            })),
          }))
        );
      }
      setDims({ w: newW, h: newH });
      setSaveState("dirty");
      setResizeOpen(false);
      setTimeout(() => {
        const vp = viewportRef.current;
        if (!vp) return;
        const z = Math.min((vp.clientWidth - 120) / newW, (vp.clientHeight - 120) / newH, 1);
        setZoom(Math.max(0.05, Math.round(z * 100) / 100));
      }, 50);
      toast.success(`Canvas resized to ${newW} × ${newH}px`);
    },
    [pushHistory]
  );

  // ── Drag / resize / rotate ──────────────────────────────────────────────────
  const onElementPointerDown = useCallback(
    (el: CanvaElement, e: React.PointerEvent) => {
      if (editingId === el.id) return; // editing text — let the textarea handle it
      e.stopPropagation();
      e.preventDefault();
      setEditingId(null);
      setCtxMenu(null);

      const additive = e.shiftKey || e.metaKey || e.ctrlKey;
      const els = pagesRef.current[pageIdxRef.current].elements;
      const mates = el.groupId ? els.filter((x) => x.groupId === el.groupId).map((x) => x.id) : [el.id];

      // Resolve the resulting selection synchronously so the drag can capture group origins
      let nextSel: string[];
      const cur = selectedIdsRef.current;
      if (additive) {
        nextSel = cur.includes(el.id) ? cur.filter((id) => !mates.includes(id)) : [...new Set([...cur, ...mates])];
      } else if (cur.includes(el.id)) {
        nextSel = cur; // keep multi-selection so the whole group can be dragged
      } else {
        nextSel = mates;
      }
      setSelectedIds(nextSel);

      // Close a tool panel that doesn't apply to the newly selected element
      setToolPanel((tp) => {
        if (!tp || tp === "position") return tp;
        if (tp === "fonts") return el.type === "text" && nextSel.length === 1 ? tp : null;
        return el.type === "image" && nextSel.length === 1 ? tp : null;
      });
      if (el.locked) return; // selectable (to unlock) but not movable

      const groupOrigins = els.filter((x) => nextSel.includes(x.id) && !x.locked).map((x) => ({ id: x.id, x: x.x, y: x.y }));
      dragRef.current = {
        mode: "move",
        id: el.id,
        startX: e.clientX,
        startY: e.clientY,
        orig: { ...el },
        handle: [0, 0],
        pushed: false,
        group: groupOrigins.length > 1 ? groupOrigins : undefined,
      };
      attachDragListeners();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingId]
  );

  // Group bounding-box resize handle
  const onGroupHandlePointerDown = useCallback((handle: [number, number], e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const bbox = selectionBBox;
    if (!bbox) return;
    const els = pagesRef.current[pageIdxRef.current].elements.filter((x) => selectedIdsRef.current.includes(x.id));
    dragRef.current = {
      mode: "group-resize",
      id: "__group__",
      startX: e.clientX,
      startY: e.clientY,
      orig: els[0],
      handle,
      pushed: false,
      groupResize: { bbox, els: els.map((x) => ({ ...x })) },
    };
    attachDragListeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionBBox]);

  const onHandlePointerDown = useCallback((el: CanvaElement, handle: [number, number], e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = {
      mode: "resize",
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...el },
      handle,
      pushed: false,
    };
    attachDragListeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRotatePointerDown = useCallback((el: CanvaElement, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = {
      mode: "rotate",
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...el },
      handle: [0, 0],
      pushed: false,
    };
    attachDragListeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function attachDragListeners() {
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onDragEnd);
  }

  // ── Crop drag (visual crop overlay) ─────────────────────────────────────────
  // Compute an image rect (cropX/Y/W/H) that COVERS a frame of fw×fh while keeping
  // the image's natural aspect ratio (ratio = naturalW/naturalH), centred.
  function coverRect(fw: number, fh: number, ratio: number) {
    const frameRatio = fw / fh;
    let cw: number, ch: number;
    if (ratio > frameRatio) { ch = fh; cw = fh * ratio; }
    else { cw = fw; ch = fw / ratio; }
    return { cropX: (fw - cw) / 2, cropY: (fh - ch) / 2, cropW: cw, cropH: ch };
  }

  function cropRatioFor(el: CanvaElement): number {
    if (cropNaturalRef.current?.id === el.id) return cropNaturalRef.current.ratio;
    if (el.cropW && el.cropH) return el.cropW / el.cropH;
    return el.w / el.h;
  }

  function startCropDrag(
    e: React.PointerEvent,
    mode: CropDragState["mode"],
    el: CanvaElement,
  ) {
    e.stopPropagation();
    e.preventDefault();
    const ratio = cropRatioFor(el);
    const cropX = el.cropX ?? 0;
    const cropY = el.cropY ?? 0;
    const cropW = el.cropW ?? el.w;
    const cropH = el.cropH ?? el.w / ratio;
    pushHistory();
    cropDragRef.current = {
      mode, startX: e.clientX, startY: e.clientY,
      startCropX: cropX, startCropY: cropY, startCropW: cropW, startCropH: cropH,
    };
    window.addEventListener("pointermove", onCropDragMove);
    window.addEventListener("pointerup", onCropDragEnd);
  }

  function onCropDragMove(e: PointerEvent) {
    const d = cropDragRef.current;
    const selId = selectedIdsRef.current[0];
    if (!d || !selId) return;
    const sel = pagesRef.current[pageIdxRef.current].elements.find((x) => x.id === selId);
    if (!sel) return;
    const dx = (e.clientX - d.startX) / zoomRef.current;
    const dy = (e.clientY - d.startY) / zoomRef.current;
    const ratio = d.startCropW / d.startCropH; // locked image ratio (never distort)

    if (d.mode === "pan") {
      // Pan only — keep the image covering the frame (no empty gaps).
      let newX = d.startCropX + dx;
      let newY = d.startCropY + dy;
      newX = Math.min(0, Math.max(sel.w - d.startCropW, newX));
      newY = Math.min(0, Math.max(sel.h - d.startCropH, newY));
      patchEl(selId, { cropX: newX, cropY: newY });
      return;
    }

    // Resize — scale the image uniformly (ratio-locked) so it never stretches.
    let newW = d.startCropW;
    if (d.mode === "e" || d.mode === "ne" || d.mode === "se") newW = d.startCropW + dx;
    else if (d.mode === "w" || d.mode === "nw" || d.mode === "sw") newW = d.startCropW - dx;
    else if (d.mode === "s") newW = (d.startCropH + dy) * ratio;
    else if (d.mode === "n") newW = (d.startCropH - dy) * ratio;

    // Never shrink below the size needed to cover the frame.
    const minW = Math.max(sel.w, sel.h * ratio);
    newW = Math.max(minW, newW);
    const newH = newW / ratio;

    // Anchor the side/corner opposite the handle so resize feels natural.
    let newX = d.startCropX;
    let newY = d.startCropY;
    if (d.mode === "w" || d.mode === "nw" || d.mode === "sw") newX = d.startCropX + (d.startCropW - newW);
    else if (d.mode === "n" || d.mode === "s") newX = d.startCropX + (d.startCropW - newW) / 2;
    if (d.mode === "n" || d.mode === "ne" || d.mode === "nw") newY = d.startCropY + (d.startCropH - newH);
    else if (d.mode === "e" || d.mode === "w") newY = d.startCropY + (d.startCropH - newH) / 2;

    // Clamp so the frame stays fully covered.
    newX = Math.min(0, Math.max(sel.w - newW, newX));
    newY = Math.min(0, Math.max(sel.h - newH, newY));
    patchEl(selId, { cropX: newX, cropY: newY, cropW: newW, cropH: newH });
  }

  function onCropDragEnd() {
    cropDragRef.current = null;
    window.removeEventListener("pointermove", onCropDragMove);
    window.removeEventListener("pointerup", onCropDragEnd);
  }

  const onDragMove = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const z = zoomRef.current;
      const dx = (e.clientX - d.startX) / z;
      const dy = (e.clientY - d.startY) / z;
      if (!d.pushed && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
        pushHistory();
        d.pushed = true;
      }
      if (!d.pushed) return;

      const el = d.orig;

      if (d.mode === "move") {
        let nx = el.x + dx;
        let ny = el.y + dy;
        let gv: number | null = null;
        let gh: number | null = null;

        if (!e.altKey) {
          const thr = 6 / z;
          const cx = nx + el.w / 2;
          const cy = ny + el.h / 2;
          if (Math.abs(cx - W / 2) < thr) { nx = W / 2 - el.w / 2; gv = W / 2; }
          else if (Math.abs(nx) < thr) { nx = 0; gv = 0; }
          else if (Math.abs(nx + el.w - W) < thr) { nx = W - el.w; gv = W; }
          if (Math.abs(cy - H / 2) < thr) { ny = H / 2 - el.h / 2; gh = H / 2; }
          else if (Math.abs(ny) < thr) { ny = 0; gh = 0; }
          else if (Math.abs(ny + el.h - H) < thr) { ny = H - el.h; gh = H; }
          if (showGrid && gv === null) nx = Math.round(nx / 10) * 10;
          if (showGrid && gh === null) ny = Math.round(ny / 10) * 10;
        }
        setGuides({ v: gv, h: gh });
        if (d.group) {
          const ddx = Math.round(nx) - el.x;
          const ddy = Math.round(ny) - el.y;
          setPageAt(pageIdxRef.current, (p) => ({
            ...p,
            elements: p.elements.map((e2) => {
              const o = d.group!.find((g) => g.id === e2.id);
              return o ? { ...e2, x: Math.round(o.x + ddx), y: Math.round(o.y + ddy) } : e2;
            }),
          }));
        } else {
          patchEl(d.id, { x: Math.round(nx), y: Math.round(ny) });
        }

        // Dragging a single image over a frame → highlight it as a drop target
        if (!d.group && el.type === "image" && el.src) {
          const pr = pageRef.current?.getBoundingClientRect();
          let hit: string | null = null;
          if (pr) {
            const px = (e.clientX - pr.left) / z;
            const py = (e.clientY - pr.top) / z;
            const frame = pagesRef.current[pageIdxRef.current].elements.find(
              (f) => f.type === "frame" && f.id !== d.id && !f.locked &&
                px >= f.x && px <= f.x + f.w && py >= f.y && py <= f.y + f.h
            );
            hit = frame?.id ?? null;
          }
          if (hit !== frameHoverRef.current) {
            frameHoverRef.current = hit;
            setFrameDragOver(hit);
          }
        }
      } else if (d.mode === "group-resize" && d.groupResize) {
        const { bbox, els: origEls } = d.groupResize;
        const [hx, hy] = d.handle;
        const anchorX = hx === 1 ? bbox.x : hx === -1 ? bbox.x + bbox.w : bbox.x + bbox.w / 2;
        const anchorY = hy === 1 ? bbox.y : hy === -1 ? bbox.y + bbox.h : bbox.y + bbox.h / 2;
        let sx = 1, sy = 1;
        if (hx !== 0) sx = Math.max(0.05, (bbox.w + dx * hx) / bbox.w);
        if (hy !== 0) sy = Math.max(0.05, (bbox.h + dy * hy) / bbox.h);
        if (hx !== 0 && hy !== 0) { const s = Math.max(sx, sy); sx = s; sy = s; }
        setPageAt(pageIdxRef.current, (p) => ({
          ...p,
          elements: p.elements.map((e2) => {
            const o = origEls.find((g) => g.id === e2.id);
            if (!o) return e2;
            const patch2: Partial<CanvaElement> = {
              x: Math.round(anchorX + (o.x - anchorX) * sx),
              y: Math.round(anchorY + (o.y - anchorY) * sy),
              w: Math.max(5, Math.round(o.w * sx)),
              h: Math.max(5, Math.round(o.h * sy)),
            };
            if (o.type === "text") patch2.fontSize = Math.max(6, Math.round((o.fontSize ?? 24) * Math.min(sx, sy)));
            return { ...e2, ...patch2 };
          }),
        }));
      } else if (d.mode === "resize") {
        const rad = (el.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const ldx = dx * cos + dy * sin;
        const ldy = -dx * sin + dy * cos;
        const [hx, hy] = d.handle;

        let newW = el.w;
        let newH = el.h;
        const patch: Partial<CanvaElement> = {};

        if (el.type === "text" && hx !== 0 && hy !== 0) {
          // Corner resize on text scales the font, Canva-style
          newW = Math.max(20, el.w + ldx * hx);
          const factor = newW / el.w;
          newH = el.h * factor;
          patch.fontSize = Math.max(6, Math.round((el.fontSize ?? 24) * factor));
        } else if (el.type === "image" && hx !== 0 && hy !== 0) {
          newW = Math.max(20, el.w + ldx * hx);
          newH = el.h * (newW / el.w);
        } else {
          if (hx !== 0) newW = Math.max(10, el.w + ldx * hx);
          if (hy !== 0) newH = Math.max(10, el.h + ldy * hy);
        }

        const dwA = newW - el.w;
        const dhA = newH - el.h;
        const dcxL = (hx * dwA) / 2;
        const dcyL = (hy * dhA) / 2;
        const gx = dcxL * cos - dcyL * sin;
        const gy = dcxL * sin + dcyL * cos;
        const cx0 = el.x + el.w / 2;
        const cy0 = el.y + el.h / 2;

        patchEl(d.id, {
          ...patch,
          w: Math.round(newW),
          h: Math.round(newH),
          x: Math.round(cx0 + gx - newW / 2),
          y: Math.round(cy0 + gy - newH / 2),
        });
      } else {
        // rotate
        const pr = pageRef.current?.getBoundingClientRect();
        if (!pr) return;
        const cxG = pr.left + (el.x + el.w / 2) * z;
        const cyG = pr.top + (el.y + el.h / 2) * z;
        let deg = (Math.atan2(e.clientY - cyG, e.clientX - cxG) * 180) / Math.PI + 90;
        deg = ((deg % 360) + 360) % 360;
        const nearest45 = Math.round(deg / 45) * 45;
        if (Math.abs(deg - nearest45) < 4) deg = nearest45 % 360;
        patchEl(d.id, { rotation: Math.round(deg) });
      }
    },
    [W, H, patchEl, pushHistory, showGrid]
  );

  const onDragEnd = useCallback(() => {
    const d = dragRef.current;
    const frameId = frameHoverRef.current;
    // Dropped a dragged image onto a frame → fill the frame, consume the image
    if (d && d.mode === "move" && d.orig.type === "image" && d.orig.src && frameId) {
      const src = d.orig.src;
      setPageAt(pageIdxRef.current, (p) => ({
        ...p,
        elements: p.elements
          .filter((e) => e.id !== d.id)
          .map((e) => (e.id === frameId ? { ...e, src, cropX: undefined, cropY: undefined, cropW: undefined, cropH: undefined } : e)),
      }));
      setSelectedIds([frameId]);
    }
    frameHoverRef.current = null;
    setFrameDragOver(null);
    dragRef.current = null;
    setGuides({ v: null, h: null });
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragEnd);
  }, [onDragMove, setPageAt]);

  // ── Marquee (rubber-band) selection on empty canvas ──────────────────────────
  const onMarqueeMove = useCallback((e: PointerEvent) => {
    const s = marqueeStart.current;
    const node = pageRef.current;
    if (!s || !node) return;
    const rect = node.getBoundingClientRect();
    const z = zoomRef.current;
    const cx = (e.clientX - rect.left) / z;
    const cy = (e.clientY - rect.top) / z;
    setMarquee({ x: Math.min(s.x, cx), y: Math.min(s.y, cy), w: Math.abs(cx - s.x), h: Math.abs(cy - s.y) });
  }, []);

  const onMarqueeUp = useCallback(() => {
    window.removeEventListener("pointermove", onMarqueeMove);
    window.removeEventListener("pointerup", onMarqueeUp);
    setMarquee((m) => {
      if (m && (m.w > 4 || m.h > 4)) {
        const hits = pagesRef.current[pageIdxRef.current].elements.filter(
          (el) => !el.locked && el.x < m.x + m.w && el.x + el.w > m.x && el.y < m.y + m.h && el.y + el.h > m.y
        );
        if (hits.length) setSelectedIds(hits.map((e) => e.id));
      }
      return null;
    });
    marqueeStart.current = null;
  }, [onMarqueeMove]);

  const onCanvasBackgroundPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return; // an element handled it
    e.preventDefault(); // prevent browser text/image drag-select (the blue highlight)
    e.stopPropagation();
    setEditingId(null);
    setCtxMenu(null);
    if (!(e.shiftKey || e.metaKey || e.ctrlKey)) setSelectedIds([]);
    if (toolPanel !== "fonts") setToolPanel(null);
    const node = pageRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const z = zoomRef.current;
    const sx = (e.clientX - rect.left) / z;
    const sy = (e.clientY - rect.top) / z;
    marqueeStart.current = { x: sx, y: sy };
    setMarquee({ x: sx, y: sy, w: 0, h: 0 });
    window.addEventListener("pointermove", onMarqueeMove);
    window.addEventListener("pointerup", onMarqueeUp);
  }, [onMarqueeMove, onMarqueeUp, toolPanel]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const inField = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void handleSave();
        return;
      }
      if (e.key === "Escape" && presentMode) { setPresentMode(false); return; }
      if (mod && e.altKey && e.key.toLowerCase() === "p") { e.preventDefault(); setPresentIdx(pageIdxRef.current); setPresentMode(true); return; }
      if (inField) {
        if (e.key === "Escape") (target as HTMLInputElement).blur();
        return;
      }
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (mod && e.key.toLowerCase() === "a") { e.preventDefault(); setSelectedIds(pagesRef.current[pageIdxRef.current].elements.filter((x) => !x.locked).map((x) => x.id)); return; }
      if (mod && e.key.toLowerCase() === "g" && e.shiftKey) { e.preventDefault(); ungroupSelected(); return; }
      if (mod && e.key.toLowerCase() === "g") { e.preventDefault(); groupSelected(); return; }
      if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); duplicateSelected(); return; }
      if (mod && e.altKey && e.key.toLowerCase() === "c" && selectedId) { e.preventDefault(); copyStyle(); return; }
      if (mod && e.key.toLowerCase() === "k" && selectedId) { e.preventDefault(); editLink(); return; }
      if (mod && e.key.toLowerCase() === "c" && selectedId) {
        const el = pagesRef.current[pageIdxRef.current].elements.find((x) => x.id === selectedId);
        if (el) clipboard.current = { ...el };
        return;
      }
      if (mod && e.key.toLowerCase() === "v" && clipboard.current) {
        const src = clipboard.current;
        addElement({ ...src, x: src.x + 24, y: src.y + 24 }); // addElement assigns a fresh id after the spread
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIdsRef.current.length) { e.preventDefault(); deleteSelected(); return; }
      if (e.key === "Escape") { setSelectedIds([]); setEditingId(null); return; }
      if (selectedIdsRef.current.length && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const ddx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const ddy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        const ids = selectedIdsRef.current;
        pushHistory();
        setPageAt(pageIdxRef.current, (p) => ({
          ...p,
          elements: p.elements.map((el) => (ids.includes(el.id) ? { ...el, x: el.x + ddx, y: el.y + ddy } : el)),
        }));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, undo, redo, duplicateSelected, deleteSelected, addElement, commitPatch, copyStyle, editLink, groupSelected, ungroupSelected, pushHistory, setPageAt, presentMode]);

  // ── Save (manual + autosave) ────────────────────────────────────────────────
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = useCallback(async () => {
    setSaveState("saving");
    const { w, h } = dimsRef.current;
    const matching = CANVA_FORMATS.find((f) => f.width === w && f.height === h);
    const res = await saveCanvaProjectAction(project.id, {
      title,
      pages: pagesRef.current,
      width: w,
      height: h,
      format: matching?.id ?? "custom",
    });
    if (res.error) {
      setSaveState("dirty");
      toast.error(res.error);
    } else {
      setSaveState("saved");
    }
  }, [project.id, title]);

  useEffect(() => {
    if (saveState !== "dirty") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void handleSave(), 2500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [pages, title, saveState, handleSave]);

  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (saveState !== "saved") e.preventDefault();
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [saveState]);

  // Repaint portal chrome when the canvas viewport is scrolled/resized
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    vp.addEventListener("scroll", vpScrollTick, { passive: true });
    window.addEventListener("resize", vpScrollTick, { passive: true });
    return () => {
      vp.removeEventListener("scroll", vpScrollTick);
      window.removeEventListener("resize", vpScrollTick);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Insert helpers ──────────────────────────────────────────────────────────
  function insertText(kind: "heading" | "subheading" | "body") {
    const base = { heading: { fontSize: Math.round(W / 12), fontWeight: 700, text: "Add a heading" },
      subheading: { fontSize: Math.round(W / 22), fontWeight: 600, text: "Add a subheading" },
      body: { fontSize: Math.round(W / 36), fontWeight: 400, text: "Add a little bit of body text" } }[kind];
    const w = Math.round(W * 0.6);
    addElement({
      type: "text", x: Math.round((W - w) / 2), y: Math.round(H / 2 - base.fontSize), w,
      h: Math.round(base.fontSize * 1.5), rotation: 0, opacity: 1,
      text: base.text, fontSize: base.fontSize, fontFamily: "'Poppins', sans-serif",
      fontWeight: base.fontWeight, fontStyle: "normal", textAlign: "center", lineHeight: 1.3, color: "#1a1a1a",
    });
  }

  function insertEmoji(ch: string) {
    const size = Math.round(Math.min(W, H) / 4);
    addElement({
      type: "text", x: Math.round((W - size) / 2), y: Math.round((H - size) / 2),
      w: size, h: Math.round(size * 1.25), rotation: 0, opacity: 1,
      text: ch, fontSize: size, fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif",
      fontWeight: 400, fontStyle: "normal", textAlign: "center", lineHeight: 1.1, color: "#000000",
    });
  }

  function insertSvgGraphic(g: SvgGraphic) {
    const w = Math.min(W * 0.45, g.w * 2.2);
    const h = w * (g.h / g.w);
    // Uniquify internal SVG ids so duplicate inserts don't share gradient/clip defs
    const uniq = Math.random().toString(36).slice(2, 7);
    const svg = g.svg.replace(/(id="|url\(#)([\w-]+)/g, (_m, p1, p2) => `${p1}${p2}-${uniq}`);
    addElement({
      type: "svg", x: Math.round((W - w) / 2), y: Math.round((H - h) / 2),
      w: Math.round(w), h: Math.round(h), rotation: 0, opacity: 1, svg, fill: "#475569",
    });
  }

  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const MAX_FILES = 10;
    const batch = files.slice(0, MAX_FILES);
    if (files.length > MAX_FILES) toast.warning(`Only the first ${MAX_FILES} images were uploaded (limit per batch).`);

    const frameTargetId = selectedIdsRef.current.length === 1 && page.elements.find((el2) => el2.id === selectedIdsRef.current[0])?.type === "frame" ? selectedIdsRef.current[0] : null;
    setUploading(true);
    let succeeded = 0;
    for (let i = 0; i < batch.length; i++) {
      const file = batch[i];
      if (batch.length > 1) setUploadProgress(`${i + 1} / ${batch.length}`);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("type", "image");
        const res = await fetch("/api/canva/assets", { method: "POST", body: fd });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "Upload failed");
        setImgAssets((a) => [j.asset, ...a]);
        // First file fills the frame (if selected), rest are inserted as canvas elements
        if (i === 0 && frameTargetId) { commitPatch(frameTargetId, { src: j.asset.url }); }
        else { insertImage(j.asset.url); }
        succeeded++;
      } catch (err) {
        toast.error(`${file.name}: ${err instanceof Error ? err.message : "Upload failed"}`);
      }
    }
    setUploading(false);
    setUploadProgress(null);
    if (succeeded > 1) toast.success(`${succeeded} images uploaded`);
  }

  // Image imported from the shared Google Drive browser → store + drop on canvas.
  function handleDrivePick(asset: CanvaAsset) {
    setImgAssets((prev) => (prev.some((a) => a.id === asset.id) ? prev : [asset, ...prev]));
    const sel = selectedIdsRef.current.length === 1
      ? page.elements.find((el) => el.id === selectedIdsRef.current[0])
      : null;
    if (sel?.type === "frame") commitPatch(sel.id, { src: asset.url });
    else insertImage(asset.url);
  }

  async function handleFontUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingFont(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "font");
      const res = await fetch("/api/canva/assets", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Font upload failed");
      injectCustomFont(j.asset.name, j.asset.url);
      setFonts((f) => [j.asset, ...f]);
      if (selectedId && selected?.type === "text") {
        commitPatch(selectedId, { fontFamily: `'${j.asset.name}', sans-serif` });
      }
      toast.success(`Font "${j.asset.name}" added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Font upload failed");
    } finally {
      setUploadingFont(false);
    }
  }

  async function handleDeleteAsset(asset: CanvaAsset) {
    setImgAssets((a) => a.filter((x) => x.id !== asset.id));
    await deleteCanvaAssetAction(asset.id);
  }

  async function handleRemoveBg(el: CanvaElement) {
    if (el.type !== "image" || !el.src) return;
    setBgRemoving(el.id);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      toast.message("Removing background…", { description: "First run downloads the model — this can take a moment." });
      const blob = await removeBackground(el.src);
      const file = new File([blob], "no-bg.png", { type: "image/png" });
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "image");
      const res = await fetch("/api/canva/assets", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Upload failed");
      setImgAssets((a) => [j.asset, ...a]);
      commitPatch(el.id, { src: j.asset.url, crop: undefined });
      toast.success("Background removed");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Background removal failed");
    } finally {
      setBgRemoving(null);
    }
  }

  function handleApplyMagicLayers(fgUrl: string) {
    if (!magicLayersEl) return;
    const elId = magicLayersEl.id;
    const pg = pagesRef.current[pageIdxRef.current];
    const idx = pg.elements.findIndex((e) => e.id === elId);
    if (idx === -1) return;
    const origEl = pg.elements[idx];
    const fgEl: CanvaElement = {
      ...origEl,
      id: uid(),
      src: fgUrl,
      crop: undefined,
      cropX: undefined,
      cropY: undefined,
      cropW: undefined,
      cropH: undefined,
      cropRotation: undefined,
      filterPreset: undefined,
      brightness: undefined,
      contrast: undefined,
      saturate: undefined,
      blur: undefined,
    };
    pushHistory();
    setPageAt(pageIdxRef.current, (p) => ({
      ...p,
      elements: [
        ...p.elements.slice(0, idx + 1),
        fgEl,
        ...p.elements.slice(idx + 1),
      ],
    }));
    setSaveState("dirty");
    setMagicLayersEl(null);
  }

  function insertImage(src: string) {
    const img = new window.Image();
    img.onload = () => {
      const maxW = W * 0.5;
      const w = Math.min(maxW, img.naturalWidth);
      const h = (img.naturalHeight / img.naturalWidth) * w;
      addElement({
        type: "image", src, x: Math.round((W - w) / 2), y: Math.round((H - h) / 2),
        w: Math.round(w), h: Math.round(h), rotation: 0, opacity: 1, radius: 0,
      });
    };
    img.src = src;
  }

  function insertFrame(frame: FrameDef) {
    const size = Math.round(Math.min(W, H) * 0.4);
    addElement({
      type: "frame",
      clipPath: frame.clipPath,
      x: Math.round((W - size) / 2),
      y: Math.round((H - size) / 2),
      w: size,
      h: size,
      rotation: 0,
      opacity: 1,
    });
  }

  function applyTemplate(tplId: string) {
    const tpl = CANVA_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    pushHistory();
    const tplPages = instantiateTemplate(tpl);
    setPages((ps) => {
      const next = [...ps];
      next[pageIdxRef.current] = tplPages[0];
      // extra template pages get appended after the current one
      if (tplPages.length > 1) next.splice(pageIdxRef.current + 1, 0, ...tplPages.slice(1));
      return next;
    });
    setSelectedId(null);
    setSaveState("dirty");
    toast.success(`Template applied${tplPages.length > 1 ? ` (${tplPages.length} pages)` : ""} — Ctrl+Z to undo`);
  }

  // ── Pages ───────────────────────────────────────────────────────────────────
  function addPage() {
    pushHistory();
    setPages((ps) => [...ps, newPage(page.background)]);
    setPageIdx(pages.length);
    setSelectedId(null);
  }

  function duplicatePage() {
    pushHistory();
    const clone: CanvaPage = JSON.parse(JSON.stringify(page));
    clone.id = uid();
    clone.elements = clone.elements.map((e) => ({ ...e, id: uid() }));
    setPages((ps) => {
      const next = [...ps];
      next.splice(pageIdx + 1, 0, clone);
      return next;
    });
    setPageIdx(pageIdx + 1);
    setSelectedId(null);
  }

  function deletePage() {
    if (pages.length <= 1) return;
    pushHistory();
    setPages((ps) => ps.filter((_, i) => i !== pageIdx));
    setPageIdx(Math.max(0, pageIdx - 1));
    setSelectedId(null);
  }

  function reorderPages(from: number, to: number) {
    if (from === to || to < 0 || to >= pagesRef.current.length) return;
    pushHistory();
    setPages((ps) => {
      const next = [...ps];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setPageIdx(to);
    setSelectedId(null);
  }

  function addPageFromTemplate(tplId: string) {
    const tpl = CANVA_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    pushHistory();
    const first = instantiateTemplate(tpl)[0];
    const at = pageIdxRef.current + 1;
    setPages((ps) => { const next = [...ps]; next.splice(at, 0, first); return next; });
    setPageIdx(at);
    setSelectedId(null);
    setAddPageOpen(false);
  }

  // Pointer-based page reorder (works on touch + mouse) — freezes the page while dragging
  function onPagePointerDown(i: number, e: React.PointerEvent) {
    pageDragRef.current = { from: i, startX: e.clientX, moved: false };
    window.addEventListener("pointermove", onPagePointerMove);
    window.addEventListener("pointerup", onPagePointerUp);
  }
  function onPagePointerMove(e: PointerEvent) {
    const d = pageDragRef.current;
    if (!d) return;
    if (!d.moved && Math.abs(e.clientX - d.startX) < 6) return;
    if (!d.moved) {
      d.moved = true;
      setDraggingPageId(pagesRef.current[d.from]?.id ?? null);
      document.body.style.overflow = "hidden"; // freeze background scroll
    }
    const target = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest("[data-page-index]");
    const idx = target ? Number(target.getAttribute("data-page-index")) : null;
    setPageOver(Number.isInteger(idx) ? idx : null);
  }
  function onPagePointerUp() {
    const d = pageDragRef.current;
    window.removeEventListener("pointermove", onPagePointerMove);
    window.removeEventListener("pointerup", onPagePointerUp);
    pageDragRef.current = null;
    document.body.style.overflow = "";
    setDraggingPageId(null);
    setPageOver((over) => {
      if (d) {
        if (d.moved && over != null) reorderPages(d.from, over);
        else if (!d.moved) { setPageIdx(d.from); setSelectedId(null); setEditingId(null); }
      }
      return null;
    });
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  function triggerDownload(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }

  async function handleExport(format: "png" | "jpg" | "pdf", pageIndices: number[]) {
    const all = pagesRef.current;
    const indices = pageIndices.filter((i) => i >= 0 && i < all.length);
    if (indices.length === 0) return;
    setExportingAs(format);
    setDownloadOpen(false);
    const safeName = (title || "design").replace(/[^\w\d一-鿿 -]+/g, "").trim() || "design";
    const ratio = Math.min(3, Math.max(1.5, 2600 / Math.max(W, H)));
    try {
      const { renderPageToCanvas } = await import("./renderToCanvas");
      if (format === "png" || format === "jpg") {
        for (const i of indices) {
          const canvas = await renderPageToCanvas(all[i], W, H, ratio);
          const url = format === "png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.92);
          const suffix = indices.length > 1 || all.length > 1 ? `-page${i + 1}` : "";
          triggerDownload(url, `${safeName}${suffix}.${format}`);
        }
      } else {
        const images: string[] = [];
        for (const i of indices) {
          const canvas = await renderPageToCanvas(all[i], W, H, ratio);
          images.push(canvas.toDataURL("image/jpeg", 0.9));
        }
        const res = await fetch("/api/canva/export-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images, width: W, height: H }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? "PDF generation failed");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `${safeName}.pdf`);
        URL.revokeObjectURL(url);
      }
      toast.success("Download started");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportingAs(null);
    }
  }

  // ── Tool panels (rendered in the left sidebar) ───────────────────────────────
  function ToolPanelHeader({ title }: { title: string }) {
    return (
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-surface-700 uppercase tracking-wide">{title}</p>
        <button type="button" onClick={() => setToolPanel(null)} className="p-1 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  function renderToolPanelContent() {
    if (toolPanel === "fonts") {
      if (!selected || selected.type !== "text") {
        return <p className="text-xs text-surface-400 p-2">Select a text box to choose a font.</p>;
      }
      return (
        <FontBrowserPanel
          value={selected.fontFamily}
          onChange={(css) => commitPatch(selected.id, { fontFamily: css })}
          customFonts={fonts.map((f) => ({ family: f.name }))}
          onUploadFont={() => fontInputRef.current?.click()}
          uploadingFont={uploadingFont}
          onClose={() => setToolPanel(null)}
        />
      );
    }

    if (!selected) return null;

    if (toolPanel === "adjust" && selected.type === "image") {
      return (
        <div className="overflow-y-auto">
          <ToolPanelHeader title="Adjust" />
          <div className="space-y-4">
            {([
              ["Brightness", "brightness", 0, 200, 100],
              ["Contrast", "contrast", 0, 200, 100],
              ["Saturation", "saturate", 0, 200, 100],
              ["Blur", "blur", 0, 20, 0],
            ] as [string, "brightness" | "contrast" | "saturate" | "blur", number, number, number][]).map(([label, key, min, max, def]) => (
              <div key={key}>
                <div className="flex justify-between text-xs text-surface-500 mb-1">
                  <span>{label}</span>
                  <span>{selected[key] ?? def}{key === "blur" ? "px" : "%"}</span>
                </div>
                <input
                  type="range" min={min} max={max} value={selected[key] ?? def}
                  onPointerDown={() => pushHistory()}
                  onChange={(e) => patchEl(selected.id, { [key]: Number(e.target.value) })}
                  className="w-full accent-brand-600"
                />
              </div>
            ))}
            <button type="button" onClick={() => commitPatch(selected.id, { brightness: 100, contrast: 100, saturate: 100, blur: 0 })} className="text-xs text-brand-600 hover:underline">
              Reset adjustments
            </button>
          </div>
        </div>
      );
    }

    if (toolPanel === "filters" && selected.type === "image") {
      return (
        <div className="overflow-y-auto">
          <ToolPanelHeader title="Filters" />
          <div className="grid grid-cols-3 gap-2">
            {FILTER_PRESETS.map((f) => (
              <button key={f.id} type="button" onClick={() => commitPatch(selected.id, { filterPreset: f.id })} className={cn("flex flex-col items-center gap-1", (selected.filterPreset ?? "none") === f.id ? "text-brand-600" : "text-surface-500")}>
                <span className={cn("block w-full aspect-square rounded-lg overflow-hidden border-2", (selected.filterPreset ?? "none") === f.id ? "border-brand-500" : "border-surface-200")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected.src} alt="" className="w-full h-full object-cover" style={{ filter: f.css || undefined }} />
                </span>
                <span className="text-[10px]">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (toolPanel === "crop" && (selected.type === "image" || selected.type === "frame")) {
      const cropRot = selected.cropRotation ?? 0;
      const natRatio = cropRatioFor(selected);
      const frameRatio = selected.h > 0 ? selected.w / selected.h : 1;
      const ASPECT_PRESETS = [
        { label: "Freeform", value: null },
        { label: "Original", value: natRatio },
        { label: "1:1", value: 1 },
        { label: "16:9", value: 16 / 9 },
        { label: "4:3", value: 4 / 3 },
        { label: "3:2", value: 3 / 2 },
      ];
      // Change the crop FRAME's aspect ratio (the element box), keeping its centre
      // fixed, then re-fit the image to cover — never distorts the image.
      function applyAspectRatio(ratio: number | null) {
        if (ratio === null) return;
        const el = selected!;
        const cx = el.x + el.w / 2;
        const cy = el.y + el.h / 2;
        // Keep the larger dimension and derive the other so the frame fits on-page.
        let nw = el.w;
        let nh = nw / ratio;
        if (nh > H) { nh = H; nw = nh * ratio; }
        if (nw > W) { nw = W; nh = nw / ratio; }
        const nx = cx - nw / 2;
        const ny = cy - nh / 2;
        commitPatch(el.id, { x: nx, y: ny, w: nw, h: nh, ...coverRect(nw, nh, cropRatioFor(el)) });
      }
      function matchesPreset(ratio: number | null) {
        if (ratio === null) return false;
        return Math.abs(frameRatio - ratio) < 0.01;
      }
      // Expand the crop FRAME to a target size, re-fitting the image to cover it.
      function expandFrame(target: "page" | "square" | "wider" | "taller") {
        const el = selected!;
        const cx = el.x + el.w / 2;
        const cy = el.y + el.h / 2;
        let nw = el.w, nh = el.h;
        if (target === "page") { nw = W; nh = H; }
        else if (target === "square") { const s = Math.min(Math.max(el.w, el.h), Math.min(W, H)); nw = s; nh = s; }
        else if (target === "wider") { nw = Math.min(W, el.w * 1.4); }
        else if (target === "taller") { nh = Math.min(H, el.h * 1.4); }
        const nx = Math.max(0, Math.min(W - nw, cx - nw / 2));
        const ny = Math.max(0, Math.min(H - nh, cy - nh / 2));
        commitPatch(el.id, { x: nx, y: ny, w: nw, h: nh, ...coverRect(nw, nh, cropRatioFor(el)) });
      }

      return (
        <div className="overflow-y-auto space-y-3">
          <ToolPanelHeader title="Crop" />

          {/* Crop / Expand tabs */}
          <div className="flex rounded-lg border border-surface-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setCropTab("crop")}
              className={cn("flex-1 py-1.5 text-xs font-medium transition-colors", cropTab === "crop" ? "bg-brand-600 text-white" : "text-surface-500 hover:bg-surface-50")}
            >
              Crop
            </button>
            <button
              type="button"
              onClick={() => setCropTab("expand")}
              className={cn("flex-1 py-1.5 text-xs font-medium transition-colors flex items-center justify-center gap-1", cropTab === "expand" ? "bg-brand-600 text-white" : "text-surface-500 hover:bg-surface-50")}
            >
              Expand
            </button>
          </div>

          {cropTab === "crop" && (
            <>
              <p className="text-xs text-surface-400 leading-relaxed">Drag the image to pan it within the frame. Drag the white handles to scale it. Pick a ratio to reshape the crop frame.</p>

              {/* Aspect ratio (reshapes the crop frame) */}
              <div>
                <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">Aspect ratio</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {ASPECT_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyAspectRatio(p.value)}
                      className={cn(
                        "py-1.5 rounded-lg border text-[10px] font-medium transition-colors",
                        matchesPreset(p.value) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-surface-200 text-surface-500 hover:bg-surface-50"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rotate */}
              <div>
                <div className="flex justify-between text-xs text-surface-500 mb-1">
                  <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Rotate</span>
                  <span>{cropRot}°</span>
                </div>
                <input
                  type="range" min={-180} max={180} step={1} value={cropRot}
                  onPointerDown={() => pushHistory()}
                  onChange={(e) => patchEl(selected.id, { cropRotation: Number(e.target.value) })}
                  className="w-full accent-brand-600"
                />
              </div>
            </>
          )}

          {cropTab === "expand" && (
            <>
              <p className="text-xs text-surface-400 leading-relaxed">Enlarge the crop frame — the image re-fits to fill the larger area.</p>

              {/* Expand size presets */}
              <div>
                <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">Select a size</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    { label: "Whole Page", icon: "▣", target: "page" as const },
                    { label: "Square", icon: "□", target: "square" as const },
                    { label: "Wider", icon: "⇆", target: "wider" as const },
                    { label: "Taller", icon: "⇅", target: "taller" as const },
                  ]).map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => expandFrame(opt.target)}
                      className="py-2 rounded-lg border border-surface-200 text-[10px] font-medium text-surface-500 hover:bg-surface-50 flex flex-col items-center gap-1"
                    >
                      <span className="text-base leading-none">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-surface-400">Tip: after expanding, switch to Crop and drag the image to reposition it within the new frame.</p>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { commitPatch(selected.id, { cropX: undefined, cropY: undefined, cropW: undefined, cropH: undefined, cropRotation: undefined, crop: undefined }); cropNaturalRef.current = null; }}
              className="flex-1 py-1.5 rounded-lg border border-surface-200 text-xs text-surface-600 hover:bg-surface-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setToolPanel(null)}
              className="flex-1 py-1.5 rounded-lg bg-brand-600 text-white text-xs hover:bg-brand-700 flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Done
            </button>
          </div>
        </div>
      );
    }

    if (toolPanel === "effects" && selected.type === "image") {
      return (
        <div className="overflow-y-auto">
          <ToolPanelHeader title="Effects" />
          <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">Effects</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {IMAGE_EFFECTS.map((f) => (
              <button key={f.id} type="button" onClick={() => commitPatch(selected.id, { imageEffect: f.id })} className={cn("flex flex-col items-center gap-1", (selected.imageEffect ?? "none") === f.id ? "text-brand-600" : "text-surface-500")}>
                <span className={cn("flex items-center justify-center w-full aspect-square rounded-lg border-2 bg-surface-50", (selected.imageEffect ?? "none") === f.id ? "border-brand-500" : "border-surface-200")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected.src} alt="" className="w-8 h-8 object-cover rounded" style={{ filter: f.filter || undefined }} />
                </span>
                <span className="text-[10px] leading-tight text-center">{f.label}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">Shadows</p>
          <div className="grid grid-cols-3 gap-2">
            {SHADOW_PRESETS.map((f) => (
              <button key={f.id} type="button" onClick={() => commitPatch(selected.id, { shadow: f.id })} className={cn("flex flex-col items-center gap-1", (selected.shadow ?? "none") === f.id ? "text-brand-600" : "text-surface-500")}>
                <span className={cn("flex items-center justify-center w-full aspect-square rounded-lg border-2 bg-surface-50", (selected.shadow ?? "none") === f.id ? "border-brand-500" : "border-surface-200")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected.src} alt="" className="w-8 h-8 object-cover rounded" style={{ filter: f.filter || undefined }} />
                </span>
                <span className="text-[10px] leading-tight text-center">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (toolPanel === "position") {
      return (
        <div className="overflow-y-auto">
          <ToolPanelHeader title="Position" />
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5">Align to page</p>
          <div className="flex gap-1 mb-4 flex-wrap">
            {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([w, Icon]) => (
              <button key={w} type="button" title={`Align ${w}`} onClick={() => alignToPage(w)} className="p-2 rounded-md border border-surface-200 text-surface-600 hover:bg-surface-100"><Icon className="w-4 h-4" /></button>
            ))}
            {([["top", AlignLeft], ["middle", AlignCenter], ["bottom", AlignRight]] as const).map(([w, Icon]) => (
              <button key={w} type="button" title={`Align ${w}`} onClick={() => alignToPage(w)} className="p-2 rounded-md border border-surface-200 text-surface-600 hover:bg-surface-100"><Icon className="w-4 h-4 rotate-90" /></button>
            ))}
          </div>
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5">Arrange</p>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            <button type="button" onClick={() => moveLayerToEnd(true)} className="text-xs px-2 py-1.5 rounded-md border border-surface-200 hover:bg-surface-100">To front</button>
            <button type="button" onClick={() => moveLayer(1)} className="text-xs px-2 py-1.5 rounded-md border border-surface-200 hover:bg-surface-100">Forward</button>
            <button type="button" onClick={() => moveLayer(-1)} className="text-xs px-2 py-1.5 rounded-md border border-surface-200 hover:bg-surface-100">Backward</button>
            <button type="button" onClick={() => moveLayerToEnd(false)} className="text-xs px-2 py-1.5 rounded-md border border-surface-200 hover:bg-surface-100">To back</button>
          </div>
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5">Exact position</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-surface-500">
            <label className="flex items-center gap-1.5">X
              <input type="number" value={Math.round(selected.x)} onChange={(e) => commitPatch(selected.id, { x: Number(e.target.value) })} className="w-full border border-surface-200 rounded-md px-2 py-1" />
            </label>
            <label className="flex items-center gap-1.5">Y
              <input type="number" value={Math.round(selected.y)} onChange={(e) => commitPatch(selected.id, { y: Number(e.target.value) })} className="w-full border border-surface-200 rounded-md px-2 py-1" />
            </label>
            <label className="flex items-center gap-1.5">W
              <input type="number" value={Math.round(selected.w)} onChange={(e) => commitPatch(selected.id, { w: Math.max(5, Number(e.target.value)) })} className="w-full border border-surface-200 rounded-md px-2 py-1" />
            </label>
            <label className="flex items-center gap-1.5">H
              <input type="number" value={Math.round(selected.h)} onChange={(e) => commitPatch(selected.id, { h: Math.max(5, Number(e.target.value)) })} className="w-full border border-surface-200 rounded-md px-2 py-1" />
            </label>
          </div>
        </div>
      );
    }

    if (toolPanel === "animate") {
      return (
        <AnimationPanel
          el={selected ?? null}
          onPatch={(patch) => {
            if (selected) {
              pushHistory();
              commitPatch(selected.id, patch);
              if ("animation" in patch) {
                setAnimPreviewVersion((prev) => ({ ...prev, [selected.id]: (prev[selected.id] ?? 0) + 1 }));
              }
            }
          }}
        />
      );
    }

    return null;
  }

  // ── Distance measurement guides (shown while dragging) ───────────────────────
  function renderDistanceGuides(el: CanvaElement) {
    const s = 1 / zoom;
    const left = Math.round(el.x);
    const right = Math.round(W - (el.x + el.w));
    const top = Math.round(el.y);
    const bottom = Math.round(H - (el.y + el.h));
    const cy = el.y + el.h / 2;
    const cx = el.x + el.w / 2;
    const lineColor = "#ec4899";

    const badge = (text: number, x: number, y: number) => (
      <div
        style={{
          position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)",
          background: lineColor, color: "#fff", fontSize: 11 * s, lineHeight: 1,
          padding: `${3 * s}px ${5 * s}px`, borderRadius: 4 * s, whiteSpace: "nowrap",
          pointerEvents: "none", zIndex: 1004, fontWeight: 600,
        }}
      >
        {text}
      </div>
    );

    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1003 }}>
        {/* left */}
        {left > 0 && <div style={{ position: "absolute", left: 0, width: el.x, top: cy, borderTop: `${s}px dashed ${lineColor}` }} />}
        {left > 0 && badge(left, el.x / 2, cy)}
        {/* right */}
        {right > 0 && <div style={{ position: "absolute", left: el.x + el.w, width: right, top: cy, borderTop: `${s}px dashed ${lineColor}` }} />}
        {right > 0 && badge(right, el.x + el.w + right / 2, cy)}
        {/* top */}
        {top > 0 && <div style={{ position: "absolute", top: 0, height: el.y, left: cx, borderLeft: `${s}px dashed ${lineColor}` }} />}
        {top > 0 && badge(top, cx, el.y / 2)}
        {/* bottom */}
        {bottom > 0 && <div style={{ position: "absolute", top: el.y + el.h, height: bottom, left: cx, borderLeft: `${s}px dashed ${lineColor}` }} />}
        {bottom > 0 && badge(bottom, cx, el.y + el.h + bottom / 2)}
      </div>
    );
  }

  // ── Selection chrome ────────────────────────────────────────────────────────
  const HANDLES: [number, number][] = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];

  function renderMultiSelectionChrome() {
    const bbox = selectionBBox;
    if (!bbox) return null;
    const pageNode = pageRef.current;
    if (!pageNode) return null;
    const rect = pageNode.getBoundingClientRect();
    const hs = 13; // fixed screen-px so handles are same size at all zoom levels

    const bx = rect.left + bbox.x * zoom;
    const by = rect.top + bbox.y * zoom;
    const bw = bbox.w * zoom;
    const bh = bbox.h * zoom;

    return createPortal(
      <>
        {/* per-element outlines */}
        {selectedEls.map((el) => (
          <div
            key={`sel-${el.id}`}
            style={{
              position: "fixed",
              left: rect.left + el.x * zoom,
              top: rect.top + el.y * zoom,
              width: el.w * zoom,
              height: el.h * zoom,
              transform: `rotate(${el.rotation}deg)`,
              transformOrigin: "center",
              border: "1px solid #a78bfa",
              pointerEvents: "none",
              zIndex: 9500,
            }}
          />
        ))}
        {/* group bounding box + resize handles */}
        <div style={{ position: "fixed", left: bx, top: by, width: bw, height: bh, pointerEvents: "none", zIndex: 9500 }}>
          <div style={{ position: "absolute", inset: 0, border: "1.5px solid #7c3aed" }} />
          {HANDLES.map(([hx, hy]) => (
            <div
              key={`${hx},${hy}`}
              onPointerDown={(e) => onGroupHandlePointerDown([hx, hy], e)}
              style={{
                position: "absolute",
                left: hx === -1 ? -hs / 2 : hx === 0 ? `calc(50% - ${hs / 2}px)` : undefined,
                right: hx === 1 ? -hs / 2 : undefined,
                top: hy === -1 ? -hs / 2 : hy === 0 ? `calc(50% - ${hs / 2}px)` : undefined,
                bottom: hy === 1 ? -hs / 2 : undefined,
                width: hs, height: hs, background: "#fff", border: "1.5px solid #7c3aed",
                borderRadius: hx === 0 || hy === 0 ? hs / 4 : "50%", pointerEvents: "auto", touchAction: "none",
                cursor: hx !== 0 && hy !== 0 ? (hx === hy ? "nwse-resize" : "nesw-resize") : hx === 0 ? "ns-resize" : "ew-resize",
              }}
            />
          ))}
        </div>
      </>,
      document.body
    );
  }

  function renderSelectionChrome(el: CanvaElement) {
    const pageNode = pageRef.current;
    if (!pageNode || typeof document === "undefined") return null;
    const rect = pageNode.getBoundingClientRect();
    const hs = 13; // fixed screen-px

    const sx = rect.left + el.x * zoom;
    const sy = rect.top + el.y * zoom;
    const sw = el.w * zoom;
    const sh = el.h * zoom;

    if (el.locked) {
      return createPortal(
        <div
          style={{
            position: "fixed", left: sx, top: sy, width: sw, height: sh,
            transform: `rotate(${el.rotation}deg)`, transformOrigin: "center",
            pointerEvents: "none", zIndex: 9500,
          }}
        >
          <div style={{ position: "absolute", inset: 0, border: "1.5px dashed #94a3b8" }} />
          <div style={{ position: "absolute", top: -hs * 2.5, left: `calc(50% - ${hs}px)`, background: "#475569", borderRadius: hs / 3, padding: hs / 3, display: "flex" }}>
            <Lock style={{ width: hs * 1.4, height: hs * 1.4, color: "#fff" }} />
          </div>
        </div>,
        document.body
      );
    }

    return createPortal(
      <div
        style={{
          position: "fixed", left: sx, top: sy, width: sw, height: sh,
          transform: `rotate(${el.rotation}deg)`, transformOrigin: "center",
          pointerEvents: "none", zIndex: 9500,
        }}
      >
        <div style={{ position: "absolute", inset: 0, border: "1.5px solid #7c3aed" }} />
        {HANDLES.map(([hx, hy]) => (
          <div
            key={`${hx},${hy}`}
            onPointerDown={(e) => onHandlePointerDown(el, [hx, hy], e)}
            style={{
              position: "absolute",
              left: hx === -1 ? -hs / 2 : hx === 0 ? `calc(50% - ${hs / 2}px)` : undefined,
              right: hx === 1 ? -hs / 2 : undefined,
              top: hy === -1 ? -hs / 2 : hy === 0 ? `calc(50% - ${hs / 2}px)` : undefined,
              bottom: hy === 1 ? -hs / 2 : undefined,
              width: hs, height: hs,
              background: "#ffffff", border: "1.5px solid #7c3aed",
              borderRadius: hx === 0 || hy === 0 ? hs / 4 : "50%",
              pointerEvents: "auto", touchAction: "none",
              cursor: hx !== 0 && hy !== 0 ? (hx === hy ? "nwse-resize" : "nesw-resize") : hx === 0 ? "ns-resize" : "ew-resize",
            }}
          />
        ))}
        {/* Rotate handle */}
        <div
          onPointerDown={(e) => onRotatePointerDown(el, e)}
          style={{
            position: "absolute",
            left: `calc(50% - ${hs / 2}px)`,
            top: -hs * 3,
            width: hs, height: hs,
            background: "#7c3aed", borderRadius: "50%",
            pointerEvents: "auto", touchAction: "none", cursor: "grab",
          }}
        />
      </div>,
      document.body
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const zoomPct = Math.round(zoom * 100);

  function applyZoomText(raw: string) {
    const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
    if (Number.isNaN(n)) return;
    setZoom(Math.max(0.05, Math.min(1.5, n / 100)));
  }


  const formatTemplates = CANVA_TEMPLATES.filter((t) => t.formatId === project.format);
  const otherTemplates = CANVA_TEMPLATES.filter((t) => t.formatId !== project.format);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface-100">
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} precedence="default" />

      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-200 bg-white shrink-0">
        <Link href="/canva" className="p-1.5 rounded-md text-surface-500 hover:text-surface-900 hover:bg-surface-100">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSaveState("dirty"); }}
          className="text-sm font-semibold text-surface-900 bg-transparent border border-transparent hover:border-surface-200 focus:border-brand-400 rounded-md px-2 py-1 focus:outline-none w-36 sm:w-56"
        />
        <span className="text-xs text-surface-400 hidden md:inline">
          {saveState === "saving" ? "Saving…" : saveState === "dirty" ? "Unsaved changes" : "Saved"}
        </span>

        <div className="flex-1" />

        <button type="button" onClick={undo} title="Undo (Ctrl+Z)" className="p-1.5 rounded-md text-surface-500 hover:text-surface-900 hover:bg-surface-100">
          <Undo2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={redo} title="Redo (Ctrl+Y)" className="p-1.5 rounded-md text-surface-500 hover:text-surface-900 hover:bg-surface-100">
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Zoom slider — visible on lg+ (iPad landscape and desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 border border-surface-200 rounded-md px-2 py-1">
          <ZoomOut className="w-3.5 h-3.5 text-surface-400 shrink-0" />
          <input
            type="range"
            min={10}
            max={150}
            step={5}
            value={Math.round(zoom * 100)}
            onChange={(e) => setZoomCentered(Number(e.target.value) / 100)}
            className="w-28 xl:w-44 accent-brand-600"
            aria-label="Zoom"
          />
          <ZoomIn className="w-3.5 h-3.5 text-surface-400 shrink-0" />
          <div className="flex items-center w-11">
            <input
              key={zoomPct}
              type="text"
              inputMode="numeric"
              defaultValue={zoomPct}
              onKeyDown={(e) => { if (e.key === "Enter") { applyZoomText((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur(); } }}
              onBlur={(e) => applyZoomText(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-8 text-xs text-surface-700 text-right bg-transparent focus:outline-none"
              aria-label="Zoom percentage"
            />
            <span className="text-xs text-surface-500">%</span>
          </div>
          <button type="button" onClick={fitZoom} title="Fit to screen" className="p-0.5 text-surface-500 hover:text-surface-900 shrink-0"><Maximize className="w-3.5 h-3.5" /></button>
        </div>

        {/* Compact zoom controls for mobile (below lg) */}
        <div className="flex lg:hidden items-center gap-0.5 border border-surface-200 rounded-md px-1 py-1">
          <button type="button" title="Zoom out" onClick={() => setZoomCentered(Math.max(0.1, zoom - 0.1))} className="p-1 rounded text-surface-500 hover:text-surface-900 hover:bg-surface-100">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={fitZoom}
            title="Fit to screen"
            className="text-xs text-surface-700 px-1 min-w-[2.5rem] text-center hover:bg-surface-100 rounded"
          >
            {zoomPct}%
          </button>
          <button type="button" title="Zoom in" onClick={() => setZoomCentered(Math.min(1.5, zoom + 0.1))} className="p-1 rounded text-surface-500 hover:text-surface-900 hover:bg-surface-100">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowGrid((g) => !g)}
          title="Toggle grid & snap-to-grid"
          className={cn("p-1.5 rounded-md", showGrid ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:text-surface-900 hover:bg-surface-100")}
        >
          <Grid3x3 className="w-4 h-4" />
        </button>

        <Button size="sm" variant="outline" onClick={() => { setCustomW(String(W)); setCustomH(String(H)); setResizeOpen(true); }}>
          <Scaling className="w-4 h-4" />
          <span className="hidden xl:inline">Resize</span>
        </Button>

        <Button size="sm" variant="outline" onClick={() => void handleSave()} loading={saveState === "saving"}>
          <Save className="w-4 h-4" />
          <span className="hidden xl:inline">Save</span>
        </Button>
        <Button size="sm" onClick={() => { setSelectedPages(new Set(pages.map((_, i) => i))); setDownloadOpen(true); }} disabled={exportingAs !== null} loading={exportingAs !== null}>
          <Download className="w-4 h-4" />
          <span className="hidden xl:inline">Download</span>
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setPresentIdx(pageIdx); setPresentMode(true); }} title="Present full screen (Ctrl+Alt+P)">
          <Play className="w-4 h-4" />
          <span className="hidden xl:inline">Present</span>
        </Button>
      </div>

      {/* ── Context toolbar (always present to reserve height — no layout shift) ── */}
      <div className="flex items-center gap-2 px-3 border-b border-surface-200 bg-white shrink-0 overflow-x-auto h-12">
        {selectedIds.length > 1 ? (
          <>
            <span className="text-xs font-medium text-surface-600 shrink-0">{selectedIds.length} selected</span>
            <div className="w-px h-5 bg-surface-200 mx-1" />
            {selectedEls.some((e) => e.groupId) ? (
              <button type="button" onClick={ungroupSelected} className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-surface-600 hover:bg-surface-100">
                <Ungroup className="w-4 h-4" /> Ungroup
              </button>
            ) : (
              <button type="button" onClick={groupSelected} className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-surface-600 hover:bg-surface-100">
                <Group className="w-4 h-4" /> Group
              </button>
            )}
            <button type="button" title="Align left edges" onClick={() => alignSelected("left")} className="p-1.5 rounded-md text-surface-500 hover:bg-surface-100"><AlignLeft className="w-4 h-4" /></button>
            <button type="button" title="Align horizontal centers" onClick={() => alignSelected("center")} className="p-1.5 rounded-md text-surface-500 hover:bg-surface-100"><AlignCenter className="w-4 h-4" /></button>
            <button type="button" title="Align right edges" onClick={() => alignSelected("right")} className="p-1.5 rounded-md text-surface-500 hover:bg-surface-100"><AlignRight className="w-4 h-4" /></button>
            <button type="button" title="Align top edges" onClick={() => alignSelected("top")} className="p-1.5 rounded-md text-surface-500 hover:bg-surface-100"><AlignLeft className="w-4 h-4 rotate-90" /></button>
            <button type="button" title="Align vertical centers" onClick={() => alignSelected("middle")} className="p-1.5 rounded-md text-surface-500 hover:bg-surface-100"><AlignCenter className="w-4 h-4 rotate-90" /></button>
            <button type="button" title="Align bottom edges" onClick={() => alignSelected("bottom")} className="p-1.5 rounded-md text-surface-500 hover:bg-surface-100"><AlignRight className="w-4 h-4 rotate-90" /></button>
            <div className="w-px h-5 bg-surface-200 mx-1" />
            <button type="button" title="Duplicate (Ctrl+D)" onClick={duplicateSelected} className="p-1.5 rounded-md text-surface-500 hover:bg-surface-100"><Copy className="w-4 h-4" /></button>
            <button type="button" title="Delete (Del)" onClick={deleteSelected} className="p-1.5 rounded-md text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
          </>
        ) : selected ? (
        <>
          {selected.type === "text" && (
            <>
              <button
                type="button"
                onClick={() => setToolPanel((p) => (p === "fonts" ? null : "fonts"))}
                className={cn("flex items-center gap-1.5 text-xs border rounded-md px-2 py-1.5 bg-white w-36 hover:border-surface-300", toolPanel === "fonts" ? "border-brand-400 ring-1 ring-brand-200" : "border-surface-200")}
                title="Browse fonts"
              >
                <span className="truncate flex-1 text-left" style={{ fontFamily: selected.fontFamily }}>{familyFromCss(selected.fontFamily)}</span>
                <ChevronDown className="w-3.5 h-3.5 text-surface-400 shrink-0" />
              </button>
              <input ref={fontInputRef} type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" className="hidden" onChange={handleFontUpload} />
              <div className="flex items-center border border-surface-200 rounded-md">
                <button
                  type="button"
                  onClick={() => commitPatch(selected.id, { fontSize: Math.max(6, (selected.fontSize ?? 24) - 2) })}
                  className="px-1.5 py-1.5 text-surface-500 hover:bg-surface-100 rounded-l-md"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min={6}
                  max={400}
                  value={selected.fontSize ?? 24}
                  onChange={(e) => commitPatch(selected.id, { fontSize: Number(e.target.value) })}
                  className="w-12 text-xs text-center py-1.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => commitPatch(selected.id, { fontSize: Math.min(400, (selected.fontSize ?? 24) + 2) })}
                  className="px-1.5 py-1.5 text-surface-500 hover:bg-surface-100 rounded-r-md"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <label className="flex items-center gap-1 text-xs text-surface-500" title="Text color">
                <input
                  type="color"
                  value={selected.color ?? "#1a1a1a"}
                  onChange={(e) => commitPatch(selected.id, { color: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border border-surface-200"
                />
              </label>
              <button
                type="button"
                title="Bold"
                onClick={() => commitPatch(selected.id, { fontWeight: (selected.fontWeight ?? 400) >= 600 ? 400 : 700 })}
                className={cn("p-1.5 rounded-md", (selected.fontWeight ?? 400) >= 600 ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:bg-surface-100")}
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Italic"
                onClick={() => commitPatch(selected.id, { fontStyle: selected.fontStyle === "italic" ? "normal" : "italic" })}
                className={cn("p-1.5 rounded-md", selected.fontStyle === "italic" ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:bg-surface-100")}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Underline"
                onClick={() => commitPatch(selected.id, { underline: !selected.underline })}
                className={cn("p-1.5 rounded-md", selected.underline ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:bg-surface-100")}
              >
                <Underline className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Strikethrough"
                onClick={() => commitPatch(selected.id, { strike: !selected.strike })}
                className={cn("p-1.5 rounded-md", selected.strike ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:bg-surface-100")}
              >
                <Strikethrough className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Text case (aA)"
                onClick={cycleCase}
                className={cn(
                  "px-1.5 py-1 rounded-md text-xs font-semibold",
                  (selected.textTransform ?? "none") !== "none" ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:bg-surface-100"
                )}
              >
                {selected.textTransform === "uppercase" ? "AA" : selected.textTransform === "capitalize" ? "Aa" : "aA"}
              </button>
              {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([al, Icon]) => (
                <button
                  key={al}
                  type="button"
                  title={`Align ${al}`}
                  onClick={() => commitPatch(selected.id, { textAlign: al })}
                  className={cn("p-1.5 rounded-md", selected.textAlign === al ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:bg-surface-100")}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
              <button
                type="button"
                title="Bulleted list"
                onClick={toggleBullets}
                className="p-1.5 rounded-md text-surface-500 hover:bg-surface-100"
              >
                <List className="w-4 h-4" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  title="Letter & line spacing"
                  onClick={() => setSpacingFor((o) => (o === selected.id ? null : selected.id))}
                  className={cn("p-1.5 rounded-md", spacingFor === selected.id ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:bg-surface-100")}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                {spacingFor === selected.id && (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-surface-200 rounded-xl shadow-lg p-3 w-56 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-surface-500 mb-1">
                        <span>Letter spacing</span>
                        <span>{selected.letterSpacing ?? 0}px</span>
                      </div>
                      <input
                        type="range"
                        min={-2}
                        max={20}
                        step={0.5}
                        value={selected.letterSpacing ?? 0}
                        onChange={(e) => commitPatch(selected.id, { letterSpacing: Number(e.target.value) })}
                        className="w-full accent-brand-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-surface-500 mb-1">
                        <span>Line height</span>
                        <span>{(selected.lineHeight ?? 1.3).toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min={0.8}
                        max={3}
                        step={0.1}
                        value={selected.lineHeight ?? 1.3}
                        onChange={(e) => commitPatch(selected.id, { lineHeight: Number(e.target.value) })}
                        className="w-full accent-brand-600"
                      />
                    </div>
                  </div>
                )}
              </div>
              <select
                value={selected.effect ?? "none"}
                onChange={(e) => commitPatch(selected.id, { effect: e.target.value as CanvaElement["effect"] })}
                className="text-xs border border-surface-200 rounded-md px-2 py-1.5 bg-white"
                title="Text effects"
              >
                <option value="none">Effects: None</option>
                <option value="shadow">Shadow</option>
                <option value="outline">Outline</option>
              </select>
              {selected.effect && selected.effect !== "none" && (
                <input
                  type="color"
                  title="Effect color"
                  value={selected.effectColor ?? "#000000"}
                  onChange={(e) => commitPatch(selected.id, { effectColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border border-surface-200"
                />
              )}
            </>
          )}

          {(selected.type === "rect" || selected.type === "ellipse" || selected.type === "triangle" || selected.type === "shape") && (
            <>
              <label className="flex items-center gap-1.5 text-xs text-surface-500">
                Fill
                <input
                  type="color"
                  value={selected.fill === "transparent" ? "#ffffff" : selected.fill ?? "#475569"}
                  onChange={(e) => commitPatch(selected.id, { fill: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border border-surface-200"
                />
              </label>
              {(selected.type === "rect" || selected.type === "ellipse") && (
                <>
                  <label className="flex items-center gap-1.5 text-xs text-surface-500">
                    Border
                    <input
                      type="color"
                      value={selected.stroke ?? "#1a1a1a"}
                      onChange={(e) => commitPatch(selected.id, { stroke: e.target.value, strokeWidth: selected.strokeWidth || 2 })}
                      className="w-7 h-7 rounded cursor-pointer border border-surface-200"
                    />
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={selected.strokeWidth ?? 0}
                    onChange={(e) => commitPatch(selected.id, { strokeWidth: Number(e.target.value) })}
                    className="w-14 text-xs border border-surface-200 rounded-md px-2 py-1.5"
                    title="Border width"
                  />
                </>
              )}
              {selected.type === "rect" && (
                <label className="flex items-center gap-1.5 text-xs text-surface-500" title="Corner radius">
                  <CornerRadiusIcon className="w-4 h-4 text-surface-500" />
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={selected.radius ?? 0}
                    onChange={(e) => commitPatch(selected.id, { radius: Number(e.target.value) })}
                    className="w-14 text-xs border border-surface-200 rounded-md px-2 py-1.5"
                  />
                </label>
              )}
            </>
          )}

          {selected.type === "image" && (
            <>
              <button
                type="button"
                title="Adjust (brightness, contrast…)"
                onClick={() => setToolPanel((p) => (p === "adjust" ? null : "adjust"))}
                className={cn("p-1.5 rounded-md", toolPanel === "adjust" ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:bg-surface-100")}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Filters"
                onClick={() => setToolPanel((p) => (p === "filters" ? null : "filters"))}
                className={cn("p-1.5 rounded-md", toolPanel === "filters" ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:bg-surface-100")}
              >
                <Wand2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Crop"
                onClick={() => setToolPanel((p) => (p === "crop" ? null : "crop"))}
                className={cn("p-1.5 rounded-md", toolPanel === "crop" ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:bg-surface-100")}
              >
                <Crop className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Flip horizontal"
                onClick={() => commitPatch(selected.id, { flipH: !selected.flipH })}
                className={cn("p-1.5 rounded-md", selected.flipH ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:bg-surface-100")}
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Flip vertical"
                onClick={() => commitPatch(selected.id, { flipV: !selected.flipV })}
                className={cn("p-1.5 rounded-md", selected.flipV ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:bg-surface-100")}
              >
                <FlipVertical className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Effects & shadows"
                onClick={() => setToolPanel((p) => (p === "effects" ? null : "effects"))}
                className={cn("flex items-center gap-1 px-2 py-1.5 rounded-md text-xs", toolPanel === "effects" ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:bg-surface-100")}
              >
                <Sparkles className="w-4 h-4" /> Effects
              </button>
              <button
                type="button"
                title="Remove background"
                onClick={() => handleRemoveBg(selected)}
                disabled={bgRemoving !== null}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-surface-500 hover:bg-surface-100 disabled:opacity-50"
              >
                {bgRemoving === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eraser className="w-4 h-4" />}
                <span className="hidden lg:inline">Remove BG</span>
              </button>
              <div className="relative flex items-center rounded-md border border-surface-200">
                <button
                  ref={eraserBtnRef}
                  type="button"
                  title="Eraser options"
                  onClick={() => {
                    if (!eraserDropOpen && eraserBtnRef.current) {
                      const rect = eraserBtnRef.current.getBoundingClientRect();
                      setEraserDropPos({ top: rect.bottom + 4, left: rect.left });
                    }
                    setEraserDropOpen((v) => !v);
                  }}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-surface-500 hover:bg-surface-100"
                >
                  <PenTool className="w-4 h-4" />
                  <span className="hidden lg:inline">Eraser</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <button
                type="button"
                title="Magic Layers — split image into background + foreground layers"
                onClick={() => selected.src ? setMagicLayersEl(selected) : toast.error("No image to process")}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-surface-500 hover:bg-surface-100"
              >
                <Layers className="w-4 h-4" />
                <span className="hidden lg:inline">Magic Layers</span>
              </button>
              <label className="flex items-center gap-1.5 text-xs text-surface-500" title="Corner radius">
                <CornerRadiusIcon className="w-4 h-4 text-surface-500" />
                <input
                  type="number"
                  min={0}
                  max={2000}
                  value={selected.radius ?? 0}
                  onChange={(e) => commitPatch(selected.id, { radius: Number(e.target.value) })}
                  className="w-14 text-xs border border-surface-200 rounded-md px-2 py-1.5"
                />
              </label>
            </>
          )}

          {selected.type === "frame" && (
            <>
              <div className="w-px h-5 bg-surface-200 mx-1" />
              <button
                type="button"
                title={selected.src ? "Replace image in frame" : "Fill frame with image"}
                onClick={() => setPanel("uploads")}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-surface-500 hover:bg-surface-100"
              >
                <ImagePlus className="w-4 h-4" />
                <span className="hidden sm:inline">{selected.src ? "Replace" : "Fill image"}</span>
              </button>
              {selected.src && (
                <button
                  type="button"
                  title="Remove image from frame"
                  onClick={() => commitPatch(selected.id, { src: undefined })}
                  className="p-1.5 rounded-md text-surface-500 hover:bg-surface-100 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          <label className="flex items-center gap-1.5 text-xs text-surface-500 ml-1">
            Opacity
            <input
              type="range"
              min={5}
              max={100}
              value={Math.round((selected.opacity ?? 1) * 100)}
              onChange={(e) => commitPatch(selected.id, { opacity: Number(e.target.value) / 100 })}
              className="w-20 accent-brand-600"
            />
          </label>

          <div className="w-px h-5 bg-surface-200 mx-1" />
          <button
            type="button"
            title="Position & arrange"
            onClick={() => setToolPanel((p) => (p === "position" ? null : "position"))}
            className={cn("flex items-center gap-1 px-2 py-1.5 rounded-md text-xs", toolPanel === "position" ? "bg-brand-50 text-brand-600" : "text-surface-500 hover:bg-surface-100")}
          >
            <Move className="w-4 h-4" /> Position
          </button>
          <button
            type="button"
            onClick={() => setToolPanel((p) => (p === "animate" ? null : "animate"))}
            className={cn("flex items-center gap-1 px-2 py-1.5 rounded-md text-xs hover:bg-surface-100", toolPanel === "animate" ? "text-brand-600 bg-brand-50" : "text-surface-500")}
          >
            <Play className="w-4 h-4" />
            <span className="hidden lg:inline">Animate</span>
          </button>
          <button type="button" title="Bring forward" onClick={() => moveLayer(1)} className="p-1.5 rounded-md text-surface-500 hover:bg-surface-100"><ChevronUp className="w-4 h-4" /></button>
          <button type="button" title="Send backward" onClick={() => moveLayer(-1)} className="p-1.5 rounded-md text-surface-500 hover:bg-surface-100"><ChevronDown className="w-4 h-4" /></button>
          <button type="button" title="Duplicate (Ctrl+D)" onClick={duplicateSelected} className="p-1.5 rounded-md text-surface-500 hover:bg-surface-100"><Copy className="w-4 h-4" /></button>
          <button type="button" title="Delete (Del)" onClick={deleteSelected} className="p-1.5 rounded-md text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
        </>
        ) : (
          <span className="text-xs text-surface-400">Select an element to edit it, or choose a tool from the left panel.</span>
        )}
      </div>


      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Icon rail */}
        <div className="flex flex-col items-center gap-1 py-3 px-1.5 border-r border-surface-200 bg-white shrink-0">
          {([
            ["design", LayoutTemplate, "Design"],
            ["elements", Shapes, "Elements"],
            ["text", Type, "Text"],
            ["uploads", ImagePlus, "Uploads"],
            ["background", PaintBucket, "Background"],
          ] as [PanelTab, React.ElementType, string][]).map(([tab, Icon, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setToolPanel(null);
                if (panel === tab && panelOpen) setPanelOpen(false);
                else { setPanel(tab); setPanelOpen(true); }
              }}
              title={label}
              className={cn(
                "flex flex-col items-center gap-0.5 w-14 py-2 rounded-lg text-[10px] font-medium transition-colors",
                panel === tab && panelOpen && !toolPanel ? "bg-brand-50 text-brand-700" : "text-surface-500 hover:bg-surface-100"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Panel content (collapsible to give the canvas more room) */}
        {(panelOpen || toolPanel) && (
        <div className="w-52 sm:w-60 border-r border-surface-200 bg-white shrink-0 flex flex-col overflow-hidden">
          {toolPanel ? (
            <div className="p-3 flex-1 min-h-0 flex flex-col overflow-hidden">{renderToolPanelContent()}</div>
          ) : (
          <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-0">
            {panel === "design" && (
              <>
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Templates for this size</p>
                {formatTemplates.length === 0 && <p className="text-xs text-surface-400">No templates match this canvas size — browse all below.</p>}
                <div className="grid grid-cols-2 gap-2">
                  {formatTemplates.map((tpl) => (
                    <button key={tpl.id} type="button" onClick={() => applyTemplate(tpl.id)} className="rounded-lg border border-surface-200 overflow-hidden hover:border-brand-400 transition-colors">
                      <PageRenderer
                        page={{ id: "t", background: tpl.pages[0].background, elements: tpl.pages[0].elements.map((el, i) => ({ ...el, id: `x${i}` })) }}
                        width={tpl.width} height={tpl.height} displayWidth={104}
                      />
                      <p className="text-[10px] text-surface-600 p-1 truncate">{tpl.label}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide pt-2">All templates</p>
                <div className="grid grid-cols-2 gap-2">
                  {otherTemplates.map((tpl) => (
                    <button key={tpl.id} type="button" onClick={() => applyTemplate(tpl.id)} title="Elements will be placed on this canvas size" className="rounded-lg border border-surface-200 overflow-hidden hover:border-brand-400 transition-colors">
                      <div className="h-20 overflow-hidden flex items-start justify-center bg-surface-100">
                        <PageRenderer
                          page={{ id: "t", background: tpl.pages[0].background, elements: tpl.pages[0].elements.map((el, i) => ({ ...el, id: `x${i}` })) }}
                          width={tpl.width} height={tpl.height} displayWidth={104}
                        />
                      </div>
                      <p className="text-[10px] text-surface-600 p-1 truncate">{tpl.label}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {panel === "elements" && (
              <>
                <div className="flex gap-1 rounded-lg bg-surface-100 p-0.5">
                  {([["shapes", "Shapes"], ["frames", "Frames"], ["graphics", "Graphics"]] as const).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setElementsTab(v)}
                      className={cn("flex-1 py-1.5 text-xs font-medium rounded-md transition-colors", elementsTab === v ? "bg-white text-surface-900 shadow-sm" : "text-surface-500 hover:text-surface-700")}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                {elementsTab === "shapes" && (
                  <>
                    {SHAPE_GROUPS.map((group) => (
                      <div key={group}>
                        <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">{group}</p>
                        <div className="grid grid-cols-4 gap-2">
                          {SHAPES.filter((s) => s.group === group).map((def) => (
                            <button
                              key={def.id}
                              type="button"
                              onClick={() => addElement(shapeElement(def, W, H))}
                              title={def.label}
                              className="aspect-square rounded-lg border border-surface-200 flex items-center justify-center hover:border-brand-400 p-2"
                            >
                              {def.kind === "line" ? (
                                <span className="w-full relative" style={{ borderTop: def.dashed ? "2px dashed #475569" : "2px solid #475569" }}>
                                  {def.arrowLine && (
                                    <span style={{ position: "absolute", right: -1, top: -4, width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "6px solid #475569" }} />
                                  )}
                                </span>
                              ) : (
                                <span
                                  className="w-6 h-6"
                                  style={{
                                    background: "#475569",
                                    clipPath: def.kind === "triangle" ? "polygon(50% 0%, 100% 100%, 0% 100%)" : def.clipPath,
                                    borderRadius: def.kind === "ellipse" ? "50%" : def.rounded ? 5 : (def.clipPath || def.kind === "triangle") ? 0 : 2,
                                  }}
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {elementsTab === "frames" && !showFrameMaker && (
                  <>
                    <p className="text-[10px] text-surface-400 leading-relaxed">Add a frame, then select it and click an image to fill it · double-click a filled frame to enter crop mode</p>
                    <button
                      type="button"
                      onClick={() => setShowFrameMaker(true)}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-dashed border-brand-400 text-brand-600 text-xs font-medium hover:bg-brand-50 transition-colors"
                    >
                      <PenTool className="w-3.5 h-3.5" /> Frame Maker
                    </button>
                    {FRAME_GROUPS.map((group) => (
                      <div key={group}>
                        <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide mb-1.5">{group}</p>
                        <div className="grid grid-cols-4 gap-2">
                          {FRAMES.filter((f) => f.group === group).map((frame) => (
                            <button
                              key={frame.id}
                              type="button"
                              onClick={() => insertFrame(frame)}
                              title={frame.label}
                              className="aspect-square rounded-lg border border-surface-200 flex items-center justify-center hover:border-brand-400 p-2 bg-surface-50"
                            >
                              <span
                                className="w-7 h-7 bg-surface-400"
                                style={{ clipPath: frame.clipPath || undefined, display: "block" }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {elementsTab === "frames" && showFrameMaker && (() => {
                  const PREVIEW = 200;
                  const gridStep = PREVIEW / fmGridCols;
                  function snapPt(v: number) {
                    return fmGridSnap ? Math.round(v / gridStep) * gridStep : v;
                  }
                  const clipPath = `polygon(${fmPts.map((p) => `${Math.round(p.x * 100)}% ${Math.round(p.y * 100)}%`).join(", ")})`;
                  return (
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setShowFrameMaker(false)} className="p-1 rounded text-surface-400 hover:text-surface-700">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-semibold text-surface-700">Frame Maker</span>
                      </div>

                      {/* SVG Preview */}
                      <div className="rounded-xl border border-surface-200 overflow-hidden bg-surface-50">
                        <svg
                          width={PREVIEW} height={PREVIEW}
                          style={{ display: "block", cursor: "crosshair" }}
                          onDoubleClick={(e) => {
                            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                            const rawX = (e.clientX - rect.left) / PREVIEW;
                            const rawY = (e.clientY - rect.top) / PREVIEW;
                            const sx = snapPt(rawX * PREVIEW) / PREVIEW;
                            const sy = snapPt(rawY * PREVIEW) / PREVIEW;
                            setFmPts((pts) => [...pts, { x: Math.max(0, Math.min(1, sx)), y: Math.max(0, Math.min(1, sy)) }]);
                          }}
                        >
                          {/* Grid */}
                          {fmGridSnap && Array.from({ length: fmGridCols + 1 }).map((_, i) => (
                            <g key={i}>
                              <line x1={i * gridStep} y1={0} x2={i * gridStep} y2={PREVIEW} stroke="#e2e8f0" strokeWidth={0.5} />
                              <line x1={0} y1={i * gridStep} x2={PREVIEW} y2={i * gridStep} stroke="#e2e8f0" strokeWidth={0.5} />
                            </g>
                          ))}
                          {/* Shape preview */}
                          <polygon
                            points={fmPts.map((p) => `${p.x * PREVIEW},${p.y * PREVIEW}`).join(" ")}
                            fill="#c4b5fd" stroke="#7c3aed" strokeWidth={1.5}
                          />
                          {/* Control points */}
                          {fmPts.map((p, i) => (
                            <circle
                              key={i}
                              cx={p.x * PREVIEW} cy={p.y * PREVIEW} r={fmDraggingPt === i ? 7 : 5}
                              fill={fmDraggingPt === i ? "#7c3aed" : "#fff"} stroke="#7c3aed" strokeWidth={2}
                              style={{ cursor: "grab" }}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                setFmDraggingPt(i);
                                (e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId);
                                const svg = (e.currentTarget as SVGElement).closest("svg")!;
                                const rect = svg.getBoundingClientRect();
                                function onMove(ev: PointerEvent) {
                                  const rx = Math.max(0, Math.min(1, (ev.clientX - rect.left) / PREVIEW));
                                  const ry = Math.max(0, Math.min(1, (ev.clientY - rect.top) / PREVIEW));
                                  const sx = snapPt(rx * PREVIEW) / PREVIEW;
                                  const sy = snapPt(ry * PREVIEW) / PREVIEW;
                                  setFmPts((pts) => pts.map((pt, j) => j === i ? { x: sx, y: sy } : pt));
                                }
                                function onUp() {
                                  setFmDraggingPt(null);
                                  window.removeEventListener("pointermove", onMove);
                                  window.removeEventListener("pointerup", onUp);
                                }
                                window.addEventListener("pointermove", onMove);
                                window.addEventListener("pointerup", onUp);
                              }}
                            />
                          ))}
                        </svg>
                        <p className="text-[10px] text-surface-400 text-center py-1.5 border-t border-surface-200">Double click to add a point · drag to move</p>
                      </div>

                      {/* Remove last point */}
                      <button
                        type="button"
                        disabled={fmPts.length <= 3}
                        onClick={() => setFmPts((pts) => pts.slice(0, -1))}
                        className="w-full py-1.5 rounded-lg border border-surface-200 text-xs text-surface-600 hover:bg-surface-50 disabled:opacity-40"
                      >
                        Remove last point
                      </button>

                      {/* Grid snapping */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-surface-600">Grid snapping</span>
                        <button
                          type="button"
                          onClick={() => setFmGridSnap((v) => !v)}
                          className={cn("w-10 h-5 rounded-full transition-colors relative", fmGridSnap ? "bg-brand-600" : "bg-surface-300")}
                        >
                          <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", fmGridSnap ? "translate-x-5" : "translate-x-0.5")} />
                        </button>
                      </div>

                      {/* Grid columns */}
                      <div>
                        <div className="flex justify-between text-xs text-surface-600 mb-1">
                          <span>Grid columns</span>
                          <span>{fmGridCols}</span>
                        </div>
                        <input
                          type="range" min={4} max={20} step={1} value={fmGridCols}
                          onChange={(e) => setFmGridCols(Number(e.target.value))}
                          className="w-full accent-brand-600"
                        />
                      </div>

                      {/* Add to canvas */}
                      <button
                        type="button"
                        disabled={fmPts.length < 3}
                        onClick={() => {
                          const size = Math.min(W, H) * 0.4;
                          addElement({
                            type: "frame",
                            x: W / 2 - size / 2, y: H / 2 - size / 2, w: size, h: size,
                            rotation: 0, opacity: 1, clipPath,
                          });
                          setShowFrameMaker(false);
                        }}
                        className="w-full py-2 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 disabled:opacity-40"
                      >
                        Add to Canvas
                      </button>

                      {/* Preset shapes */}
                      <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide">Shapes</p>
                      <div className="grid grid-cols-4 gap-2">
                        {FRAMES.filter((f) => f.clipPath).slice(0, 8).map((frame) => (
                          <button
                            key={frame.id}
                            type="button"
                            onClick={() => insertFrame(frame)}
                            title={frame.label}
                            className="aspect-square rounded-lg border border-surface-200 flex items-center justify-center hover:border-brand-400 p-2 bg-surface-50"
                          >
                            <span className="w-7 h-7 bg-surface-400" style={{ clipPath: frame.clipPath || undefined, display: "block" }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {elementsTab === "graphics" && (
                  <>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-surface-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        value={graphicsSearch}
                        onChange={(e) => setGraphicsSearch(e.target.value)}
                        placeholder="Search graphics"
                        className="w-full rounded-lg border border-surface-200 pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    {/* Category chips — hidden during search */}
                    {!graphicsSearch && (
                      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide" style={{ flexWrap: "nowrap" }}>
                        <button
                          type="button"
                          onClick={() => setGraphicsCat("")}
                          className={cn("flex-shrink-0 text-[10px] px-1.5 py-1 rounded-full border whitespace-nowrap", graphicsCat === "" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-surface-200 text-surface-500 hover:bg-surface-50")}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => setGraphicsCat("balloons")}
                          className={cn("flex-shrink-0 text-[10px] px-1.5 py-1 rounded-full border whitespace-nowrap", graphicsCat === "balloons" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-surface-200 text-surface-500 hover:bg-surface-50")}
                        >
                          🎈 Balloons
                        </button>
                        {EMOJI_GRAPHICS.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setGraphicsCat(c.id)}
                            className={cn("flex-shrink-0 text-[10px] px-1.5 py-1 rounded-full border whitespace-nowrap", graphicsCat === c.id ? "border-brand-500 bg-brand-50 text-brand-700" : "border-surface-200 text-surface-500 hover:bg-surface-50")}
                          >
                            {c.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setGraphicsCat("decor")}
                          className={cn("flex-shrink-0 text-[10px] px-1.5 py-1 rounded-full border whitespace-nowrap", graphicsCat === "decor" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-surface-200 text-surface-500 hover:bg-surface-50")}
                        >
                          Decorative
                        </button>
                      </div>
                    )}

                    {/* Balloon panel */}
                    {!graphicsSearch && graphicsCat === "balloons" && (
                      <>
                        <div className="flex gap-1 flex-wrap">
                          {BALLOON_PRESETS.map((p, i) => (
                            <button
                              key={i}
                              type="button"
                              title={p.label}
                              onClick={() => setBalloonPresetIdx(i)}
                              className={cn("flex items-center gap-0.5 px-1.5 py-1 rounded-full border text-[10px]", balloonPresetIdx === i ? "border-brand-500 bg-brand-50 text-brand-700" : "border-surface-200 text-surface-500 hover:bg-surface-50")}
                            >
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.pri }} />
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.sec }} />
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.acc }} />
                              <span className="ml-0.5">{p.label}</span>
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {BALLOON_TEMPLATES.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              title={t.label}
                              onClick={() => {
                                const preset = BALLOON_PRESETS[balloonPresetIdx];
                                const resolved = applyBalloonColors(t.svg, preset);
                                const vbMatch = t.svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
                                const vbW = vbMatch ? parseFloat(vbMatch[1]) : 100;
                                const vbH = vbMatch ? parseFloat(vbMatch[2]) : 100;
                                const maxDim = Math.min(W, H) * 0.4;
                                const scale = maxDim / Math.max(vbW, vbH);
                                const ew = Math.round(vbW * scale);
                                const eh = Math.round(vbH * scale);
                                addElement({ type: "svg", svg: resolved, x: Math.round((W - ew) / 2), y: Math.round((H - eh) / 2), w: ew, h: eh, rotation: 0, opacity: 1 });
                              }}
                              className="aspect-square rounded-lg border border-surface-200 flex items-center justify-center hover:border-brand-400 p-1.5 bg-surface-50"
                              dangerouslySetInnerHTML={{ __html: applyBalloonColors(t.svg, BALLOON_PRESETS[balloonPresetIdx]) }}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Decorative SVG doodles — shown when decor selected, or all, or searching */}
                    {(graphicsCat === "decor" || graphicsCat === "" || graphicsSearch) && (
                      <>
                        {graphicsCat === "" && !graphicsSearch && (
                          <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide">Decorative</p>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          {SVG_GRAPHICS.filter((g) => !graphicsSearch || (g.label + " " + g.group).toLowerCase().includes(graphicsSearch.toLowerCase())).map((g) => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => insertSvgGraphic(g)}
                              title={g.label}
                              className="aspect-square rounded-lg border border-surface-200 flex items-center justify-center hover:border-brand-400 p-1.5"
                              dangerouslySetInnerHTML={{ __html: g.svg }}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Emoji graphics */}
                    {!graphicsSearch && graphicsCat !== "decor" && graphicsCat !== "balloons" && (
                      graphicsCat === "" ? (
                        /* Show all categories with section headers */
                        EMOJI_GRAPHICS.map((cat) => (
                          <div key={cat.id}>
                            <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide mb-1">{cat.label}</p>
                            <div className="grid grid-cols-6 gap-1 mb-2">
                              {cat.items.map((ch, i) => (
                                <button
                                  key={`${ch}-${i}`}
                                  type="button"
                                  onClick={() => insertEmoji(ch)}
                                  className="aspect-square rounded-md hover:bg-surface-100 flex items-center justify-center text-xl"
                                >
                                  {ch}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="grid grid-cols-6 gap-1">
                          {(EMOJI_GRAPHICS.find((c) => c.id === graphicsCat)?.items ?? []).map((ch, i) => (
                            <button
                              key={`${ch}-${i}`}
                              type="button"
                              onClick={() => insertEmoji(ch)}
                              className="aspect-square rounded-md hover:bg-surface-100 flex items-center justify-center text-xl"
                            >
                              {ch}
                            </button>
                          ))}
                        </div>
                      )
                    )}
                    {graphicsSearch && (
                      <div className="grid grid-cols-6 gap-1">
                        {EMOJI_GRAPHICS.flatMap((c) => c.items).filter((ch) => ch.includes(graphicsSearch)).map((ch, i) => (
                          <button key={`${ch}-${i}`} type="button" onClick={() => insertEmoji(ch)} className="aspect-square rounded-md hover:bg-surface-100 flex items-center justify-center text-xl">{ch}</button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <p className="text-[11px] text-surface-400">Tap any element to add it, then drag, resize, and recolor it.</p>
              </>
            )}

            {panel === "text" && (
              <>
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Add text</p>
                <button type="button" onClick={() => insertText("heading")} className="w-full text-left rounded-lg border border-surface-200 px-3 py-2.5 hover:border-brand-400">
                  <span className="text-xl font-bold text-surface-900">Add a heading</span>
                </button>
                <button type="button" onClick={() => insertText("subheading")} className="w-full text-left rounded-lg border border-surface-200 px-3 py-2.5 hover:border-brand-400">
                  <span className="text-base font-semibold text-surface-800">Add a subheading</span>
                </button>
                <button type="button" onClick={() => insertText("body")} className="w-full text-left rounded-lg border border-surface-200 px-3 py-2.5 hover:border-brand-400">
                  <span className="text-sm text-surface-700">Add a little bit of body text</span>
                </button>
                <p className="text-[11px] text-surface-400">Double-click any text on the canvas to edit it.</p>
              </>
            )}

            {panel === "uploads" && (
              <>
                {/* Source tabs: local uploads vs the shared Google Drive library */}
                <div className="flex rounded-lg border border-surface-200 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setUploadsTab("uploads")}
                    className={cn("flex-1 py-1.5 font-medium transition-colors", uploadsTab === "uploads" ? "bg-brand-600 text-white" : "text-surface-500 hover:bg-surface-50")}
                  >
                    My Uploads
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadsTab("drive")}
                    className={cn("flex-1 py-1.5 font-medium transition-colors flex items-center justify-center gap-1.5", uploadsTab === "drive" ? "bg-brand-600 text-white" : "text-surface-500 hover:bg-surface-50")}
                  >
                    <svg viewBox="0 0 87.3 78" className="w-3.5 h-3.5 shrink-0" aria-hidden>
                      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0a15.92 15.92 0 0 0 2.1 8z" fill="#0066da"/>
                      <path d="M43.65 25-13.75 0 0 23.8l27.55-23.8z" fill="#00ac47"/>
                      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25a15.92 15.92 0 0 0 2.2-8H60.5l5.85 13.35z" fill="#ea4335"/>
                      <path d="M43.65 25 30 1.2a16.27 16.27 0 0 0-8 2.1L6.6 15.55 22.1 43z" fill="#00832d"/>
                      <path d="M60.5 49.3H27.15L13.4 73.1c1.35.8 2.9 1.2 4.5 1.2h51.5c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                      <path d="M73.4 15.55 57.9 3.3a16.27 16.27 0 0 0-8-2.1L43.65 25l16.85 24.3H87.3L80.6 37.15z" fill="#ffba00"/>
                    </svg>
                    Google Drive
                  </button>
                </div>

                {uploadsTab === "drive" && <DriveBrowser onPick={handleDrivePick} />}

                {uploadsTab === "uploads" && (
                <>
                <Button variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()} loading={uploading}>
                  <ImagePlus className="w-4 h-4" />
                  {uploading && uploadProgress ? `Uploading ${uploadProgress}…` : "Upload Images"}
                </Button>
                <p className="text-[10px] text-surface-400 -mt-1">Select up to 10 images at once · PNG, JPG, WebP, SVG</p>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" multiple className="hidden" onChange={handleUpload} />
                {imgAssets.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {imgAssets.map((a) => (
                      <div key={a.id} className="relative group/asset">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.url}
                          alt={a.name}
                          draggable
                          onDragStart={(e) => { e.dataTransfer.setData("text/plain", a.url); e.dataTransfer.effectAllowed = "copy"; }}
                          onClick={() => { if (selected?.type === "frame") { commitPatch(selected.id, { src: a.url }); } else { insertImage(a.url); } }}
                          className="rounded-lg border border-surface-200 cursor-pointer hover:border-brand-400 object-cover aspect-square w-full"
                        />
                        <button
                          type="button"
                          title="Delete upload"
                          onClick={() => handleDeleteAsset(a)}
                          className="absolute top-1 right-1 p-1 rounded-md bg-white/90 text-surface-500 hover:text-red-600 opacity-0 group-hover/asset:opacity-100 transition-opacity shadow-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-surface-400">No uploads yet. PNG, JPG, WebP, or SVG up to 10 MB.</p>
                )}
                <p className="text-[11px] text-surface-400">Your uploads are saved here — click any to reuse it in this or another design.</p>
                </>
                )}
              </>
            )}

            {panel === "background" && (
              <>
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Page background</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {BG_SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { pushHistory(); setPageAt(pageIdx, (p) => ({ ...p, background: c })); }}
                      className={cn("aspect-square rounded-md border", page.background === c ? "ring-2 ring-brand-500 border-white" : "border-surface-200")}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <label className="flex items-center gap-2 text-xs text-surface-600">
                  Custom
                  <input
                    type="color"
                    value={page.background}
                    onChange={(e) => { setPageAt(pageIdx, (p) => ({ ...p, background: e.target.value })); }}
                    className="w-8 h-8 rounded cursor-pointer border border-surface-200"
                  />
                </label>
              </>
            )}
          </div>
          )}
        </div>
        )}

        {/* Canvas viewport */}
        <div
          ref={viewportRef}
          className="flex-1 overflow-auto"
          style={{ userSelect: "none" }}
          onPointerDown={() => { setSelectedId(null); setEditingId(null); if (toolPanel !== "fonts") setToolPanel(null); setEraserDropOpen(false); }}
        >
          <div className="min-w-fit min-h-full flex items-center justify-center p-12">
            <div style={{ width: W * zoom, height: H * zoom, flexShrink: 0 }}>
              <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", position: "relative" }}>
                {/* The page */}
                <div
                  ref={pageRef}
                  className="relative shadow-xl"
                  style={{ width: W, height: H, background: page.background, overflow: "hidden", touchAction: "none", userSelect: "none" }}
                  onPointerDown={onCanvasBackgroundPointerDown}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const url = e.dataTransfer.getData("text/plain");
                    if (!url) return;
                    insertImage(url);
                  }}
                >
                  {page.elements.map((el) => (
                    <div
                      key={el.id}
                      onPointerDown={(e) => onElementPointerDown(el, e)}
                      onPointerEnter={() => setHoveredId(el.id)}
                      onPointerLeave={() => setHoveredId((h) => (h === el.id ? null : h))}
                      onDoubleClick={() => {
                        if (el.type === "text" && !el.locked) { setEditingId(el.id); setSelectedId(el.id); }
                        else if (el.type === "image") {
                          setSelectedId(el.id);
                          // Cover-fit (natural ratio) handled by the crop entry effect
                          setToolPanel("crop");
                        }
                        else if (el.type === "frame") {
                          setSelectedId(el.id);
                          if (el.src) {
                            setToolPanel("crop");
                          } else {
                            setPanel("uploads");
                          }
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingId(null);
                        // Keep an existing multi-selection if right-clicking inside it
                        // (so Group/align/etc. act on the whole selection); otherwise
                        // select this element (or all its group mates).
                        if (!selectedIdsRef.current.includes(el.id)) {
                          const els = pagesRef.current[pageIdxRef.current].elements;
                          const mates = el.groupId ? els.filter((x) => x.groupId === el.groupId).map((x) => x.id) : [el.id];
                          setSelectedIds(mates);
                        }
                        setCtxMenu({ x: e.clientX, y: e.clientY, elId: el.id });
                      }}
                      {...(el.type === "frame" ? {
                        onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "copy"; setFrameDragOver(el.id); },
                        onDragLeave: () => setFrameDragOver(null),
                        onDrop: (e: React.DragEvent) => {
                          e.preventDefault(); e.stopPropagation(); setFrameDragOver(null);
                          const url = e.dataTransfer.getData("text/plain");
                          if (url) { pushHistory(); commitPatch(el.id, { src: url }); setSelectedId(el.id); }
                        },
                      } : {})}
                      style={{ cursor: el.locked ? "default" : editingId === el.id ? "text" : "move", touchAction: "none", outline: frameDragOver === el.id ? "3px solid #7c3aed" : undefined, outlineOffset: frameDragOver === el.id ? "2px" : undefined }}
                    >
                      {editingId === el.id && el.type === "text" ? (
                        <textarea
                          autoFocus
                          value={el.text}
                          onChange={(e) => patchEl(el.id, { text: e.target.value })}
                          onBlur={() => setEditingId(null)}
                          onPointerDown={(e) => e.stopPropagation()}
                          style={{
                            position: "absolute",
                            left: el.x,
                            top: el.y,
                            width: el.w,
                            height: Math.max(el.h, (el.fontSize ?? 24) * 2),
                            transform: `rotate(${el.rotation}deg)`,
                            fontSize: el.fontSize,
                            fontFamily: el.fontFamily,
                            fontWeight: el.fontWeight,
                            fontStyle: el.fontStyle,
                            textAlign: el.textAlign,
                            lineHeight: el.lineHeight ?? 1.3,
                            letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                            color: el.color,
                            background: "transparent",
                            border: "1px dashed #7c3aed",
                            outline: "none",
                            resize: "none",
                            overflow: "hidden",
                            padding: 0,
                            zIndex: 1001,
                          }}
                        />
                      ) : (animPreviewVersion[el.id] ?? 0) > 0 && el.animation && el.animation.trigger !== "exit" ? (
                        <div
                          key={`anim-${el.id}-${animPreviewVersion[el.id]}`}
                          style={{
                            position: "absolute",
                            left: el.x,
                            top: el.y,
                            width: el.w,
                            height: el.h,
                            animation: `${getAnimKeyframeName(el.animation)} ${getAnimDuration(el.animation.speed ?? 0.5)}s ease both`,
                          }}
                        >
                          <ElementView el={el} asChild />
                        </div>
                      ) : (
                        <ElementView el={el} />
                      )}
                    </div>
                  ))}

                  {/* Grid overlay */}
                  {showGrid && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        backgroundImage:
                          "linear-gradient(to right, rgba(124,58,237,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(124,58,237,0.08) 1px, transparent 1px)",
                        backgroundSize: "50px 50px",
                      }}
                    />
                  )}

                  {/* Hover outline (before click) */}
                  {hoveredId && hoveredId !== selectedId && !dragRef.current && (() => {
                    const h = page.elements.find((e) => e.id === hoveredId);
                    if (!h) return null;
                    return (
                      <div
                        style={{
                          position: "absolute", left: h.x, top: h.y, width: h.w, height: h.h,
                          transform: `rotate(${h.rotation}deg)`,
                          border: `${1.5 / zoom}px solid #a78bfa`, pointerEvents: "none", zIndex: 999,
                        }}
                      />
                    );
                  })()}

                  {/* Snap guides */}
                  {guides.v !== null && (
                    <div style={{ position: "absolute", left: guides.v, top: 0, bottom: 0, width: 1.5 / zoom, background: "#ec4899", pointerEvents: "none", zIndex: 1002 }} />
                  )}
                  {guides.h !== null && (
                    <div style={{ position: "absolute", top: guides.h, left: 0, right: 0, height: 1.5 / zoom, background: "#ec4899", pointerEvents: "none", zIndex: 1002 }} />
                  )}

                  {/* Distance measurements while dragging */}
                  {dragRef.current?.mode === "move" && selected && renderDistanceGuides(selected)}

                  {/* Marquee rubber-band */}
                  {marquee && (
                    <div
                      style={{
                        position: "absolute", left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h,
                        border: `${1 / zoom}px solid #7c3aed`, background: "rgba(124,58,237,0.08)", pointerEvents: "none", zIndex: 1005,
                      }}
                    />
                  )}

                  {/* Crop dark-mask SVG — dims everything outside the selected element */}
                  {toolPanel === "crop" && selected && (selected.type === "image" || (selected.type === "frame" && selected.src)) && (
                    <svg
                      style={{ position: "absolute", left: 0, top: 0, width: W, height: H, zIndex: 1098, pointerEvents: "none" }}
                      viewBox={`0 0 ${W} ${H}`}
                    >
                      <defs>
                        <mask id={`cm-${selected.id}`}>
                          <rect width={W} height={H} fill="white" />
                          <rect
                            x={selected.x} y={selected.y} width={selected.w} height={selected.h}
                            fill="black"
                            rx={selected.radius ?? 0}
                            transform={`rotate(${selected.rotation} ${selected.x + selected.w / 2} ${selected.y + selected.h / 2})`}
                          />
                        </mask>
                      </defs>
                      <rect width={W} height={H} fill="rgba(0,0,0,0.52)" mask={`url(#cm-${selected.id})`} />
                    </svg>
                  )}

                  {/* Frame border highlight in crop mode */}
                  {toolPanel === "crop" && selected && (
                    <div style={{
                      position: "absolute", left: selected.x, top: selected.y, width: selected.w, height: selected.h,
                      transform: `rotate(${selected.rotation}deg)`,
                      border: `${2 / zoom}px solid white`, zIndex: 1099, pointerEvents: "none",
                      borderRadius: selected.radius,
                    }} />
                  )}

                </div>

                {/* ── Selection chrome portal (rendered at document.body so it escapes all overflow clipping) ── */}
                {selectedIds.length > 1 ? renderMultiSelectionChrome() : selected && editingId !== selected.id && toolPanel !== "crop" && renderSelectionChrome(selected)}

                {/* ── Visual Crop Overlay — draggable image outside page div (avoids overflow:hidden) ── */}
                {toolPanel === "crop" && selected && (selected.type === "image" || (selected.type === "frame" && selected.src)) && (() => {
                  const _cover = coverRect(selected.w, selected.h, cropRatioFor(selected));
                  const cropX = selected.cropX ?? _cover.cropX;
                  const cropY = selected.cropY ?? _cover.cropY;
                  const cropW = selected.cropW ?? _cover.cropW;
                  const cropH = selected.cropH ?? _cover.cropH;
                  const eRot = selected.rotation;
                  const eCx = selected.x + selected.w / 2;
                  const eCy = selected.y + selected.h / 2;
                  const HANDLE_SIZE = Math.max(8, 10 / zoom);
                  const handles: { id: CropDragState["mode"]; cx: number; cy: number; cursor: string }[] = [
                    { id: "nw", cx: 0,   cy: 0,   cursor: "nw-resize" },
                    { id: "n",  cx: 0.5, cy: 0,   cursor: "n-resize"  },
                    { id: "ne", cx: 1,   cy: 0,   cursor: "ne-resize" },
                    { id: "w",  cx: 0,   cy: 0.5, cursor: "w-resize"  },
                    { id: "e",  cx: 1,   cy: 0.5, cursor: "e-resize"  },
                    { id: "sw", cx: 0,   cy: 1,   cursor: "sw-resize" },
                    { id: "s",  cx: 0.5, cy: 1,   cursor: "s-resize"  },
                    { id: "se", cx: 1,   cy: 1,   cursor: "se-resize" },
                  ];
                  return (
                    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, overflow: "visible", zIndex: 1097 }}>
                      {/* Draggable image */}
                      <div
                        style={{
                          position: "absolute",
                          left: selected.x + cropX,
                          top: selected.y + cropY,
                          width: cropW,
                          height: cropH,
                          transform: `rotate(${eRot}deg)`,
                          transformOrigin: `${eCx - (selected.x + cropX)}px ${eCy - (selected.y + cropY)}px`,
                          border: `${1.5 / zoom}px dashed rgba(255,255,255,0.7)`,
                          cursor: "move",
                          touchAction: "none",
                        }}
                        onPointerDown={(e) => startCropDrag(e, "pan", selected)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selected.src}
                          alt=""
                          draggable={false}
                          style={{
                            width: "100%", height: "100%", objectFit: "fill", display: "block",
                            transform: selected.cropRotation ? `rotate(${selected.cropRotation}deg)` : undefined,
                            transformOrigin: "50% 50%",
                            userSelect: "none", pointerEvents: "none",
                          }}
                        />
                        {/* Resize handles */}
                        {handles.map((h) => (
                          <div
                            key={h.id}
                            onPointerDown={(e) => startCropDrag(e, h.id, selected)}
                            style={{
                              position: "absolute",
                              left: `calc(${h.cx * 100}% - ${HANDLE_SIZE / 2}px)`,
                              top: `calc(${h.cy * 100}% - ${HANDLE_SIZE / 2}px)`,
                              width: HANDLE_SIZE, height: HANDLE_SIZE,
                              background: "white",
                              border: `${1.5 / zoom}px solid #7c3aed`,
                              borderRadius: "50%",
                              cursor: h.cursor,
                              touchAction: "none",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pages strip (drag thumbnails to reorder) ── */}
      <div className="flex border-t border-surface-200 bg-white shrink-0" onDragOver={(e) => e.stopPropagation()} onDrop={(e) => e.stopPropagation()}>
        {/* Scrollable thumbnails — kept separate from action buttons so the dropdown isn't clipped */}
        <div className="flex items-center gap-1.5 pl-3 py-2 overflow-x-auto flex-1 min-w-0">
          {pages.map((p, i) => (
            <div
              key={p.id}
              data-page-index={i}
              onPointerDown={(e) => onPagePointerDown(i, e)}
              title="Tap to open · drag to reorder"
              className={cn(
                "relative rounded-md overflow-hidden border-2 shrink-0 cursor-grab active:cursor-grabbing select-none transition-all duration-150 ease-out",
                i === pageIdx ? "border-brand-500" : "border-surface-200 hover:border-surface-300",
                draggingPageId === p.id && "opacity-50 scale-95 shadow-lg z-10",
                draggingPageId && draggingPageId !== p.id && pageOver === i && "ring-2 ring-brand-500 ml-3"
              )}
              style={{ touchAction: "none" }}
            >
              <PageRenderer page={p} width={W} height={H} displayWidth={(56 * W) / H > 120 ? 120 : (56 * W) / H} />
              <span className="absolute bottom-0.5 left-1 text-[9px] font-semibold text-surface-500 bg-white/80 rounded px-0.5 pointer-events-none">{i + 1}</span>
            </div>
          ))}
        </div>

        {/* Fixed action buttons — NOT inside overflow-x-auto, so the template dropdown renders above without clipping */}
        <div className="flex items-center gap-1 px-2 py-2 border-l border-surface-100 shrink-0 relative">
          {/* Add blank + template chooser */}
          <button type="button" onClick={addPage} title="Add blank page" className="p-2 rounded-l-md border border-dashed border-surface-300 text-surface-400 hover:text-surface-700 hover:border-surface-400">
            <Plus className="w-4 h-4" />
          </button>
          <div className="relative">
            <button type="button" onClick={() => setAddPageOpen((o) => !o)} title="Add page from template" className={cn("p-2 rounded-r-md border border-l-0 border-dashed border-surface-300", addPageOpen ? "bg-brand-50 text-brand-600" : "text-surface-400 hover:text-surface-700 hover:border-surface-400")}>
              <ChevronUp className="w-4 h-4" />
            </button>
            {addPageOpen && (
              <>
                <div className="fixed inset-0 z-[90]" onPointerDown={() => setAddPageOpen(false)} />
                <div className="absolute bottom-full right-0 mb-2 z-[100] w-64 max-h-80 overflow-y-auto bg-white rounded-xl shadow-xl border border-surface-200 p-2">
                  <button type="button" onClick={() => { addPage(); setAddPageOpen(false); }} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-surface-700 hover:bg-surface-100">
                    <Plus className="w-3.5 h-3.5" /> Blank page
                  </button>
                  <button type="button" onClick={() => { duplicatePage(); setAddPageOpen(false); }} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-surface-700 hover:bg-surface-100">
                    <Copy className="w-3.5 h-3.5" /> Duplicate current
                  </button>
                  <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide px-2 pt-2 pb-1">From template</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CANVA_TEMPLATES.map((tpl) => (
                      <button key={tpl.id} type="button" onClick={() => addPageFromTemplate(tpl.id)} className="rounded-lg border border-surface-200 overflow-hidden hover:border-brand-400 text-left">
                        <div className="h-14 overflow-hidden bg-surface-100 flex items-start justify-center">
                          <PageRenderer page={{ id: "t", background: tpl.pages[0].background, elements: tpl.pages[0].elements.map((el, i) => ({ ...el, id: `x${i}` })) }} width={tpl.width} height={tpl.height} displayWidth={96} />
                        </div>
                        <p className="text-[9px] text-surface-600 px-1 py-0.5 truncate">{tpl.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button type="button" onClick={duplicatePage} title="Duplicate page" className="p-2 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100">
            <Copy className="w-4 h-4" />
          </button>
          <button type="button" onClick={deletePage} disabled={pages.length <= 1} title="Delete page" className="p-2 rounded-md text-surface-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30">
            <Trash2 className="w-4 h-4" />
          </button>
          {exportingAs === "pdf" && (
            <span className="flex items-center gap-1.5 text-xs text-surface-500 pl-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Rendering…
            </span>
          )}
          <span className="text-xs text-surface-400 hidden md:inline pl-1">{W} × {H}</span>
        </div>
      </div>

      {/* ── Right-click context menu ── */}
      {ctxMenu && (() => {
        const el = page.elements.find((x) => x.id === ctxMenu.elId);
        if (!el) return null;
        const mx = Math.min(ctxMenu.x, window.innerWidth - 240);
        const my = Math.min(ctxMenu.y, window.innerHeight - 420);
        const close = () => setCtxMenu(null);
        const item = (
          label: string,
          icon: React.ReactNode,
          onClick: () => void,
          opts?: { shortcut?: string; danger?: boolean; disabled?: boolean }
        ) => (
          <button
            type="button"
            disabled={opts?.disabled}
            onClick={() => { onClick(); close(); }}
            className={cn(
              "flex items-center gap-2.5 w-full px-3 py-1.5 text-xs rounded-md text-left",
              opts?.danger ? "text-red-600 hover:bg-red-50" : "text-surface-700 hover:bg-surface-100",
              opts?.disabled && "opacity-40 pointer-events-none"
            )}
          >
            {icon}
            <span className="flex-1">{label}</span>
            {opts?.shortcut && <span className="text-[10px] text-surface-400 bg-surface-100 rounded px-1 py-0.5">{opts.shortcut}</span>}
          </button>
        );
        return (
          <>
            <div
              className="fixed inset-0 z-[90]"
              onPointerDown={close}
              onContextMenu={(e) => { e.preventDefault(); close(); }}
            />
            <div
              className="fixed z-[100] bg-white rounded-xl shadow-xl border border-surface-200 py-1.5 px-1.5 w-56"
              style={{ left: mx, top: my }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {item("Copy", <Copy className="w-3.5 h-3.5" />, () => { clipboard.current = { ...el }; }, { shortcut: "Ctrl+C" })}
              {item("Copy style", <Paintbrush className="w-3.5 h-3.5" />, copyStyle, { shortcut: "Ctrl+Alt+C" })}
              {item("Paste", <ClipboardPaste className="w-3.5 h-3.5" />, () => {
                const src = clipboard.current;
                if (src) addElement({ ...src, x: src.x + 24, y: src.y + 24 });
              }, { shortcut: "Ctrl+V", disabled: !clipboard.current })}
              {item("Paste style", <Paintbrush className="w-3.5 h-3.5" />, pasteStyle, { disabled: !styleClipboard.current })}
              {item("Duplicate", <Copy className="w-3.5 h-3.5" />, duplicateSelected, { shortcut: "Ctrl+D" })}
              {item("Delete", <Trash2 className="w-3.5 h-3.5" />, deleteSelected, { shortcut: "DELETE", danger: true })}

              {(selectedIds.length >= 2 || selectedEls.some((x) => x.groupId)) && (
                <>
                  <div className="h-px bg-surface-100 my-1" />
                  {selectedIds.length >= 2 &&
                    item("Group", <Group className="w-3.5 h-3.5" />, groupSelected, { shortcut: "Ctrl+G" })}
                  {selectedEls.some((x) => x.groupId) &&
                    item("Ungroup", <Ungroup className="w-3.5 h-3.5" />, ungroupSelected, { shortcut: "Ctrl+Shift+G" })}
                </>
              )}

              <div className="h-px bg-surface-100 my-1" />

              {/* Layer submenu */}
              <div className="relative group/layer">
                <button type="button" className="flex items-center gap-2.5 w-full px-3 py-1.5 text-xs rounded-md text-left text-surface-700 hover:bg-surface-100">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="flex-1">Layer</span>
                  <ChevronRight className="w-3.5 h-3.5 text-surface-400" />
                </button>
                <div className="hidden group-hover/layer:block absolute left-full top-0 -ml-0.5 bg-white rounded-xl shadow-xl border border-surface-200 py-1.5 px-1.5 w-44">
                  {item("Bring to front", <ChevronUp className="w-3.5 h-3.5" />, () => moveLayerToEnd(true))}
                  {item("Bring forward", <ChevronUp className="w-3.5 h-3.5" />, () => moveLayer(1))}
                  {item("Send backward", <ChevronDown className="w-3.5 h-3.5" />, () => moveLayer(-1))}
                  {item("Send to back", <ChevronDown className="w-3.5 h-3.5" />, () => moveLayerToEnd(false))}
                </div>
              </div>

              {/* Align to page submenu */}
              <div className="relative group/align">
                <button type="button" className="flex items-center gap-2.5 w-full px-3 py-1.5 text-xs rounded-md text-left text-surface-700 hover:bg-surface-100">
                  <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
                  <span className="flex-1">Align to page</span>
                  <ChevronRight className="w-3.5 h-3.5 text-surface-400" />
                </button>
                <div className="hidden group-hover/align:block absolute left-full top-0 -ml-0.5 bg-white rounded-xl shadow-xl border border-surface-200 py-1.5 px-1.5 w-40">
                  {item("Left", <AlignLeft className="w-3.5 h-3.5" />, () => alignToPage("left"))}
                  {item("Center", <AlignCenter className="w-3.5 h-3.5" />, () => alignToPage("center"))}
                  {item("Right", <AlignRight className="w-3.5 h-3.5" />, () => alignToPage("right"))}
                  <div className="h-px bg-surface-100 my-1" />
                  {item("Top", <AlignLeft className="w-3.5 h-3.5 rotate-90" />, () => alignToPage("top"))}
                  {item("Middle", <AlignCenter className="w-3.5 h-3.5 rotate-90" />, () => alignToPage("middle"))}
                  {item("Bottom", <AlignRight className="w-3.5 h-3.5 rotate-90" />, () => alignToPage("bottom"))}
                </div>
              </div>

              <div className="h-px bg-surface-100 my-1" />

              {item(el.locked ? "Unlock" : "Lock", <Lock className="w-3.5 h-3.5" />, toggleLock)}
              {item(el.link ? "Edit link" : "Link", <Link2 className="w-3.5 h-3.5" />, editLink, { shortcut: "Ctrl+K" })}
              {item("Alternative text", <Accessibility className="w-3.5 h-3.5" />, editAltText)}
            </div>
          </>
        );
      })()}

      {/* ── Download dialog ── */}
      <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
        <DialogContent title="Download" className="sm:max-w-sm sm:max-h-[85dvh] sm:overflow-y-auto">
          <div className="mt-2 space-y-4">
            <div>
              <p className="text-xs font-medium text-surface-600 mb-1.5">File type</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["pdf", "PDF", FileType],
                  ["png", "PNG", FileImage],
                  ["jpg", "JPG", FileImage],
                ] as const).map(([fmt, label, Icon]) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setDownloadFormat(fmt)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border-2 py-2.5 transition-colors",
                      downloadFormat === fmt ? "border-brand-500 bg-brand-50/50" : "border-surface-200 hover:border-surface-300"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", downloadFormat === fmt ? "text-brand-600" : "text-surface-400")} />
                    <span className={cn("text-xs font-medium", downloadFormat === fmt ? "text-brand-700" : "text-surface-600")}>{label}</span>
                  </button>
                ))}
              </div>
              {downloadFormat !== "pdf" && pages.length > 1 && (
                <p className="text-[11px] text-surface-400 mt-1.5">Each selected page downloads as a separate image file.</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-surface-600">Select pages</p>
                <div className="flex gap-2 text-[11px]">
                  <button type="button" className="text-brand-600 hover:underline" onClick={() => setSelectedPages(new Set(pages.map((_, i) => i)))}>All</button>
                  <button type="button" className="text-brand-600 hover:underline" onClick={() => setSelectedPages(new Set([pageIdx]))}>Current</button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-surface-200 p-1.5">
                {pages.map((p, i) => {
                  const checked = selectedPages.has(i);
                  return (
                    <label key={p.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-surface-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setSelectedPages((s) => {
                          const next = new Set(s);
                          if (next.has(i)) next.delete(i); else next.add(i);
                          return next;
                        })}
                        className="accent-brand-600"
                      />
                      <span className="shrink-0 rounded border border-surface-200 overflow-hidden">
                        <PageRenderer page={p} width={W} height={H} displayWidth={(36 * W) / H > 64 ? 64 : (36 * W) / H} />
                      </span>
                      <span className="text-xs text-surface-700">Page {i + 1}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <Button
              className="w-full"
              disabled={selectedPages.size === 0 || exportingAs !== null}
              loading={exportingAs !== null}
              onClick={() => handleExport(downloadFormat, [...selectedPages].sort((a, b) => a - b))}
            >
              <Download className="w-4 h-4" />
              Download {downloadFormat.toUpperCase()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Resize design dialog ── */}
      <Dialog open={resizeOpen} onOpenChange={setResizeOpen}>
        <DialogContent title="Resize design" className="sm:max-w-lg sm:max-h-[85dvh] sm:overflow-y-auto">
          <div className="relative mt-2 mb-3">
            <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={resizeSearch}
              onChange={(e) => setResizeSearch(e.target.value)}
              placeholder="Search resize options"
              className="w-full rounded-lg border border-surface-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-surface-600 mb-3">
            <input
              type="checkbox"
              checked={scaleOnResize}
              onChange={(e) => setScaleOnResize(e.target.checked)}
              className="accent-brand-600"
            />
            Scale elements to fit the new size
          </label>

          {/* Custom size */}
          <div className="rounded-xl border border-surface-200 p-3 mb-3">
            <p className="text-xs font-semibold text-surface-700 mb-2">Custom size</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={50}
                max={8000}
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                className="w-24 rounded-lg border border-surface-200 px-2 py-1.5 text-sm"
                placeholder="Width"
              />
              <span className="text-surface-400 text-sm">×</span>
              <input
                type="number"
                min={50}
                max={8000}
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                className="w-24 rounded-lg border border-surface-200 px-2 py-1.5 text-sm"
                placeholder="Height"
              />
              <span className="text-xs text-surface-400">px</span>
              <div className="flex-1" />
              <Button size="sm" onClick={() => applyResize(Number(customW), Number(customH), scaleOnResize)}>
                Apply
              </Button>
            </div>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-2 gap-2">
            {CANVA_FORMATS.filter(
              (f) =>
                !resizeSearch ||
                f.label.toLowerCase().includes(resizeSearch.toLowerCase()) ||
                f.category.toLowerCase().includes(resizeSearch.toLowerCase())
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => applyResize(f.width, f.height, scaleOnResize)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  f.width === W && f.height === H
                    ? "border-brand-500 bg-brand-50/40"
                    : "border-surface-200 hover:border-brand-400 hover:bg-brand-50/40"
                )}
              >
                <div className="flex items-center justify-center h-12 mb-2">
                  <div
                    className="bg-surface-200 rounded"
                    style={{
                      width: f.width >= f.height ? 48 : (48 * f.width) / f.height,
                      height: f.width >= f.height ? (48 * f.height) / f.width : 48,
                    }}
                  />
                </div>
                <p className="text-xs font-semibold text-surface-800">{f.label}</p>
                <p className="text-[10px] text-surface-400">{f.width} × {f.height} px · {f.category}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Present Mode (fullscreen slideshow) ── */}
      {presentMode && (() => {
        const pg = pages[Math.min(presentIdx, pages.length - 1)];
        const ratio = pg ? Math.min(window.innerWidth / W, window.innerHeight / H) : 1;
        return (
          <div
            className="fixed inset-0 z-[9000] bg-black flex flex-col items-center justify-center select-none"
            onClick={() => { if (pages.length > 1) setPresentIdx((i) => (i + 1) % pages.length); }}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setPresentMode(false); return; }
              if (e.key === "ArrowRight" || e.key === "ArrowDown") setPresentIdx((i) => Math.min(pages.length - 1, i + 1));
              if (e.key === "ArrowLeft" || e.key === "ArrowUp") setPresentIdx((i) => Math.max(0, i - 1));
            }}
            tabIndex={0}
            ref={(el) => { if (el) el.focus(); }}
          >
            {/* Slide */}
            <div
              style={{ width: W * ratio, height: H * ratio, flexShrink: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ transform: `scale(${ratio})`, transformOrigin: "top left" }}>
                <div style={{ width: W, height: H, background: pg.background, overflow: "hidden", position: "relative" }}>
                  {pg.elements.map((el, idx) => {
                    const anim = el.animation;
                    if (!anim || anim.trigger === "exit") {
                      return <ElementView key={el.id} el={el} />;
                    }
                    const keyframeName = getAnimKeyframeName(anim);
                    const duration = getAnimDuration(anim.speed ?? 0.5);
                    const delay = anim.type === "succession" ? idx * 0.15 : 0;
                    return (
                      <div
                        key={`${presentIdx}-${el.id}`}
                        style={{
                          position: "absolute",
                          left: el.x,
                          top: el.y,
                          width: el.w,
                          height: el.h,
                          animation: `${keyframeName} ${duration}s ease both ${delay}s`,
                        }}
                      >
                        <ElementView el={el} asChild />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-6 py-4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPresentIdx((i) => Math.max(0, i - 1)); }}
                disabled={presentIdx === 0}
                className="pointer-events-auto p-3 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-white/70 text-sm font-medium">{presentIdx + 1} / {pages.length}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPresentIdx((i) => Math.min(pages.length - 1, i + 1)); }}
                disabled={presentIdx === pages.length - 1}
                className="pointer-events-auto p-3 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Exit button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPresentMode(false); }}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
              aria-label="Exit presentation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        );
      })()}

      {/* Magic Eraser modal */}
      {eraserEl && (
        <MagicEraserModal
          el={eraserEl}
          onClose={() => setEraserEl(null)}
          onApply={(url) => {
            commitPatch(eraserEl.id, { src: url, crop: undefined, cropX: undefined, cropY: undefined, cropW: undefined, cropH: undefined });
            setEraserEl(null);
          }}
        />
      )}

      {/* Pixel Eraser modal */}
      {pixelEraserEl && (
        <PixelEraserModal
          el={pixelEraserEl}
          onClose={() => setPixelEraserEl(null)}
          onApply={(url) => {
            commitPatch(pixelEraserEl.id, { src: url, crop: undefined, cropX: undefined, cropY: undefined, cropW: undefined, cropH: undefined });
            setPixelEraserEl(null);
          }}
        />
      )}

      {/* Magic Layers modal */}
      {magicLayersEl && (
        <MagicLayersModal
          el={magicLayersEl}
          onClose={() => setMagicLayersEl(null)}
          onApplyLayers={handleApplyMagicLayers}
        />
      )}

      {/* Eraser dropdown portal — rendered outside the overflow-x-auto toolbar */}
      {eraserDropOpen && eraserDropPos && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onPointerDown={() => setEraserDropOpen(false)} />
          <div
            style={{ position: "fixed", top: eraserDropPos.top, left: eraserDropPos.left, zIndex: 9999 }}
            className="bg-white rounded-xl shadow-xl border border-surface-200 py-1 w-44"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
              onClick={() => { setEraserDropOpen(false); selected?.src ? setEraserEl(selected) : toast.error("No image"); }}
            >
              <PenTool className="w-4 h-4 text-surface-500 shrink-0" />
              Magic Eraser
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
              onClick={() => { setEraserDropOpen(false); selected?.src ? setPixelEraserEl(selected) : toast.error("No image"); }}
            >
              <Eraser className="w-4 h-4 text-surface-500 shrink-0" />
              Pixel Eraser
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
