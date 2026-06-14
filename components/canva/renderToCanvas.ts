import type { CanvaElement, CanvaPage } from "@/types/canva";
import { imageColorFilter } from "./imagePresets";

// Deterministic export renderer — draws a page from its element model onto a
// canvas, instead of screenshotting the DOM (which dropped backgrounds, white
// text, and rounded corners). Used for PNG / JPG / PDF export.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Parse a CSS polygon() clip-path into [x,y] fractions (0–1).
function parsePolygon(clip: string | undefined): [number, number][] | null {
  if (!clip) return null;
  const m = clip.match(/polygon\(([^)]+)\)/);
  if (!m) return null;
  return m[1].split(",").map((pair) => {
    const [x, y] = pair.trim().split(/\s+/).map((v) => parseFloat(v) / 100);
    return [x, y] as [number, number];
  });
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function applyCase(text: string, mode: CanvaElement["textTransform"]): string {
  if (mode === "uppercase") return text.toUpperCase();
  if (mode === "capitalize") return text.replace(/\b\w/g, (c) => c.toUpperCase());
  return text;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    if (para === "") { out.push(""); continue; }
    const words = para.split(/(\s+)/); // keep spaces
    let line = "";
    for (const w of words) {
      const test = line + w;
      if (ctx.measureText(test).width > maxWidth && line.trim() !== "") {
        out.push(line.replace(/\s+$/, ""));
        line = w.replace(/^\s+/, "");
      } else {
        line = test;
      }
    }
    out.push(line);
  }
  return out;
}

const SHADOW_MAP: Record<string, { c: string; b: number; x: number; y: number }> = {
  glow: { c: "rgba(0,0,0,0.4)", b: 14, x: 0, y: 0 },
  drop: { c: "rgba(0,0,0,0.35)", b: 10, x: 6, y: 8 },
  curved: { c: "rgba(0,0,0,0.28)", b: 9, x: 0, y: 14 },
  "page-lift": { c: "rgba(0,0,0,0.32)", b: 14, x: 0, y: 18 },
  angled: { c: "rgba(0,0,0,0.32)", b: 7, x: 12, y: 12 },
  backdrop: { c: "rgba(0,0,0,0.18)", b: 0, x: 16, y: 16 },
};

