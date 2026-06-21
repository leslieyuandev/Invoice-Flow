"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CanvaElement } from "@/types/canva";

interface Props {
  el: CanvaElement;
  onClose: () => void;
  onApply: (url: string) => void;
}

/**
 * BFS content-aware fill: expands from mask boundary inward.
 * Each masked pixel gets a weighted average of its known neighbors.
 * O(n) where n = masked pixels — fast even on large images.
 */
function inpaintBFS(
  data: Uint8ClampedArray,
  mask: Uint8Array, // 1 = masked (erase+fill), 0 = keep
  w: number,
  h: number
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data);
  const remaining = new Uint8Array(mask);

  // Seed queue with boundary masked pixels (adjacent to at least one known pixel)
  const queue: number[] = [];
  const inQueue = new Uint8Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!remaining[i]) continue;
      const hasBoundary =
        (x > 0 && !remaining[i - 1]) ||
        (x < w - 1 && !remaining[i + 1]) ||
        (y > 0 && !remaining[i - w]) ||
        (y < h - 1 && !remaining[i + w]);
      if (hasBoundary) {
        queue.push(i);
        inQueue[i] = 1;
      }
    }
  }

  let qi = 0;
  while (qi < queue.length) {
    const i = queue[qi++];
    const x = i % w;
    const y = Math.floor(i / w);

    // Weighted average of 4-connected neighbors (known = weight 3, freshly-filled = weight 1)
    let r = 0, g = 0, b = 0, cnt = 0;
    const nbrs = [
      y > 0 ? i - w : -1,
      y < h - 1 ? i + w : -1,
      x > 0 ? i - 1 : -1,
      x < w - 1 ? i + 1 : -1,
    ];
    for (const ni of nbrs) {
      if (ni < 0) continue;
      const wt = remaining[ni] === 0 ? 3 : 1;
      const pi = ni * 4;
      r += result[pi] * wt;
      g += result[pi + 1] * wt;
      b += result[pi + 2] * wt;
      cnt += wt;
    }
    if (cnt > 0) {
      const pi = i * 4;
      result[pi] = r / cnt;
      result[pi + 1] = g / cnt;
      result[pi + 2] = b / cnt;
      result[pi + 3] = 255;
    }
    remaining[i] = 0; // Now treated as known for future neighbors

    for (const ni of nbrs) {
      if (ni < 0 || !remaining[ni] || inQueue[ni]) continue;
      queue.push(ni);
      inQueue[ni] = 1;
    }
  }

  return result;
}

