"use client";

import type { CanvaElement, CanvaPage, ElementAnimation } from "@/types/canva";
import type { CSSProperties } from "react";
import { imageColorFilter, imageShadowFilter, imageFlipTransform } from "./imagePresets";

export function getAnimKeyframeName(anim: ElementAnimation): string {
  if (anim.type === "pan") {
    return `canva-pan-${anim.direction ?? "left"}`;
  }
  const map: Record<string, string> = {
    fade: "canva-fade", rise: "canva-rise", pop: "canva-pop",
    blur: "canva-blur", wipe: "canva-wipe", drift: "canva-drift",
    breathe: "canva-breathe", succession: "canva-fade", baseline: "canva-baseline",
    tectonic: "canva-tectonic", tumble: "canva-tumble", neon: "canva-neon",
    scrapbook: "canva-scrapbook", stomp: "canva-stomp",
    "photo-flow": "canva-photo-flow", "photo-rise": "canva-photo-rise", "photo-zoom": "canva-photo-zoom",
    rotate: "canva-rotate-in", flicker: "canva-flicker", pulse: "canva-pulse", wiggle: "canva-wiggle",
  };
  return map[anim.type] ?? "canva-fade";
}

export function getAnimDuration(speed: number): number {
  return 0.3 + speed * 1.7;
}

export function elementBoxStyle(el: CanvaElement, asChild?: boolean): CSSProperties {
  if (asChild) {
    return {
      position: "absolute",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      transform: `rotate(${el.rotation}deg)`,
      opacity: el.opacity,
    };
  }
  return {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    transform: `rotate(${el.rotation}deg)`,
    opacity: el.opacity,
  };
}

// Visual-crop image box that is GUARANTEED to cover the element box, so a cropped
// image can never leave a transparent gap (and, with objectFit:cover, never stretch)
// no matter how the crop values were produced (cropping, resizing, legacy data).
export function coverCropBox(el: CanvaElement): { left: number; top: number; width: number; height: number } {
  let bw = el.cropW ?? el.w;
  let bh = el.cropH ?? el.h;
  let bx = el.cropX ?? 0;
  let by = el.cropY ?? 0;
  // Scale the box up uniformly if it is too small to cover the frame.
  const s = Math.max(el.w / bw, el.h / bh, 1);
  if (s > 1) {
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    bw *= s;
    bh *= s;
    bx = cx - bw / 2;
    by = cy - bh / 2;
  }
  // Clamp position so the frame stays fully covered (no gaps on any edge).
  bx = Math.min(0, Math.max(el.w - bw, bx));
  by = Math.min(0, Math.max(el.h - bh, by));
  return { left: bx, top: by, width: bw, height: bh };
}

