"use client";

import type { CanvaElement, CanvaPage } from "@/types/canva";
import type { CSSProperties } from "react";
import { imageColorFilter, imageShadowFilter, imageFlipTransform } from "./imagePresets";

export function elementBoxStyle(el: CanvaElement): CSSProperties {
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

// Static render of one element — used by the editor canvas, page thumbnails, and project cards
export function ElementView({ el }: { el: CanvaElement }) {
  const box = elementBoxStyle(el);

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
      // Inner image geometry — when cropped, scale the full image so the kept region fills the box
      const fullW = crop ? `${100 / Math.max(0.02, 1 - crop.l - crop.r)}%` : "100%";
      const fullH = crop ? `${100 / Math.max(0.02, 1 - crop.t - crop.b)}%` : "100%";
      const imgLeft = crop ? `${(-crop.l * 100) / Math.max(0.02, 1 - crop.l - crop.r)}%` : "0";
      const imgTop = crop ? `${(-crop.t * 100) / Math.max(0.02, 1 - crop.t - crop.b)}%` : "0";
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
              objectFit: "cover",
              filter: colorFilter,
              transform: flip,
              transformOrigin: "center",
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
      return (
        <div style={{ ...box, overflow: "hidden", clipPath: frameClip }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={el.src}
            alt={el.altText ?? ""}
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: colorFilter || undefined,
              transform: imageFlipTransform(el),
              transformOrigin: "center",
            }}
          />
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
