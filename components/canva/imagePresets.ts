import type { CanvaElement } from "@/types/canva";

// Photo filter presets (the "Filters" toolbar button)
export const FILTER_PRESETS: { id: string; label: string; css: string }[] = [
  { id: "none", label: "None", css: "" },
  { id: "vivid", label: "Vivid", css: "saturate(1.6) contrast(1.08)" },
  { id: "warm", label: "Warm", css: "sepia(0.25) saturate(1.3) hue-rotate(-10deg)" },
  { id: "cool", label: "Cool", css: "saturate(1.2) hue-rotate(15deg) brightness(1.03)" },
  { id: "greyscale", label: "Greyscale", css: "grayscale(1)" },
  { id: "noir", label: "Noir", css: "grayscale(1) contrast(1.4) brightness(0.95)" },
  { id: "mono", label: "Mono", css: "grayscale(1) brightness(1.05)" },
  { id: "sepia", label: "Sepia", css: "sepia(0.6)" },
  { id: "fade", label: "Fade", css: "contrast(0.85) brightness(1.1) saturate(0.8)" },
  { id: "dramatic", label: "Dramatic", css: "contrast(1.3) saturate(1.1) brightness(0.95)" },
  { id: "invert", label: "Invert", css: "invert(1)" },
];

// Shadow presets (the "Shadows" panel)
export const SHADOW_PRESETS: { id: string; label: string; filter: string }[] = [
  { id: "none", label: "None", filter: "" },
  { id: "glow", label: "Glow", filter: "drop-shadow(0 0 14px rgba(0,0,0,0.4))" },
  { id: "drop", label: "Drop", filter: "drop-shadow(6px 8px 10px rgba(0,0,0,0.35))" },
  { id: "outline", label: "Outline", filter: "drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff)" },
  { id: "curved", label: "Curved", filter: "drop-shadow(0 14px 9px rgba(0,0,0,0.28))" },
  { id: "page-lift", label: "Page lift", filter: "drop-shadow(0 18px 14px rgba(0,0,0,0.32))" },
  { id: "angled", label: "Angled", filter: "drop-shadow(12px 12px 7px rgba(0,0,0,0.32))" },
  { id: "backdrop", label: "Backdrop", filter: "drop-shadow(16px 16px 0 rgba(0,0,0,0.18))" },
];

// Stylised image effects (the "Effects" panel — Drop/Glow/Echo/Glitch + Advanced)
export const IMAGE_EFFECTS: { id: string; label: string; group: "Effects" | "Advanced"; filter: string }[] = [
  { id: "none", label: "None", group: "Effects", filter: "" },
  { id: "drop", label: "Drop", group: "Effects", filter: "drop-shadow(5px 6px 6px rgba(0,0,0,0.35))" },
  { id: "glow", label: "Glow", group: "Effects", filter: "drop-shadow(0 0 16px rgba(80,120,255,0.65))" },
  { id: "echo", label: "Echo", group: "Effects", filter: "drop-shadow(8px 0 0 rgba(255,0,90,0.38)) drop-shadow(-8px 0 0 rgba(0,180,255,0.38))" },
  { id: "glitch", label: "Glitch", group: "Effects", filter: "drop-shadow(-4px 0 0 rgba(255,0,80,0.7)) drop-shadow(4px 0 0 rgba(0,255,200,0.7))" },
  { id: "simple", label: "Simple", group: "Advanced", filter: "drop-shadow(3px 3px 3px rgba(0,0,0,0.3))" },
  { id: "radioactive", label: "Radioactive", group: "Advanced", filter: "drop-shadow(0 0 12px rgba(60,255,80,0.85))" },
  { id: "retro", label: "Retro", group: "Advanced", filter: "drop-shadow(4px 4px 0 #ff5d8f) drop-shadow(8px 8px 0 #ffd166)" },
  { id: "midnight", label: "Midnight", group: "Advanced", filter: "drop-shadow(0 0 14px rgba(40,40,140,0.9))" },
  { id: "malibu", label: "Malibu", group: "Advanced", filter: "drop-shadow(0 0 14px rgba(255,90,160,0.8))" },
  { id: "chroma", label: "Chroma", group: "Advanced", filter: "drop-shadow(-6px 0 0 rgba(120,80,255,0.55)) drop-shadow(6px 0 0 rgba(0,200,255,0.55))" },
  { id: "vhs", label: "VHS", group: "Advanced", filter: "drop-shadow(-3px 0 0 rgba(255,0,0,0.5)) drop-shadow(3px 0 0 rgba(0,0,255,0.5))" },
  { id: "metallic", label: "Metallic", group: "Advanced", filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.45))" },
  { id: "laser", label: "Laser", group: "Advanced", filter: "drop-shadow(0 0 10px rgba(255,0,80,0.9)) drop-shadow(0 0 20px rgba(255,0,80,0.6))" },
];

// Colour adjustments + photo filter — applied to the <img> itself.
export function imageColorFilter(el: CanvaElement): string | undefined {
  const parts: string[] = [];
  if (el.brightness != null && el.brightness !== 100) parts.push(`brightness(${el.brightness}%)`);
  if (el.contrast != null && el.contrast !== 100) parts.push(`contrast(${el.contrast}%)`);
  if (el.saturate != null && el.saturate !== 100) parts.push(`saturate(${el.saturate}%)`);
  if (el.blur) parts.push(`blur(${el.blur}px)`);
  const fp = FILTER_PRESETS.find((p) => p.id === el.filterPreset)?.css;
  if (fp) parts.push(fp);
  return parts.length ? parts.join(" ") : undefined;
}

// Shadow + stylised effect drop-shadows — applied to the wrapper so they follow
// the (possibly rounded) silhouette and render outside the clipped image.
export function imageShadowFilter(el: CanvaElement): string | undefined {
  const parts: string[] = [];
  const eff = IMAGE_EFFECTS.find((p) => p.id === el.imageEffect)?.filter;
  if (eff) parts.push(eff);
  const sh = SHADOW_PRESETS.find((p) => p.id === el.shadow)?.filter;
  if (sh) parts.push(sh);
  return parts.length ? parts.join(" ") : undefined;
}

export function imageFlipTransform(el: CanvaElement): string | undefined {
  if (!el.flipH && !el.flipV) return undefined;
  return `scaleX(${el.flipH ? -1 : 1}) scaleY(${el.flipV ? -1 : 1})`;
}
