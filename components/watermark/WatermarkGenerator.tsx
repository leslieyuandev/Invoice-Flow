"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Upload, Download, Settings, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Position = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "tile";
type WmSize = "small" | "medium" | "large";

const SIZE_RATIO: Record<WmSize, number> = { small: 0.2, medium: 0.4, large: 0.6 };

interface WatermarkGeneratorProps {
  watermarkUrl: string | null;
}

type ExportFormat = "png" | "jpg" | "pdf";

export function WatermarkGenerator({ watermarkUrl }: WatermarkGeneratorProps) {
  const [sourceDataUrl, setSourceDataUrl] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [sourceFormat, setSourceFormat] = useState<"png" | "jpg" | null>(null);
  const [position, setPosition] = useState<Position>("center");
  const [opacity, setOpacity] = useState(0.5);
  const [wmSize, setWmSize] = useState<WmSize>("medium");
  const [isDragging, setIsDragging] = useState(false);
  const [exportingAs, setExportingAs] = useState<ExportFormat | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const isExporting = exportingAs !== null;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceDataUrl) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsRendering(true);

    const srcImg = new Image();
    srcImg.onload = () => {
      canvas.width = srcImg.naturalWidth;
      canvas.height = srcImg.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(srcImg, 0, 0);

      if (!watermarkUrl) {
        setIsRendering(false);
        return;
      }

      const wmImg = new Image();
      wmImg.crossOrigin = "anonymous";
      wmImg.onload = () => {
        const ratio = SIZE_RATIO[wmSize];
        const ww = canvas.width * ratio;
        const wh = (wmImg.naturalHeight / wmImg.naturalWidth) * ww;

        ctx.globalAlpha = opacity;

        if (position === "tile") {
          const gapX = ww * 1.5;
          const gapY = wh * 1.5;
          for (let y = 0; y < canvas.height + wh; y += gapY) {
            for (let x = 0; x < canvas.width + ww; x += gapX) {
              ctx.drawImage(wmImg, x - ww / 2, y - wh / 2, ww, wh);
            }
          }
        } else {
          let x = 0;
          let y = 0;
          const pad = Math.min(canvas.width, canvas.height) * 0.04;
          if (position === "center") { x = (canvas.width - ww) / 2; y = (canvas.height - wh) / 2; }
          else if (position === "top-left") { x = pad; y = pad; }
          else if (position === "top-right") { x = canvas.width - ww - pad; y = pad; }
          else if (position === "bottom-left") { x = pad; y = canvas.height - wh - pad; }
          else if (position === "bottom-right") { x = canvas.width - ww - pad; y = canvas.height - wh - pad; }
          ctx.drawImage(wmImg, x, y, ww, wh);
        }

        ctx.globalAlpha = 1;
        setIsRendering(false);
      };
      wmImg.onerror = () => {
        toast.error("Failed to load watermark image — check CORS or try re-uploading.");
        setIsRendering(false);
      };
      wmImg.src = watermarkUrl;
    };
    srcImg.onerror = () => setIsRendering(false);
    srcImg.src = sourceDataUrl;
  }, [sourceDataUrl, watermarkUrl, position, opacity, wmSize]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  function loadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG or JPG).");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be under 20 MB.");
      return;
    }
    setSourceName(file.name);
    setSourceFormat(file.type === "image/png" ? "png" : "jpg");
    const reader = new FileReader();
    reader.onload = (e) => setSourceDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  const baseName = sourceName ? sourceName.replace(/\.[^.]+$/, "") : "watermarked";

  function triggerDownload(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }

  async function handleExport(format: ExportFormat) {
    const canvas = canvasRef.current;
    if (!canvas || !sourceDataUrl) return;
    setExportingAs(format);
    try {
      if (format === "png") {
        const url = canvas.toDataURL("image/png");
        triggerDownload(url, `${baseName}-watermarked.png`);
      } else if (format === "jpg") {
        const url = canvas.toDataURL("image/jpeg", 0.92);
        triggerDownload(url, `${baseName}-watermarked.jpg`);
      } else {
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const res = await fetch("/api/watermark/generate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl }),
        });
        if (!res.ok) {
          const j = await res.json();
          throw new Error(j.error ?? "PDF generation failed");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `${baseName}-watermarked.pdf`);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportingAs(null);
    }
  }

  const POSITIONS: { value: Position; label: string }[] = [
    { value: "center", label: "Center" },
    { value: "top-left", label: "Top Left" },
    { value: "top-right", label: "Top Right" },
    { value: "bottom-left", label: "Bot. Left" },
    { value: "bottom-right", label: "Bot. Right" },
    { value: "tile", label: "Tile" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-surface-200 bg-white shrink-0 gap-2">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-surface-900">Watermark Generator</h1>
          <p className="text-xs text-surface-500 hidden sm:block">Upload an image, apply your watermark, export in any format</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(["png", "jpg", "pdf"] as ExportFormat[]).map((fmt) => {
            const isNative = fmt === sourceFormat;
            const isLoading = exportingAs === fmt;
            const disabled = !sourceDataUrl || isRendering || exportingAs !== null;
            return (
              <Button
                key={fmt}
                size="sm"
                variant={isNative ? "default" : "outline"}
                onClick={() => handleExport(fmt)}
                disabled={disabled}
                loading={isLoading}
                title={isNative ? `Export as ${fmt.toUpperCase()} (original format)` : `Export as ${fmt.toUpperCase()}`}
                className="relative"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline uppercase">{fmt}</span>
                {isNative && (
                  <span className="absolute -top-1.5 -right-1.5 hidden sm:flex w-3.5 h-3.5 rounded-full bg-green-500 text-white text-[8px] items-center justify-center font-bold leading-none">✓</span>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Controls panel */}
        <div className="md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-surface-200 overflow-y-auto bg-white">
          <div className="p-4 space-y-5">
            {/* Upload area */}
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Source Image</p>
              <div
                className={cn(
                  "rounded-lg border-2 border-dashed transition-colors cursor-pointer",
                  isDragging ? "border-brand-500 bg-brand-50" : "border-surface-300 hover:border-surface-400"
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                  {sourceDataUrl ? (
                    <>
                      <ImageIcon className="w-6 h-6 text-brand-500" />
                      <p className="text-xs font-medium text-surface-700 truncate max-w-[180px]">{sourceName}</p>
                      <p className="text-xs text-surface-400">Click to replace</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-surface-400" />
                      <p className="text-xs font-medium text-surface-700">Drop image here</p>
                      <p className="text-xs text-surface-400">PNG, JPG · up to 20 MB</p>
                    </>
                  )}
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Watermark status */}
            {!watermarkUrl && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-medium text-amber-800">No watermark configured</p>
                <p className="text-xs text-amber-700 mt-0.5">Upload one in Settings to enable watermarking.</p>
                <Link href="/settings" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 underline">
                  <Settings className="w-3 h-3" /> Go to Settings
                </Link>
              </div>
            )}

            {/* Position */}
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Position</p>
              <div className="grid grid-cols-3 gap-1">
                {POSITIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPosition(p.value)}
                    className={cn(
                      "text-xs py-1.5 px-2 rounded-md border transition-colors",
                      position === p.value
                        ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                        : "border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Watermark Size</p>
              <div className="flex gap-1">
                {(["small", "medium", "large"] as WmSize[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setWmSize(s)}
                    className={cn(
                      "flex-1 text-xs py-1.5 rounded-md border capitalize transition-colors",
                      wmSize === s
                        ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                        : "border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Opacity</p>
                <span className="text-xs font-medium text-surface-700">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                step={5}
                value={Math.round(opacity * 100)}
                onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-[10px] text-surface-400 mt-0.5">
                <span>10%</span>
                <span>90%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="flex-1 overflow-auto bg-surface-100 flex items-center justify-center p-4">
          {sourceDataUrl ? (
            <div className="relative max-w-full">
              {isRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded z-10">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[70vh] rounded shadow-lg object-contain"
                style={{ display: "block" }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center py-16">
              <div className="w-16 h-16 rounded-full bg-surface-200 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-surface-400" />
              </div>
              <p className="text-sm font-medium text-surface-600">No image loaded</p>
              <p className="text-xs text-surface-400">Upload an image from the left panel to preview</p>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4" />
                Upload Image
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
