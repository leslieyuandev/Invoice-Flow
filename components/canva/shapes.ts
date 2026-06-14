import type { CanvaElement } from "@/types/canva";

export type ShapeKind = "rect" | "ellipse" | "triangle" | "shape" | "line";

export interface ShapeDef {
  id: string;
  label: string;
  group: "Lines" | "Basic" | "Polygons" | "Stars" | "Arrows";
  kind: ShapeKind;
  clipPath?: string; // for kind === "shape"
  rounded?: boolean; // rect with corner radius
  dashed?: boolean;  // line variant
  arrowLine?: boolean;
}

export const SHAPES: ShapeDef[] = [
  // Lines
  { id: "line", label: "Line", group: "Lines", kind: "line" },
  { id: "line-dashed", label: "Dashed line", group: "Lines", kind: "line", dashed: true },
  { id: "line-arrow", label: "Arrow line", group: "Lines", kind: "line", arrowLine: true },

  // Basic
  { id: "square", label: "Square", group: "Basic", kind: "rect" },
  { id: "rounded", label: "Rounded square", group: "Basic", kind: "rect", rounded: true },
  { id: "circle", label: "Circle", group: "Basic", kind: "ellipse" },
  { id: "triangle", label: "Triangle", group: "Basic", kind: "triangle" },
  { id: "right-triangle", label: "Right triangle", group: "Basic", kind: "shape", clipPath: "polygon(0 0, 0 100%, 100% 100%)" },
  { id: "diamond", label: "Diamond", group: "Basic", kind: "shape", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
  { id: "parallelogram", label: "Parallelogram", group: "Basic", kind: "shape", clipPath: "polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)" },
  { id: "trapezoid", label: "Trapezoid", group: "Basic", kind: "shape", clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)" },
  { id: "cross", label: "Cross", group: "Basic", kind: "shape", clipPath: "polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)" },

  // Polygons
  { id: "pentagon", label: "Pentagon", group: "Polygons", kind: "shape", clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" },
  { id: "hexagon", label: "Hexagon", group: "Polygons", kind: "shape", clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)" },
  { id: "hexagon-flat", label: "Hexagon (flat)", group: "Polygons", kind: "shape", clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" },
  { id: "heptagon", label: "Heptagon", group: "Polygons", kind: "shape", clipPath: "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)" },
  { id: "octagon", label: "Octagon", group: "Polygons", kind: "shape", clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" },

  // Stars
  { id: "star4", label: "4-point star", group: "Stars", kind: "shape", clipPath: "polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)" },
  { id: "star5", label: "5-point star", group: "Stars", kind: "shape", clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" },
  { id: "star6", label: "6-point star", group: "Stars", kind: "shape", clipPath: "polygon(50% 0%, 63% 25%, 100% 25%, 75% 50%, 100% 75%, 63% 75%, 50% 100%, 37% 75%, 0% 75%, 25% 50%, 0% 25%, 37% 25%)" },
  { id: "burst", label: "Burst", group: "Stars", kind: "shape", clipPath: "polygon(50% 0%, 60% 18%, 79% 9%, 76% 30%, 98% 35%, 81% 50%, 98% 65%, 76% 70%, 79% 91%, 60% 82%, 50% 100%, 40% 82%, 21% 91%, 24% 70%, 2% 65%, 19% 50%, 2% 35%, 24% 30%, 21% 9%, 40% 18%)" },

  // Arrows
  { id: "arrow-right", label: "Arrow right", group: "Arrows", kind: "shape", clipPath: "polygon(0% 25%, 60% 25%, 60% 0%, 100% 50%, 60% 100%, 60% 75%, 0% 75%)" },
  { id: "arrow-left", label: "Arrow left", group: "Arrows", kind: "shape", clipPath: "polygon(40% 0%, 40% 25%, 100% 25%, 100% 75%, 40% 75%, 40% 100%, 0% 50%)" },
  { id: "arrow-up", label: "Arrow up", group: "Arrows", kind: "shape", clipPath: "polygon(50% 0%, 100% 40%, 75% 40%, 75% 100%, 25% 100%, 25% 40%, 0% 40%)" },
  { id: "arrow-down", label: "Arrow down", group: "Arrows", kind: "shape", clipPath: "polygon(25% 0%, 75% 0%, 75% 60%, 100% 60%, 50% 100%, 0% 60%, 25% 60%)" },
  { id: "chevron-right", label: "Chevron", group: "Arrows", kind: "shape", clipPath: "polygon(0% 0%, 50% 0%, 100% 50%, 50% 100%, 0% 100%, 50% 50%)" },
];

export const SHAPE_GROUPS: ShapeDef["group"][] = ["Lines", "Basic", "Polygons", "Stars", "Arrows"];

// Build the element spec (sans id) for a given shape on a W×H canvas.
export function shapeElement(def: ShapeDef, W: number, H: number): Omit<CanvaElement, "id"> {
  const s = Math.round(Math.min(W, H) / 4);
  const common = { rotation: 0, opacity: 1, fill: "#475569" as string };
  if (def.kind === "line") {
    const len = s * 2;
    return {
      type: "rect", x: Math.round(W / 2 - len / 2), y: Math.round(H / 2 - 3),
      w: len, h: 6, ...common,
      stroke: def.dashed ? "#475569" : undefined,
      strokeWidth: def.dashed ? 6 : undefined,
      fill: def.dashed ? "transparent" : "#475569",
      radius: 0,
    };
  }
  if (def.kind === "rect") {
    return { type: "rect", x: Math.round(W / 2 - s / 2), y: Math.round(H / 2 - s / 2), w: s, h: s, ...common, radius: def.rounded ? Math.round(s / 8) : 0 };
  }
  if (def.kind === "ellipse") {
    return { type: "ellipse", x: Math.round(W / 2 - s / 2), y: Math.round(H / 2 - s / 2), w: s, h: s, ...common };
  }
  if (def.kind === "triangle") {
    return { type: "triangle", x: Math.round(W / 2 - s / 2), y: Math.round(H / 2 - s / 2), w: s, h: s, ...common };
  }
  // generic clip-path shape
  return { type: "shape", x: Math.round(W / 2 - s / 2), y: Math.round(H / 2 - s / 2), w: s, h: s, ...common, clipPath: def.clipPath };
}