// Static render of one element — used by the editor canvas, page thumbnails, and project cards
export function ElementView({ el, asChild }: { el: CanvaElement; asChild?: boolean }) {
  const box = elementBoxStyle(el, asChild);

  switch (el.type) {
    case "text": {
      const decoration = [el.underline && "underline", el.strike && "line-through"].filter(Boolean).join(" ");
      return (
        <div
          style={{
            ...box,
            fontSize: el.fontSize,
            fontFamily: el.fontFamily,
            fontWeight: el.fontWeight,
            fontStyle: el.fontStyle,
            textAlign: el.textAlign,
            lineHeight: el.lineHeight ?? 1.3,
            letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
            color: el.color,
            textDecoration: decoration || undefined,
            textTransform: el.textTransform && el.textTransform !== "none" ? el.textTransform : undefined,
            textShadow: el.effect === "shadow" ? `0.05em 0.08em 0.18em ${el.effectColor ?? "rgba(0,0,0,0.45)"}` : undefined,
            WebkitTextStroke: el.effect === "outline" ? `${Math.max(1, (el.fontSize ?? 24) / 28)}px ${el.effectColor ?? "#000000"}` : undefined,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflow: "visible",
          }}
        >
          {el.text}
        </div>
      );
    }
    case "rect":
      return (
        <div
          style={{
            ...box,
            background: el.fill === "transparent" ? "transparent" : el.fill,
            border: el.strokeWidth ? `${el.strokeWidth}px solid ${el.stroke ?? "#000"}` : undefined,
            borderRadius: el.radius,
          }}
        />
      );
    case "ellipse":
      return (
        <div
          style={{
            ...box,
            background: el.fill === "transparent" ? "transparent" : el.fill,
            border: el.strokeWidth ? `${el.strokeWidth}px solid ${el.stroke ?? "#000"}` : undefined,
            borderRadius: "50%",
          }}
        />
      );
    case "triangle":
      return (
        <div
          style={{
            ...box,
            background: el.fill,
            clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
          }}
        />
      );
    case "shape":
      return (
        <div
          style={{
            ...box,
            background: el.fill,
            clipPath: el.clipPath,
          }}
        />
      );
    case "svg":
      return (
        <div
          style={{ ...box, color: el.fill }}
          // Decorative vector graphic — markup is from our own static catalogue
          dangerouslySetInnerHTML={{ __html: el.svg ?? "" }}
        />
      );
    case "image": {
      if (!el.src) return <div style={{ ...box, background: "#e2e6e9" }} />;
      const crop = el.crop;
      const colorFilter = imageColorFilter(el);
      const shadowFilter = imageShadowFilter(el);
      const flip = imageFlipTransform(el);

      // Visual crop model (new) takes precedence over legacy t/r/b/l fractions
      let imgLeft: string, imgTop: string, fullW: string, fullH: string, imgTransform: string, imgOrigin: string;
      if (el.cropW !== undefined) {
        const cb = coverCropBox(el);
        imgLeft = `${cb.left}px`;
        imgTop = `${cb.top}px`;
        fullW = `${cb.width}px`;
        fullH = `${cb.height}px`;
        imgTransform = el.cropRotation ? `${flip ?? ""} rotate(${el.cropRotation}deg)` : (flip ?? "none");
        imgOrigin = "50% 50%";
      } else {
        // Legacy t/r/b/l inset fractions
        fullW = crop ? `${100 / Math.max(0.02, 1 - crop.l - crop.r)}%` : "100%";
        fullH = crop ? `${100 / Math.max(0.02, 1 - crop.t - crop.b)}%` : "100%";
        imgLeft = crop ? `${(-crop.l * 100) / Math.max(0.02, 1 - crop.l - crop.r)}%` : "0";
        imgTop = crop ? `${(-crop.t * 100) / Math.max(0.02, 1 - crop.t - crop.b)}%` : "0";
        imgTransform = flip ?? "none";
        imgOrigin = "center";
      }

      return (
        // Wrapper clips to rounded corners (export-safe) and carries the shadow/effect filter
        <div
          style={{
            ...box,
            overflow: "hidden",
            borderRadius: el.radius,
            filter: shadowFilter,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={el.src}
            alt={el.altText ?? ""}
            draggable={false}
            style={{
              position: "absolute",
              left: imgLeft,
              top: imgTop,
              width: fullW,
              height: fullH,
              // Always "cover" so the image can never be distorted, regardless of
              // how the crop box ratio relates to the image's natural ratio.
              objectFit: "cover",
              filter: colorFilter,
              transform: imgTransform,
              transformOrigin: imgOrigin,
            }}
          />
        </div>
      );
    }
    case "frame": {
      const frameClip = el.clipPath || undefined;
      if (!el.src) {
        return (
          <div
            style={{
              ...box,
              overflow: "hidden",
              clipPath: frameClip,
              background: "#dde1e7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        );
      }
      const colorFilter = imageColorFilter(el);
      // Visual crop model for frames
      const fcb = el.cropW !== undefined ? coverCropBox(el) : null;
      const fImgStyle: React.CSSProperties = fcb ? {
        position: "absolute",
        left: `${fcb.left}px`,
        top: `${fcb.top}px`,
        width: `${fcb.width}px`,
        height: `${fcb.height}px`,
        objectFit: "cover",
        filter: colorFilter || undefined,
        transform: el.cropRotation ? `${imageFlipTransform(el)} rotate(${el.cropRotation}deg)` : imageFlipTransform(el),
        transformOrigin: "50% 50%",
      } : {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: colorFilter || undefined,
        transform: imageFlipTransform(el),
        transformOrigin: "center",
      };
      return (
        <div style={{ ...box, overflow: "hidden", clipPath: frameClip }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={el.src} alt={el.altText ?? ""} draggable={false} style={fImgStyle} />
        </div>
      );
    }
    default:
      return null;
  }
}

interface PageRendererProps {
  page: CanvaPage;
  width: number;
  height: number;
  /** Rendered (CSS) width — the page scales down to fit */
  displayWidth: number;
  className?: string;
}

// Scaled static render of a full page — for thumbnails
export function PageRenderer({ page, width, height, displayWidth, className }: PageRendererProps) {
  const scale = displayWidth / width;
  return (
    <div
      className={className}
      style={{ width: displayWidth, height: height * scale, overflow: "hidden", position: "relative" }}
    >
      <div
        style={{
          width,
          height,
          background: page.background,
          position: "absolute",
          top: 0,
          left: 0,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {page.elements.map((el) => (
          <ElementView key={el.id} el={el} />
        ))}
      </div>
    </div>
  );
}
