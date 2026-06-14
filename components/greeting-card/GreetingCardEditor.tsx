"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const CARD_W = 1050;
const CARD_H = 600;

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Poppins:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Noto+Sans+SC:wght@400;700&family=Ma+Shan+Zheng&family=Playfair+Display:ital,wght@0,600;1,600&family=Dancing+Script:wght@600&display=swap";

type ExportFormat = "png" | "jpg" | "pdf";
type ElementId = "to" | "message" | "regards" | "brand";
type Lang = "auto" | "en" | "zh";

interface FontOption {
  id: string;
  label: string;
  css: string;
}

const FONT_OPTIONS: FontOption[] = [
  { id: "auto", label: "Auto — Canva Sans / ZCOOL KuaiLe", css: "" },
  { id: "canva", label: "Canva Sans", css: "'Poppins', 'Segoe UI', sans-serif" },
  { id: "zcool", label: "ZCOOL KuaiLe 站酷快乐体", css: "'ZCOOL KuaiLe', sans-serif" },
  { id: "noto", label: "Noto Sans SC 思源黑体", css: "'Noto Sans SC', sans-serif" },
  { id: "mashan", label: "Ma Shan Zheng 马善政手写", css: "'Ma Shan Zheng', cursive" },
  { id: "playfair", label: "Playfair Display", css: "'Playfair Display', serif" },
  { id: "dancing", label: "Dancing Script", css: "'Dancing Script', cursive" },
];

const FONT_EN = "'Poppins', 'Segoe UI', sans-serif";
const FONT_ZH = "'ZCOOL KuaiLe', 'Noto Sans SC', sans-serif";
// Fixed brand block (logo + WhatsApp + phone) — must stay identical to the template
const BRAND_IMG = "/greeting-card/brand.png";

const DEFAULT_SIZES: Record<"to" | "message" | "regards", number> = { to: 30, message: 46, regards: 27 };
const ZERO_OFFSETS: Record<ElementId, { x: number; y: number }> = {
  to: { x: 0, y: 0 },
  message: { x: 0, y: 0 },
  regards: { x: 0, y: 0 },
  brand: { x: 0, y: 0 },
};

function hasCJK(text: string): boolean {
  return /[㐀-䶿一-鿿豈-﫿]/.test(text);
}

interface Props {
  defaultRegardsName: string;
}

