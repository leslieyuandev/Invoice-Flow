// ─── Canva Project editor types ──────────────────────────────────────────────

export type CanvaElementType = "text" | "rect" | "ellipse" | "triangle" | "shape" | "svg" | "image" | "frame";

export interface CanvaElement {
  id: string;
  type: CanvaElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number; // degrees
  opacity: number; // 0–1

  // text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  letterSpacing?: number;
  color?: string;
  underline?: boolean;
  strike?: boolean;
  textTransform?: "none" | "uppercase" | "capitalize";
  effect?: "none" | "shadow" | "outline";
  effectColor?: string;

  // shapes
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number; // corner radius (rect / image)
  clipPath?: string; // for type === "shape"
  svg?: string; // raw inline SVG markup for type === "svg" (decorative graphics)

  // image
  src?: string;
  altText?: string;
  flipH?: boolean;
  flipV?: boolean;
  brightness?: number; // % (100 = normal)
  contrast?: number;   // %
  saturate?: number;   // %
  blur?: number;       // px
  filterPreset?: string; // named filter preset id
  crop?: { t: number; r: number; b: number; l: number }; // inset fractions 0–1 (legacy)
  // Visual crop model (takes precedence over crop t/r/b/l when cropW is set)
  cropX?: number;        // image left offset within element frame (px, ≤ 0 for full coverage)
  cropY?: number;        // image top offset within element frame (px, ≤ 0 for full coverage)
  cropW?: number;        // image display width (px, ≥ element w for full coverage)
  cropH?: number;        // image display height (px, ≥ element h for full coverage)
  cropRotation?: number; // image rotation within frame (degrees)
  shadow?: string;      // shadow preset id
  imageEffect?: string; // image effect/style preset id

  // misc
  locked?: boolean;
  link?: string;
  groupId?: string;

  // animation
  animation?: ElementAnimation;
}

export type AnimationType =
  | "fade" | "rise" | "pop" | "blur" | "wipe" | "pan"
  | "drift" | "breathe" | "succession" | "baseline"
  | "tectonic" | "tumble" | "neon" | "scrapbook" | "stomp"
  | "photo-flow" | "photo-rise" | "photo-zoom"
  | "rotate" | "flicker" | "pulse" | "wiggle";

export interface ElementAnimation {
  type: AnimationType;
  trigger: "both" | "enter" | "exit";
  speed: number;
  direction?: "up" | "down" | "left" | "right";
  reverseExit?: boolean;
}

export interface CanvaPage {
  id: string;
  background: string;
  elements: CanvaElement[];
}

export interface CanvaAsset {
  id: string;
  type: string; // "image" | "font"
  url: string;
  name: string;
  meta: string;
}

export interface CanvaProjectData {
  id: string;
  title: string;
  format: string;
  width: number;
  height: number;
  pages: CanvaPage[];
  updatedAt: string;
}

export interface CanvaFormat {
  id: string;
  label: string;
  width: number;
  height: number;
  category: "Social Media" | "Presentation" | "Docs" | "Marketing" | "Whiteboard" | "Website";
}

export const CANVA_FORMATS: CanvaFormat[] = [
  { id: "instagram-post", label: "Instagram Post", width: 1080, height: 1080, category: "Social Media" },
  { id: "instagram-post-45", label: "Instagram Post (4:5)", width: 1080, height: 1350, category: "Social Media" },
  { id: "instagram-story", label: "Instagram Story", width: 1080, height: 1920, category: "Social Media" },
  { id: "facebook-post", label: "Facebook Post", width: 940, height: 788, category: "Social Media" },
  { id: "facebook-cover", label: "Facebook Cover", width: 1640, height: 924, category: "Social Media" },
  { id: "presentation", label: "Presentation 16:9", width: 1920, height: 1080, category: "Presentation" },
  { id: "doc-a4", label: "Doc (A4)", width: 794, height: 1123, category: "Docs" },
  { id: "resume", label: "Resume (A4)", width: 794, height: 1123, category: "Docs" },
  { id: "poster", label: "Poster", width: 1414, height: 2000, category: "Marketing" },
  { id: "invitation", label: "Invitation (5×7)", width: 1400, height: 2000, category: "Marketing" },
  { id: "business-card", label: "Business Card", width: 1050, height: 600, category: "Marketing" },
  { id: "brochure", label: "Brochure (A4 Landscape)", width: 1123, height: 794, category: "Marketing" },
  { id: "whiteboard", label: "Whiteboard", width: 2560, height: 1440, category: "Whiteboard" },
  { id: "website", label: "Website", width: 1440, height: 2560, category: "Website" },
];

export function getFormat(id: string): CanvaFormat | undefined {
  return CANVA_FORMATS.find((f) => f.id === id);
}

let uidCounter = 0;
export function uid(): string {
  uidCounter += 1;
  return `el-${Date.now().toString(36)}-${uidCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newPage(background = "#ffffff"): CanvaPage {
  return { id: uid(), background, elements: [] };
}
