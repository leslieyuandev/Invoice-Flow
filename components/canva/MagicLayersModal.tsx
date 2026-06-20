"use client";
import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { CanvaElement } from "@/types/canva";

type Mode = "auto" | "brush";

interface Props {
  el: CanvaElement;
  onClose: () => void;
  /** Called with the foreground layer URL; caller inserts it on top of the original */
  onApplyLayers: (foregroundUrl: string) => void;
}

export function MagicLayersModal({ el, onClose, onApplyLayers }: Props) {
  const [mode, setMode] = useState<Mode>("auto");
  const [brushSize, setBrushSize] = useState(30);
  const [processing, setProcessing] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [corsError, setCorsError] = useState(false);

  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const naturalImgRef = useRef<HTMLImageElement | null>(null);
  const isDrawing = useRef(false);
  const lastClient = useRef<{ x: number; y: number } | null>(null);

  // Load image into canvas for brush mode (needs crossOrigin for compositing)
  useEffect(() => {
    if (!el.src) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      naturalImgRef.current = img;
      const dc = displayCanvasRef.current;
      const mc = maskCanvasRef.current;
      if (dc && mc) {
        dc.width = mc.width = img.naturalWidth;
        dc.height = mc.height = img.naturalHeight;
        const dCtx = dc.getContext("2d")!;
        dCtx.drawImage(img, 0, 0);
        const mCtx = mc.getContext("2d")!;
        mCtx.fillStyle = "black";
        mCtx.fillRect(0, 0, mc.width, mc.height);
      }
      setImgLoaded(true);
    };
    img.onerror = () => setCorsError(true);
    const sep = el.src.includes("?") ? "&" : "?";
    img.src = `${el.src}${sep}_ml=${Date.now()}`;
  }, [el.src]);

  function paint(clientX: number, clientY: number) {
    const dc = displayCanvasRef.current;
    const mc = maskCanvasRef.current;
    const img = naturalImgRef.current;
    if (!dc || !mc || !img) return;

    const rect = dc.getBoundingClientRect();
    const scaleX = dc.width / rect.width;
    const scaleY = dc.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const radius = brushSize * ((scaleX + scaleY) / 2);
    const prev = lastClient.current;

    // Paint white (= selected) on the mask canvas
    const mCtx = mc.getContext("2d")!;
    mCtx.globalCompositeOperation = "source-over";
    mCtx.fillStyle = "white";
    mCtx.strokeStyle = "white";
    mCtx.lineWidth = radius * 2;
    mCtx.lineCap = "round";
    mCtx.lineJoin = "round";
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

    // Redraw display: image + blue highlight where mask is white
    const dCtx = dc.getContext("2d")!;
    dCtx.clearRect(0, 0, dc.width, dc.height);
    dCtx.drawImage(img, 0, 0);

    const overlay = document.createElement("canvas");
    overlay.width = dc.width;
    overlay.height = dc.height;
    const oCtx = overlay.getContext("2d")!;
    oCtx.fillStyle = "rgba(80, 130, 255, 0.45)";
    oCtx.fillRect(0, 0, overlay.width, overlay.height);
    oCtx.globalCompositeOperation = "destination-in";
    oCtx.drawImage(mc, 0, 0);
    dCtx.drawImage(overlay, 0, 0);
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!imgLoaded || mode !== "brush") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    lastClient.current = { x: e.clientX, y: e.clientY };
    paint(e.clientX, e.clientY);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    paint(e.clientX, e.clientY);
    lastClient.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp() {
    isDrawing.current = false;
    lastClient.current = null;
  }

  async function uploadBlob(blob: Blob, name: string): Promise<string> {
    const fd = new FormData();
    fd.append("file", new File([blob], name, { type: "image/png" }));
    fd.append("type", "image");
    const r = await fetch("/api/canva/assets", { method: "POST", body: fd });
    let j: { error?: string; asset?: { url: string } };
    try {
      j = await r.json();
    } catch {
      throw new Error(`Upload failed (HTTP ${r.status} — file may be too large)`);
    }
    if (!r.ok) throw new Error(j.error ?? "Upload failed");
    return j.asset!.url;
  }

  async function handleSplit() {
    setProcessing(true);
    try {
      if (mode === "auto") {
        const { removeBackground } = await import("@imgly/background-removal");
        toast.message("Detecting subject…", {
          description: "On-device AI — first run downloads the model (~50 MB). No data leaves your browser.",
        });
        const fgBlob = await removeBackground(el.src!);
        const fgUrl = await uploadBlob(fgBlob, "fg-layer.png");
        toast.success("Layers split — move the foreground independently!");
        onApplyLayers(fgUrl);
      } else {
        const mc = maskCanvasRef.current;
        const img = naturalImgRef.current;
        if (!mc || !img) throw new Error("No image loaded");

        // Extract only the painted region from the original
        const fg = document.createElement("canvas");
        fg.width = img.naturalWidth;
        fg.height = img.naturalHeight;
        const fgCtx = fg.getContext("2d")!;
        fgCtx.drawImage(img, 0, 0);
        fgCtx.globalCompositeOperation = "destination-in";
        fgCtx.drawImage(mc, 0, 0);

        // Downscale if needed to stay under upload limit
        const MAX = 2048;
        let exportCanvas: HTMLCanvasElement = fg;
        if (fg.width > MAX || fg.height > MAX) {
          const scale = MAX / Math.max(fg.width, fg.height);
          const sc = document.createElement("canvas");
          sc.width = Math.round(fg.width * scale);
          sc.height = Math.round(fg.height * scale);
          sc.getContext("2d")!.drawImage(fg, 0, 0, sc.width, sc.height);
          exportCanvas = sc;
        }

        const fgBlob = await new Promise<Blob>((res, rej) =>
          exportCanvas.toBlob((b) => (b ? res(b) : rej(new Error("Export failed"))), "image/png")
        );
        const fgUrl = await uploadBlob(fgBlob, "fg-layer.png");
        toast.success("Layers split — move the selection as a separate layer!");
        onApplyLayers(fgUrl);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to split layers");
      setProcessing(false);
    }
  }

  // Brush cursor
  const bs = Math.max(8, Math.min(128, brushSize));
  const cursorSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${bs}' height='${bs}'><circle cx='${bs / 2}' cy='${bs / 2}' r='${bs / 2 - 2}' fill='rgba(80,130,255,0.2)' stroke='white' stroke-width='1.5'/></svg>`;
  const cursorUrl = `url("data:image/svg+xml,${encodeURIComponent(cursorSvg)}") ${bs / 2} ${bs / 2}, crosshair`;

  return (
    <div className="fixed inset-0 z-[9500] bg-black/85 flex flex-col" onPointerUp={onPointerUp}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-surface-200 shrink-0 flex-wrap gap-y-1">
        <button type="button" onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-100 text-surface-600 shrink-0">
          <X className="w-4 h-4" />
        </button>
        <span className="font-semibold text-sm text-surface-900 shrink-0">Magic Layers</span>
        <div className="w-px h-5 bg-surface-200 mx-1" />

        {/* Mode tabs */}
        <div className="flex gap-0.5 bg-surface-100 rounded-lg p-0.5 shrink-0">
          {([["auto", "Auto"], ["brush", "Brush"]] as const).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                mode === m ? "bg-white text-surface-900 shadow-sm" : "text-surface-500 hover:text-surface-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "brush" && (
          <>
            <div className="w-px h-5 bg-surface-200 mx-1" />
            <label className="flex items-center gap-2 text-xs text-surface-600 shrink-0">
              <span className="hidden sm:inline">Brush</span>
              <input
                type="range"
                min={5}
                max={80}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 sm:w-28 accent-brand-600"
              />
              <span className="w-5 text-right">{brushSize}</span>
            </label>
          </>
        )}

        <div className="flex-1" />
        <span className="text-xs text-surface-400 hidden md:block shrink-0">
          {mode === "auto"
            ? "On-device AI extracts the subject — no data sent anywhere"
            : "Paint the region to separate as a top layer. Blue = selected."}
        </span>
        <Button variant="outline" size="sm" onClick={onClose} className="shrink-0">Cancel</Button>
        <Button
          size="sm"
          onClick={handleSplit}
          loading={processing}
          disabled={processing || !el.src || (mode === "brush" && (!imgLoaded || corsError))}
          className="shrink-0"
        >
          Split into layers
        </Button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 relative">
        {corsError && mode === "brush" ? (
          <div className="text-white text-center space-y-3 max-w-sm">
            <p className="font-semibold text-lg">Cannot load image for brush editing</p>
            <p className="text-sm opacity-70">The image host doesn't allow cross-origin canvas access. Re-upload the image from the Uploads panel first, or use Auto mode.</p>
            <Button variant="outline" onClick={() => { setMode("auto"); setCorsError(false); }}>Switch to Auto</Button>
          </div>
        ) : mode === "auto" ? (
          <div className="flex flex-col items-center gap-4 max-w-2xl w-full">
            <div className="relative w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={el.src}
                alt="Subject"
                className="max-w-full max-h-[calc(100vh-180px)] object-contain block mx-auto shadow-2xl rounded"
              />
              {processing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded gap-3">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                  <p className="text-white font-medium">Detecting subject…</p>
                  <p className="text-white/60 text-sm">Running AI model in your browser — no data leaves your device</p>
                </div>
              )}
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-white/80 text-xs text-center max-w-md">
              The subject is extracted as a transparent-background layer placed on top of the original. You can then move, scale, or filter each layer independently.
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full max-w-4xl">
            <div className="relative w-full flex justify-center">
              <canvas
                ref={displayCanvasRef}
                style={{
                  maxWidth: "100%",
                  maxHeight: "calc(100vh - 180px)",
                  display: "block",
                  cursor: imgLoaded ? cursorUrl : "wait",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.6)",
                  borderRadius: 4,
                  background: "#1a1a1a",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              />
              {/* Hidden mask canvas (same resolution as display canvas) */}
              <canvas ref={maskCanvasRef} style={{ display: "none" }} />
              {!imgLoaded && !corsError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/60 text-sm">Loading image…</p>
                </div>
              )}
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-white/80 text-xs text-center">
              Paint the area you want as a separate top layer. Blue overlay = selected region.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