export function GreetingCardEditor({ defaultRegardsName }: Props) {
  const [toName, setToName] = useState("");
  const [content, setContent] = useState(
    "Congratulations on the opening of your new branch. May this expansion bring even more success and opportunities."
  );
  const [regards, setRegards] = useState(defaultRegardsName);
  const [lang, setLang] = useState<Lang>("auto");
  const [fontId, setFontId] = useState("auto");
  const [sizes, setSizes] = useState(DEFAULT_SIZES);
  const [offsets, setOffsets] = useState(ZERO_OFFSETS);
  const [exportingAs, setExportingAs] = useState<ExportFormat | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scale, setScale] = useState(1);

  const cardRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);

  // Fit the card to the preview pane
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const s = Math.min(1, entry.contentRect.width / CARD_W);
      setScale(s);
      scaleRef.current = s;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isZh = lang === "zh" || (lang === "auto" && hasCJK(content));
  const autoFont = isZh ? FONT_ZH : FONT_EN;
  const selectedFont = FONT_OPTIONS.find((f) => f.id === fontId);
  const fontFamily = fontId === "auto" || !selectedFont?.css ? autoFont : selectedFont.css;

  // Per-element auto font: a Chinese element gets the Chinese font even on an English card
  const fontFor = useCallback(
    (text: string) => {
      if (fontId !== "auto" && selectedFont?.css) return selectedFont.css;
      return hasCJK(text) ? FONT_ZH : FONT_EN;
    },
    [fontId, selectedFont]
  );

  // ----- Dragging -----
  const startDrag = useCallback((id: ElementId, e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    let orig = { x: 0, y: 0 };
    setOffsets((o) => {
      orig = o[id];
      return o;
    });
    function move(ev: PointerEvent) {
      const s = scaleRef.current || 1;
      setOffsets((o) => ({
        ...o,
        [id]: { x: orig.x + (ev.clientX - startX) / s, y: orig.y + (ev.clientY - startY) / s },
      }));
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, []);

  const dragProps = (id: ElementId) => ({
    onPointerDown: (e: React.PointerEvent) => startDrag(id, e),
    style: {
      transform: `translate(${offsets[id].x}px, ${offsets[id].y}px)`,
      touchAction: "none" as const,
    },
    className: cn(
      "absolute cursor-move select-none",
      !isCapturing && "hover:outline-dashed hover:outline-1 hover:outline-pink-300 rounded"
    ),
  });

  // ----- Export -----
  function triggerDownload(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }

  async function handleExport(format: ExportFormat) {
    const node = cardRef.current;
    if (!node) return;
    setExportingAs(format);
    setIsCapturing(true);
    try {
      // Let the capture-mode re-render (placeholders hidden) paint first
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await document.fonts.ready;

      const htmlToImage = await import("html-to-image");
      const opts = {
        width: CARD_W,
        height: CARD_H,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        style: { transform: "scale(1)", transformOrigin: "top left" },
      };

      if (format === "png") {
        const url = await htmlToImage.toPng(node, opts);
        triggerDownload(url, "greeting-card.png");
      } else if (format === "jpg") {
        const url = await htmlToImage.toJpeg(node, { ...opts, quality: 0.95 });
        triggerDownload(url, "greeting-card.jpg");
      } else {
        const imageDataUrl = await htmlToImage.toJpeg(node, { ...opts, quality: 0.95 });
        const res = await fetch("/api/watermark/generate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl, orientation: "landscape" }),
        });
        if (!res.ok) throw new Error("PDF generation failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        triggerDownload(url, "greeting-card.pdf");
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsCapturing(false);
      setExportingAs(null);
    }
  }

  const isExporting = exportingAs !== null;
  const toLabel = isZh ? "致: " : "To : ";
  const showToPlaceholder = !toName && !isCapturing;
  const showMsgPlaceholder = !content && !isCapturing;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Web fonts for the card (hoisted to <head> by React) */}
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} precedence="default" />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-surface-200 bg-white shrink-0 gap-2">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-surface-900">Greeting Card</h1>
          <p className="text-xs text-surface-500 hidden sm:block">Drag elements on the card to reposition · Export as PNG, JPG, or PDF</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {(["png", "jpg", "pdf"] as ExportFormat[]).map((fmt) => (
            <Button
              key={fmt}
              size="sm"
              variant="outline"
              onClick={() => handleExport(fmt)}
              disabled={isExporting}
              loading={exportingAs === fmt}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline uppercase">{fmt}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Controls panel */}
        <div className="md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-surface-200 overflow-y-auto bg-white">
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide block mb-1.5">To</label>
              <input
                type="text"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                placeholder="e.g. Ebid Motor Sdn Bhd (Wisma Kah Motor)"
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide block mb-1.5">Message</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder="Enter your congratulations message…"
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide block mb-1.5">Regards</label>
              <textarea
                value={regards}
                onChange={(e) => setRegards(e.target.value)}
                rows={2}
                placeholder={"e.g. LNT C&E Sdn Bhd\nor 金龙茶餐厅 陈朱乔 （贺）"}
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
            </div>

            <hr className="border-surface-100" />

            {/* Language */}
            <div>
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide block mb-1.5">Language</label>
              <div className="flex gap-1 rounded-lg bg-surface-100 p-0.5">
                {([
                  { v: "auto", l: "Auto" },
                  { v: "en", l: "English" },
                  { v: "zh", l: "中文" },
                ] as { v: Lang; l: string }[]).map(({ v, l }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setLang(v)}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                      lang === v ? "bg-white text-surface-900 shadow-sm" : "text-surface-500 hover:text-surface-700"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Font */}
            <div>
              <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide block mb-1.5">Font</label>
              <select
                value={fontId}
                onChange={(e) => setFontId(e.target.value)}
                className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Font sizes */}
            {([
              { key: "to", label: "To — Font Size" },
              { key: "message", label: "Message — Font Size" },
              { key: "regards", label: "Regards — Font Size" },
            ] as { key: keyof typeof DEFAULT_SIZES; label: string }[]).map(({ key, label }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide">{label}</label>
                  <span className="text-xs font-medium text-surface-700">{sizes[key]}px</span>
                </div>
                <input
                  type="range"
                  min={14}
                  max={90}
                  step={1}
                  value={sizes[key]}
                  onChange={(e) => setSizes((s) => ({ ...s, [key]: Number(e.target.value) }))}
                  className="w-full accent-brand-600"
                />
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setOffsets(ZERO_OFFSETS);
                setSizes(DEFAULT_SIZES);
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Layout & Sizes
            </Button>

          </div>
        </div>

        {/* Preview panel */}
        <div className="flex-1 overflow-auto bg-surface-100 p-4 md:p-6">
          <div ref={wrapRef} className="mx-auto max-w-[1050px]">
            <div style={{ width: CARD_W * scale, height: CARD_H * scale }} className="mx-auto">
              {/* The card — fixed template, scaled to fit */}
              <div
                ref={cardRef}
                className="relative bg-white shadow-lg overflow-hidden"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                {/* To — top left */}
                <div {...dragProps("to")} style={{ ...dragProps("to").style, left: 64, top: 44, maxWidth: CARD_W - 128 }}>
                  <p style={{ fontSize: sizes.to, lineHeight: 1.3, color: "#1a1a1a", margin: 0, whiteSpace: "nowrap" }}>
                    <span style={{ fontFamily: fontFamily, fontStyle: "italic", fontWeight: isZh ? 700 : 400 }}>{toLabel}</span>
                    <span style={{ fontFamily: fontFor(toName), fontStyle: "italic", fontWeight: 700, color: showToPlaceholder ? "#d4d4d4" : "#1a1a1a" }}>
                      {showToPlaceholder ? "Recipient Name" : toName}
                    </span>
                  </p>
                </div>

                {/* Message — center */}
                <div
                  {...dragProps("message")}
                  style={{ ...dragProps("message").style, left: 80, right: 80, top: 130, bottom: 170, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <p
                    style={{
                      fontFamily: fontFor(content),
                      fontSize: sizes.message,
                      fontWeight: 700,
                      lineHeight: 1.45,
                      textAlign: "center",
                      color: showMsgPlaceholder ? "#d4d4d4" : "#1a1a1a",
                      whiteSpace: "pre-wrap",
                      margin: 0,
                      width: "100%",
                    }}
                  >
                    {showMsgPlaceholder ? "Your congratulations message…" : content}
                  </p>
                </div>

                {/* Brand block — bottom left (fixed image, identical to template) */}
                <div {...dragProps("brand")} style={{ ...dragProps("brand").style, left: 56, bottom: 30 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={BRAND_IMG}
                    alt="Halo Balloon +6016-3014913"
                    style={{ width: 265, height: "auto", display: "block" }}
                    draggable={false}
                  />
                </div>

                {/* Regards — bottom right */}
                <div {...dragProps("regards")} style={{ ...dragProps("regards").style, right: 64, bottom: 48, textAlign: isZh ? "left" : "right", maxWidth: 420 }}>
                  {!isZh && (
                    <p style={{ fontFamily: fontFamily, fontStyle: "italic", fontSize: Math.round(sizes.regards * 0.92), color: "#1a1a1a", margin: 0, marginBottom: 6 }}>
                      Regards
                    </p>
                  )}
                  <p
                    style={{
                      fontFamily: fontFor(regards),
                      fontStyle: isZh ? "normal" : "italic",
                      fontWeight: 700,
                      fontSize: sizes.regards,
                      lineHeight: 1.5,
                      color: "#1a1a1a",
                      whiteSpace: "pre-wrap",
                      margin: 0,
                    }}
                  >
                    {regards || defaultRegardsName || "Your Company"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-surface-400 mt-3">
            Tip: drag the text, logo, or signature blocks directly on the card to fine-tune their position.
          </p>
        </div>
      </div>
    </div>
  );
}
