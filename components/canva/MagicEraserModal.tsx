"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CanvaElement } from "@/types/canva";

interface Props {
  el: CanvaElement;
  onClose: () => void;
  onApply: (url: string) => void;
}

export function MagicEraserModal({ el, onClose, onApply }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(40);
  const [applying, setApplying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [corsError, setCorsError] = useState(false);
  const isDrawing = useRef(false);
  const lastClient = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !el.src) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setLoaded(true);
    };
    img.onerror = () => setCorsError(true);
    // Cache-bust to ensure a fresh CORS-enabled request (browser may have cached without CORS)
    const sep = el.src.includes("?") ? "&" : "?";
    img.src = `${el.src}${sep}_e=${Date.now()}`;
  }, [el.src]);

  function erase(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas || !loaded) return;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    // brushSize is in screen-pixels; convert to canvas pixels
    const radius = brushSize * ((scaleX + scaleY) / 2);

    ctx.globalCompositeOperation = "destination-out";
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
  }

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
    const source = canvasRef.current;
    if (!source) return;
    setApplying(true);
    try {
      // Downscale if the original image is very large (keeps upload under size limit)
      const MAX = 2048;
      let exportCanvas: HTMLCanvasElement = source;
      if (source.width > MAX || source.height > MAX) {
        const scale = MAX / Math.max(source.width, source.height);
        const sc = document.createElement("canvas");
        sc.width = Math.round(source.width * scale);
        sc.height = Math.round(source.height * scale);
        sc.getContext("2d")!.drawImage(source, 0, 0, sc.width, sc.height);
        exportCanvas = sc;
      }

      const blob = await new Promise<Blob>((res, rej) =>
        exportCanvas.toBlob((b) => (b ? res(b) : rej(new Error("Canvas export failed"))), "image/png")
      );
      const fd = new FormData();
      fd.append("file", new File([blob], "erased.png", { type: "image/png" }));
      fd.append("type", "image");
      const r = await fetch("/api/canva/assets", { method: "POST", body: fd });

      // Safely parse JSON — a non-JSON response (e.g. 413 Entity Too Large) gives a clear message
      let j: { error?: string; asset?: { url: string } };
      try {
        j = await r.json();
      } catch {
        throw new Error(`Upload failed (HTTP ${r.status}). The exported image may still be too large — try a lower-resolution source image.`);
      }
      if (!r.ok) throw new Error(j.error ?? "Upload failed");
      toast.success("Eraser applied");
      onApply(j.asset!.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply");
      setApplying(false);
    }
  }

  // Circle cursor SVG scaled to current brush size
  const bs = Math.max(8, Math.min(128, brushSize));
  const cursorSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${bs}' height='${bs}'><circle cx='${bs / 2}' cy='${bs / 2}' r='${bs / 2 - 2}' fill='rgba(255,255,255,0.15)' stroke='white' stroke-width='1.5'/><circle cx='${bs / 2}' cy='${bs / 2}' r='${bs / 2 - 2}' fill='none' stroke='black' stroke-width='0.5'/></svg>`;
  const cursorUrl = `url("data:image/svg+xml,${encodeURIComponent(cursorSvg)}") ${bs / 2} ${bs / 2}, crosshair`;

  return (
    <div className="fixed inset-0 z-[9500] bg-black/85 flex flex-col" onPointerUp={onPointerUp}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-surface-200 shrink-0 flex-wrap gap-y-1">
        <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-100 text-surface-600 shrink-0">
          <X className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm text-surface-900 shrink-0">Magic Eraser</span>
        <span className="text-xs text-surface-400 hidden sm:block">Paint to erase — checkerboard = transparent</span>
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
        <Button variant="outline" size="sm" onClick={onClose} className="shrink-0">Cancel</Button>
        <Button size="sm" onClick={handleApply} loading={applying} disabled={!loaded || corsError || applying} className="shrink-0">
          Apply erase
        </Button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 relative">
        {corsError ? (
          <div className="text-white text-center space-y-3 max-w-sm">
            <p className="font-semibold text-lg">Cannot load image for editing</p>
            <p className="text-sm opacity-70">The image host doesn't support cross-origin canvas access. Try re-uploading this image via the Uploads panel first, then use Magic Eraser.</p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: "100%",
              maxHeight: "calc(100vh - 120px)",
              display: "block",
              // Checkerboard shows where pixels are transparent (erased)
              background: "repeating-conic-gradient(#b0b0b0 0% 25%, #fff 0% 50%) 0 0 / 16px 16px",
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
          <p className="absolute text-white/60 text-sm pointer-events-none">Loading image…</p>
        )}
      </div>
    </div>
  );
}