function applyFrameClip(
  ctx: CanvasRenderingContext2D,
  clip: string | undefined,
  lx: number,
  ly: number,
  w: number,
  h: number
) {
  if (!clip) {
    ctx.beginPath(); ctx.rect(lx, ly, w, h); ctx.clip();
    return;
  }
  if (clip.startsWith("ellipse")) {
    ctx.beginPath(); ctx.ellipse(lx + w / 2, ly + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.clip();
    return;
  }
  if (clip.startsWith("inset")) {
    const m = clip.match(/round\s+([\d.]+)%/);
    const pct = m ? parseFloat(m[1]) / 100 : 0;
    roundRectPath(ctx, lx, ly, w, h, Math.min(pct * w, pct * h)); ctx.clip();
    return;
  }
  const pts = parsePolygon(clip);
  if (pts) {
    ctx.beginPath();
    pts.forEach(([px, py], i) => {
      const X = lx + px * w; const Y = ly + py * h;
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    });
    ctx.closePath(); ctx.clip();
  }
}

async function drawElement(ctx: CanvasRenderingContext2D, el: CanvaElement) {
  ctx.save();
  ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
  if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.globalAlpha = el.opacity ?? 1;
  const lx = -el.w / 2;
  const ly = -el.h / 2;

  switch (el.type) {
    case "rect": {
      if (el.fill && el.fill !== "transparent") {
        ctx.fillStyle = el.fill;
        roundRectPath(ctx, lx, ly, el.w, el.h, el.radius ?? 0);
        ctx.fill();
      }
      if (el.strokeWidth) {
        ctx.strokeStyle = el.stroke ?? "#000";
        ctx.lineWidth = el.strokeWidth;
        roundRectPath(ctx, lx, ly, el.w, el.h, el.radius ?? 0);
        ctx.stroke();
      }
      break;
    }
    case "ellipse": {
      ctx.beginPath();
      ctx.ellipse(0, 0, el.w / 2, el.h / 2, 0, 0, Math.PI * 2);
      if (el.fill && el.fill !== "transparent") { ctx.fillStyle = el.fill; ctx.fill(); }
      if (el.strokeWidth) { ctx.strokeStyle = el.stroke ?? "#000"; ctx.lineWidth = el.strokeWidth; ctx.stroke(); }
      break;
    }
    case "triangle":
    case "shape": {
      const pts = el.type === "triangle"
        ? ([[0.5, 0], [1, 1], [0, 1]] as [number, number][])
        : parsePolygon(el.clipPath);
      if (pts && pts.length) {
        ctx.beginPath();
        pts.forEach(([px, py], i) => {
          const X = lx + px * el.w;
          const Y = ly + py * el.h;
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        });
        ctx.closePath();
        ctx.fillStyle = el.fill ?? "#475569";
        ctx.fill();
      }
      break;
    }
    case "text": {
      const size = el.fontSize ?? 24;
      const weight = el.fontWeight ?? 400;
      const style = el.fontStyle === "italic" ? "italic" : "normal";
      ctx.font = `${style} ${weight} ${size}px ${el.fontFamily ?? "sans-serif"}`;
      ctx.textBaseline = "top";
      try { (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${el.letterSpacing ?? 0}px`; } catch { /* unsupported */ }
      const align = el.textAlign ?? "left";
      ctx.textAlign = align;
      const content = applyCase(el.text ?? "", el.textTransform);
      const lines = wrapLines(ctx, content, el.w);
      const lh = size * (el.lineHeight ?? 1.3);
      const startX = align === "center" ? 0 : align === "right" ? el.w / 2 : lx;
      // effects
      if (el.effect === "shadow") {
        ctx.shadowColor = el.effectColor ?? "rgba(0,0,0,0.45)";
        ctx.shadowBlur = size * 0.18; ctx.shadowOffsetX = size * 0.05; ctx.shadowOffsetY = size * 0.08;
      }
      lines.forEach((line, i) => {
        const y = ly + i * lh;
        if (el.effect === "outline") {
          ctx.lineWidth = Math.max(1, size / 28);
          ctx.strokeStyle = el.effectColor ?? "#000";
          ctx.strokeText(line, startX, y);
        }
        ctx.fillStyle = el.color ?? "#000";
        ctx.fillText(line, startX, y);
      });
      break;
    }
    case "svg": {
      if (el.svg) {
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(el.svg)}`;
        try {
          const img = await loadImage(dataUrl);
          // contain fit
          const ar = img.width / img.height || el.w / el.h;
          let dw = el.w, dh = el.w / ar;
          if (dh > el.h) { dh = el.h; dw = el.h * ar; }
          ctx.drawImage(img, lx + (el.w - dw) / 2, ly + (el.h - dh) / 2, dw, dh);
        } catch { /* ignore */ }
      }
      break;
    }
    case "frame": {
      applyFrameClip(ctx, el.clipPath, lx, ly, el.w, el.h);
      if (el.src) {
        try {
          const img = await loadImage(el.src);
          const scale = Math.max(el.w / img.naturalWidth, el.h / img.naturalHeight);
          const dw = img.naturalWidth * scale;
          const dh = img.naturalHeight * scale;
          const cf = imageColorFilter(el);
          if (cf) ctx.filter = cf;
          ctx.drawImage(img, lx + (el.w - dw) / 2, ly + (el.h - dh) / 2, dw, dh);
          ctx.filter = "none";
        } catch { /* ignore */ }
      } else {
        ctx.fillStyle = "#dde1e7"; ctx.fillRect(lx, ly, el.w, el.h);
      }
      break;
    }
    case "image": {
      if (el.src) {
        try {
          const img = await loadImage(el.src);
          const nw = img.naturalWidth, nh = img.naturalHeight;
          const crop = el.crop ?? { t: 0, r: 0, b: 0, l: 0 };
          const srcX = crop.l * nw, srcY = crop.t * nh;
          const srcW = Math.max(1, (1 - crop.l - crop.r) * nw);
          const srcH = Math.max(1, (1 - crop.t - crop.b) * nh);
          // cover fit of crop region into box
          const scale = Math.max(el.w / srcW, el.h / srcH);
          const visW = el.w / scale, visH = el.h / scale;
          const sx = srcX + (srcW - visW) / 2, sy = srcY + (srcH - visH) / 2;

          // render rounded + filtered image to an offscreen canvas
          const off = document.createElement("canvas");
          off.width = Math.max(1, Math.round(el.w));
          off.height = Math.max(1, Math.round(el.h));
          const octx = off.getContext("2d");
          if (octx) {
            roundRectPath(octx, 0, 0, off.width, off.height, el.radius ?? 0);
            octx.clip();
            const cf = imageColorFilter(el);
            if (cf) octx.filter = cf;
            octx.save();
            if (el.flipH || el.flipV) {
              octx.translate(el.flipH ? off.width : 0, el.flipV ? off.height : 0);
              octx.scale(el.flipH ? -1 : 1, el.flipV ? -1 : 1);
            }
            octx.drawImage(img, sx, sy, visW, visH, 0, 0, off.width, off.height);
            octx.restore();
          }
          // draw offscreen onto main ctx with shadow following rounded alpha
          const sh = el.shadow && SHADOW_MAP[el.shadow];
          if (sh) { ctx.shadowColor = sh.c; ctx.shadowBlur = sh.b; ctx.shadowOffsetX = sh.x; ctx.shadowOffsetY = sh.y; }
          ctx.drawImage(off, lx, ly, el.w, el.h);
        } catch {
          ctx.fillStyle = "#e2e6e9";
          ctx.fillRect(lx, ly, el.w, el.h);
        }
      }
      break;
    }
  }
  ctx.restore();
}

export async function renderPageToCanvas(
  page: CanvaPage,
  W: number,
  H: number,
  pixelRatio = 2
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * pixelRatio);
  canvas.height = Math.round(H * pixelRatio);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.scale(pixelRatio, pixelRatio);

  // background
  ctx.fillStyle = page.background || "#ffffff";
  ctx.fillRect(0, 0, W, H);

  await document.fonts.ready;
  for (const el of page.elements) {
    // reset transient state between elements
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.filter = "none";
    await drawElement(ctx, el);
  }
  ctx.shadowColor = "transparent"; ctx.filter = "none";
  return canvas;
}