export function MagicEraserModal({ el, onClose, onApply }: Props) {
  const displayRef = useRef<HTMLCanvasElement>(null);
  const origRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const [brushSize, setBrushSize] = useState(40);
  const [applying, setApplying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [corsError, setCorsError] = useState(false);
  const isDrawing = useRef(false);
  const lastClient = useRef<{ x: number; y: number } | null>(null);

  const redrawDisplay = useCallback(() => {
    const display = displayRef.current;
    const orig = origRef.current;
    const maskC = maskRef.current;
    if (!display || !orig || !maskC) return;

    const ctx = display.getContext("2d")!;
    ctx.clearRect(0, 0, display.width, display.height);
    ctx.drawImage(orig, 0, 0);

    // Overlay red-tinted region wherever mask is white
    const overlay = document.createElement("canvas");
    overlay.width = display.width;
    overlay.height = display.height;
    const oCtx = overlay.getContext("2d")!;
    oCtx.fillStyle = "rgba(239,68,68,0.48)";
    oCtx.fillRect(0, 0, overlay.width, overlay.height);
    oCtx.globalCompositeOperation = "destination-in";
    oCtx.drawImage(maskC, 0, 0);

    ctx.drawImage(overlay, 0, 0);
  }, []);

  useEffect(() => {
    const display = displayRef.current;
    if (!display || !el.src) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const orig = document.createElement("canvas");
      orig.width = img.naturalWidth;
      orig.height = img.naturalHeight;
      orig.getContext("2d")!.drawImage(img, 0, 0);
      origRef.current = orig;

      const maskC = document.createElement("canvas");
      maskC.width = img.naturalWidth;
      maskC.height = img.naturalHeight;
      const mCtx = maskC.getContext("2d")!;
      mCtx.fillStyle = "black";
      mCtx.fillRect(0, 0, maskC.width, maskC.height);
      maskRef.current = maskC;

      display.width = img.naturalWidth;
      display.height = img.naturalHeight;
      redrawDisplay();
      setLoaded(true);
    };
    img.onerror = () => setCorsError(true);
    const sep = el.src.includes("?") ? "&" : "?";
    img.src = `${el.src}${sep}_e=${Date.now()}`;
  }, [el.src, redrawDisplay]);

  function paintMask(clientX: number, clientY: number) {
    const display = displayRef.current;
    const maskC = maskRef.current;
    if (!display || !maskC || !loaded) return;

    const rect = display.getBoundingClientRect();
    const scaleX = display.width / rect.width;
    const scaleY = display.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const radius = brushSize * ((scaleX + scaleY) / 2);

    const mCtx = maskC.getContext("2d")!;
    mCtx.globalCompositeOperation = "source-over";
    mCtx.fillStyle = "white";
    mCtx.strokeStyle = "white";
    mCtx.lineWidth = radius * 2;
    mCtx.lineCap = "round";
    mCtx.lineJoin = "round";

    const prev = lastClient.current;
    if (prev) {
      const px = (prev.x - rect.left) * scaleX;
      const py = (prev.y - rect.top) * scaleY;
      mCtx.beginPath();
      mCtx.moveTo(px, py);
      mCtx.lineTo(x, y);
      mCtx.stroke();
    }
    mCtx.beginPath();
    mCtx.arc(x, y, radius, 0, Math.PI * 2);
    mCtx.fill();

    redrawDisplay();
  }

  function handleReset() {
    const maskC = maskRef.current;
    if (!maskC) return;
    const mCtx = maskC.getContext("2d")!;
    mCtx.fillStyle = "black";
    mCtx.fillRect(0, 0, maskC.width, maskC.height);
    redrawDisplay();
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!loaded) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    lastClient.current = { x: e.clientX, y: e.clientY };
    paintMask(e.clientX, e.clientY);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    paintMask(e.clientX, e.clientY);
    lastClient.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp() {
    isDrawing.current = false;
    lastClient.current = null;
  }

  async function handleApply() {
    const orig = origRef.current;
    const maskC = maskRef.current;
    if (!orig || !maskC) return;
    setApplying(true);

    try {
      // Work at 800 px max for inpainting speed; upscale result to 2048 px for export
      const INPAINT_MAX = 800;
      const EXPORT_MAX = 2048;
      const ipScale = Math.min(1, INPAINT_MAX / Math.max(orig.width, orig.height));
      const iw = Math.round(orig.width * ipScale);
      const ih = Math.round(orig.height * ipScale);

      const tmpOrig = document.createElement("canvas");
      tmpOrig.width = iw; tmpOrig.height = ih;
      tmpOrig.getContext("2d")!.drawImage(orig, 0, 0, iw, ih);

      const tmpMask = document.createElement("canvas");
      tmpMask.width = iw; tmpMask.height = ih;
      tmpMask.getContext("2d")!.drawImage(maskC, 0, 0, iw, ih);

      const origData = tmpOrig.getContext("2d")!.getImageData(0, 0, iw, ih);
      const maskData = tmpMask.getContext("2d")!.getImageData(0, 0, iw, ih);

      // Threshold mask (R channel, white=255 → 1, black=0 → 0)
      const maskGray = new Uint8Array(iw * ih);
      for (let i = 0; i < iw * ih; i++) {
        maskGray[i] = maskData.data[i * 4] > 128 ? 1 : 0;
      }

      const filled = inpaintBFS(origData.data, maskGray, iw, ih);

      // Write filled result back
      const filledImg = new ImageData(new Uint8ClampedArray(filled), iw, ih);
      tmpOrig.getContext("2d")!.putImageData(filledImg, 0, 0);

      // Export at up to EXPORT_MAX
      const exScale = Math.min(1, EXPORT_MAX / Math.max(orig.width, orig.height));
      const ew = Math.round(orig.width * exScale);
      const eh = Math.round(orig.height * exScale);

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = ew; exportCanvas.height = eh;
      exportCanvas.getContext("2d")!.drawImage(tmpOrig, 0, 0, ew, eh);

      const blob = await new Promise<Blob>((res, rej) =>
        exportCanvas.toBlob(
          (b) => (b ? res(b) : rej(new Error("Canvas export failed"))),
          "image/png"
        )
      );

      const fd = new FormData();
      fd.append("file", new File([blob], "erased.png", { type: "image/png" }));
      fd.append("type", "image");
      const r = await fetch("/api/canva/assets", { method: "POST", body: fd });

      let j: { error?: string; asset?: { url: string } };
      try {
        j = await r.json();
      } catch {
        throw new Error(
          `Upload failed (HTTP ${r.status}). The exported image may still be too large — try a lower-resolution source image.`
        );
      }
      if (!r.ok) throw new Error(j.error ?? "Upload failed");
      toast.success("Magic fill applied");
      onApply(j.asset!.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply");
      setApplying(false);
    }
  }

  // Circle cursor SVG
  const bs = Math.max(8, Math.min(128, brushSize));
  const cursorSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${bs}' height='${bs}'><circle cx='${bs / 2}' cy='${bs / 2}' r='${bs / 2 - 2}' fill='rgba(239,68,68,0.2)' stroke='#ef4444' stroke-width='1.5'/><circle cx='${bs / 2}' cy='${bs / 2}' r='${bs / 2 - 2}' fill='none' stroke='rgba(0,0,0,0.4)' stroke-width='0.5'/></svg>`;
  const cursorUrl = `url("data:image/svg+xml,${encodeURIComponent(cursorSvg)}") ${bs / 2} ${bs / 2}, crosshair`;

  return (
    <div className="fixed inset-0 z-[9500] bg-black/85 flex flex-col" onPointerUp={onPointerUp}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-surface-200 shrink-0 flex-wrap gap-y-1">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-surface-100 text-surface-600 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm text-surface-900 shrink-0">Magic Eraser</span>
        <span className="text-xs text-surface-400 hidden sm:block">
          Paint over what to remove — background fills in automatically
        </span>
        <div className="flex-1" />
        <label className="flex items-center gap-2 text-xs text-surface-600 shrink-0">
          <span className="hidden sm:inline">Brush</span>
          <input
            type="range"
            min={5}
            max={100}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20 sm:w-28 accent-brand-600"
          />
          <input
            type="number"
            min={5}
            max={100}
            value={brushSize}
            onChange={(e) =>
              setBrushSize(Math.max(5, Math.min(100, Number(e.target.value))))
            }
            className="w-12 text-xs border border-surface-200 rounded-md px-2 py-1 text-center"
          />
        </label>
        <button
          type="button"
          onClick={handleReset}
          disabled={!loaded}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-surface-200 hover:bg-surface-50 text-surface-600 disabled:opacity-40 shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Reset</span>
        </button>
        <Button variant="outline" size="sm" onClick={onClose} className="shrink-0">
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleApply}
          loading={applying}
          disabled={!loaded || corsError || applying}
          className="shrink-0"
        >
          {applying ? "Filling…" : "Apply fill"}
        </Button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 relative">
        {corsError ? (
          <div className="text-white text-center space-y-3 max-w-sm">
            <p className="font-semibold text-lg">Cannot load image for editing</p>
            <p className="text-sm opacity-70">
              The image host doesn&apos;t support cross-origin canvas access. Try
              re-uploading this image via the Uploads panel first, then use Magic Eraser.
            </p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <canvas
            ref={displayRef}
            style={{
              maxWidth: "100%",
              maxHeight: "calc(100vh - 120px)",
              display: "block",
              cursor: loaded ? cursorUrl : "wait",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.6)",
              borderRadius: 4,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
        )}
        {!loaded && !corsError && (
          <p className="absolute text-white/60 text-sm pointer-events-none">
            Loading image…
          </p>
        )}
      </div>

      {/* Footer hint */}
      {loaded && !corsError && (
        <div className="shrink-0 px-4 py-2 bg-black/60 text-center text-xs text-white/50">
          Paint red over the area to remove — the background will be reconstructed when you click &ldquo;Apply fill&rdquo;
        </div>
      )}
    </div>
  );
}
