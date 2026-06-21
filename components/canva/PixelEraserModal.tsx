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

export function PixelEraserModal({ el, onClose, onApply }: Props) {
  const displayRef = useRef<HTMLCanvasElement>(null);
  const origRef = useRef<HTMLCanvasElement | null>(null);
  const [brushSize, setBrushSize] = useState(40);
  const [applying, setApplying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [corsError, setCorsError] = useState(false);
  const isDrawing = useRef(false);
  const lastClient = useRef<{ x: number; y: number } | null>(null);

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

      display.width = img.naturalWidth;
      display.height = img.naturalHeight;
      const ctx = display.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      setLoaded(true);
    };
    img.onerror = () => setCorsError(true);
    const sep = el.src.includes("?") ? "&" : "?";
    img.src = `${el.src}${sep}_e=${Date.now()}`;
  }, [el.src]);

  function handleReset() {
    const display = displayRef.current;
    const orig = origRef.current;
    if (!display || !orig) return;
    const ctx = display.getContext("2d")!;
    ctx.clearRect(0, 0, display.width, display.height);
    ctx.drawImage(orig, 0, 0);
  }

  const erase = useCallback((clientX: number, clientY: number) => {
    const display = displayRef.current;
    if (!display || !loaded) return;
    const rect = display.getBoundingClientRect();
    const scaleX = display.width / rect.width;
    const scaleY = display.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const radius = brushSize * ((scaleX + scaleY) / 2);

    const ctx = display.getContext("2d")!;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = radius * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const prev = lastClient.current;
    if (prev) {
      const px = (prev.x - rect.left) * scaleX;
      const py = (prev.y - rect.top) * scaleY;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }, [brushSize, loaded]);

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!loaded) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    lastClient.current = { x: e.clientX, y: e.clientY };
    erase(e.clientX, e.clientY);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    erase(e.clientX, e.clientY);
    lastClient.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp() {
    isDrawing.current = false;
    lastClient.current = null;
  }

  async function handleApply() {
    const display = displayRef.current;
    if (!display) return;
    setApplying(true);

    try {
      const EXPORT_MAX = 2048;
      const exScale = Math.min(1, EXPORT_MAX / Math.max(display.width, display.height));
      const ew = Math.round(display.width * exScale);
      const eh = Math.round(display.height * exScale);

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = ew;
      exportCanvas.height = eh;
      exportCanvas.getContext("2d")!.drawImage(display, 0, 0, ew, eh);

      const blob = await new Promise<Blob>((res, rej) =>
        exportCanvas.toBlob(
          (b) => (b ? res(b) : rej(new Error("Canvas export failed"))),
          "image/png"
        )
      );

      const fd = new FormData();
      fd.append("file", new File([blob], "pixel-erased.png", { type: "image/png" }));
      fd.append("type", "image");
      const r = await fetch("/api/canva/assets", { method: "POST", body: fd });

      let j: { error?: string; asset?: { url: string } };
      try {
        j = await r.json();
      } catch {
        throw new Error(
          `Upload failed (HTTP ${r.status}). The exported image may be too large — try a lower-resolution source image.`
        );
      }
      if (!r.ok) throw new Error(j.error ?? "Upload failed");
      toast.success("Pixel erase applied");
      onApply(j.asset!.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply");
      setApplying(false);
    }
  }

  const bs = Math.max(8, Math.min(128, brushSize));
  const cursorSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${bs}' height='${bs}'><circle cx='${bs / 2}' cy='${bs / 2}' r='${bs / 2 - 2}' fill='rgba(0,0,0,0.15)' stroke='#000' stroke-width='1.5'/><circle cx='${bs / 2}' cy='${bs / 2}' r='${bs / 2 - 2}' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='0.5'/></svg>`;
  const cursorUrl = `url("data:image/svg+xml,${encodeURIComponent(cursorSvg)}") ${bs / 2} ${bs / 2}, crosshair`;

  return (
    <div className="fixed inset-0 z-[9500] bg-black/85 flex flex-col" onPointerUp={onPointerUp}>
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-surface-200 shrink-0 flex-wrap gap-y-1">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-surface-100 text-surface-600 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm text-surface-900 shrink-0">Pixel Eraser</span>
        <span className="text-xs text-surface-400 hidden sm:block">
          Paint to erase pixels to transparency
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
            onChange={(e) => setBrushSize(Math.max(5, Math.min(100, Number(e.target.value))))}
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
          {applying ? "Saving…" : "Apply"}
        </Button>
      </div>

      <div
        className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 relative"
        style={{
          backgroundImage:
            "repeating-conic-gradient(#888 0% 25%, #ccc 0% 50%) 0 0 / 16px 16px",
        }}
      >
        {corsError ? (
          <div className="text-white text-center space-y-3 max-w-sm">
            <p className="font-semibold text-lg">Cannot load image for editing</p>
            <p className="text-sm opacity-70">
              The image host doesn&apos;t support cross-origin canvas access. Try
              re-uploading this image via the Uploads panel first, then use Pixel Eraser.
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
              boxShadow: "0 0 0 1px rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.6)",
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

      {loaded && !corsError && (
        <div className="shrink-0 px-4 py-2 bg-black/60 text-center text-xs text-white/50">
          Paint over pixels to erase them to transparency — result saves as PNG
        </div>
      )}
    </div>
  );
}
