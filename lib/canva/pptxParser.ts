import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { uid, CANVA_FORMATS } from "@/types/canva";
import type { CanvaElement, CanvaPage } from "@/types/canva";

// Tags that must always be treated as arrays even when only one child exists
const ALWAYS_ARRAY = new Set([
  "sp", "pic", "graphicFrame", "grpSp", "cxnSp",
  "p", "r", "br", "fld",
  "sldId", "Relationship",
  "gs", "gd",
]);

const PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  isArray: (name) => ALWAYS_ARRAY.has(name),
  parseAttributeValue: false,
  trimValues: true,
});

// ── helpers ──────────────────────────────────────────────────────────────────

function arr<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function px(emu: unknown, scale: number): number {
  return Math.round(Number(emu ?? 0) * scale);
}

// ── color extraction ─────────────────────────────────────────────────────────

const PRESET_COLORS: Record<string, string> = {
  white: "#ffffff", black: "#000000", red: "#ff0000", green: "#00ff00",
  blue: "#0000ff", yellow: "#ffff00", cyan: "#00ffff", magenta: "#ff00ff",
  orange: "#ffa500", purple: "#800080", pink: "#ffc0cb",
  gray: "#808080", grey: "#808080", darkGray: "#404040", lightGray: "#c0c0c0",
  aliceBlue: "#f0f8ff", antiqueWhite: "#faebd7", aqua: "#00ffff",
  coral: "#ff7f50", gold: "#ffd700", indigo: "#4b0082", ivory: "#fffff0",
  lavender: "#e6e6fa", lime: "#00ff00", maroon: "#800000", navy: "#000080",
  olive: "#808000", salmon: "#fa8072", silver: "#c0c0c0", teal: "#008080",
  violet: "#ee82ee",
};

function extractColor(fill: Record<string, unknown> | null | undefined, theme: Record<string, string>): string | undefined {
  if (!fill) return undefined;
  const srgb = fill["srgbClr"] as any;
  if (srgb) { const v = srgb["@_val"]; return v ? "#" + String(v).toLowerCase().padStart(6, "0") : undefined; }
  const sys = fill["sysClr"] as any;
  if (sys) { const v = sys["@_lastClr"]; return v ? "#" + String(v).toLowerCase().padStart(6, "0") : undefined; }
  const scheme = fill["schemeClr"] as any;
  if (scheme) { const k = scheme["@_val"]; return k ? (theme[k] ?? undefined) : undefined; }
  const prst = fill["prstClr"] as any;
  if (prst) { const k = prst["@_val"]; return k ? (PRESET_COLORS[k] ?? "#000000") : undefined; }
  return undefined;
}

// ── theme colors ─────────────────────────────────────────────────────────────

function parseTheme(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const doc = PARSER.parse(xml);
    const scheme = doc["theme"]?.["themeElements"]?.["clrScheme"];
    if (!scheme) return result;
    for (const [key, node] of Object.entries<unknown>(scheme)) {
      if (key.startsWith("@")) continue;
      const c = extractColor(node as any, {});
      if (c) result[key] = c;
    }
  } catch { /* ignore */ }
  return result;
}

// ── text helpers ─────────────────────────────────────────────────────────────

const ALIGN_MAP: Record<string, "left" | "center" | "right"> = {
  l: "left", ctr: "center", r: "right", just: "left", dist: "left", thaiDist: "left",
};

function extractText(txBody: any): string {
  if (!txBody) return "";
  const paras = arr<any>(txBody["p"]);
  return paras.map((para: any) => {
    const runs = arr<any>(para["r"]);
    const text = runs.map((r: any) => {
      const t = r["t"];
      return t == null ? "" : String(t);
    }).join("");
    return text;
  }).join("\n");
}

function extractTextStyle(txBody: any, scaleY: number, theme: Record<string, string>): Partial<CanvaElement> {
  const style: Partial<CanvaElement> = {};
  if (!txBody) return style;

  const paras = arr<any>(txBody["p"]);
  if (!paras.length) return style;

  const pPr = paras[0]["pPr"];
  const algn = pPr?.["@_algn"];
  if (algn) style.textAlign = ALIGN_MAP[algn] ?? "left";

  // Find first run that has text to pull typography from
  let rPr: any = null;
  for (const para of paras) {
    for (const r of arr<any>(para["r"])) {
      if (r["t"] != null && String(r["t"]).trim()) {
        rPr = r["rPr"];
        break;
      }
    }
    if (rPr !== null) break;
  }

  // Also check lstStyle default run properties as fallback
  const defRPr = txBody["lstStyle"]?.["defPPr"]?.["defRPr"] ?? txBody["bodyPr"]?.["defRPr"];

  const rp = rPr ?? defRPr;
  if (rp) {
    const sz = rp["@_sz"];
    // sz is in hundredths of a point. Convert: (sz/100) pts * 12700 EMU/pt * scaleY px/EMU
    if (sz) style.fontSize = Math.max(8, Math.round((Number(sz) / 100) * 12700 * scaleY));

    if (rp["@_b"] === "1") style.fontWeight = 700;
    if (rp["@_i"] === "1") style.fontStyle = "italic";
    const u = rp["@_u"];
    if (u && u !== "none") style.underline = true;
    const strike = rp["@_strike"];
    if (strike && strike !== "noStrike") style.strike = true;

    const latin = rp["latin"];
    const tf: string = latin?.["@_typeface"] ?? "";
    // Skip theme font placeholders (+mj-lt, +mn-lt)
    if (tf && !tf.startsWith("+")) style.fontFamily = tf;

    const sf = rp["solidFill"];
    if (sf) { const c = extractColor(sf, theme); if (c) style.color = c; }
  }

  return style;
}

// ── geometry mapping ──────────────────────────────────────────────────────────

const GEOM_MAP: Record<string, CanvaElement["type"]> = {
  rect: "rect", roundRect: "rect",
  snip1Rect: "rect", snip2SameRect: "rect", snip2DiagRect: "rect",
  snipRoundRect: "rect", bevel: "rect",
  ellipse: "ellipse", oval: "ellipse", circle: "ellipse",
  triangle: "triangle", rtTriangle: "triangle",
};

// ── slide rel parsing ─────────────────────────────────────────────────────────

function parseSlideRels(xml: string): Record<string, string> {
  const rels: Record<string, string> = {};
  try {
    const doc = PARSER.parse(xml);
    for (const rel of arr<any>(doc["Relationships"]?.["Relationship"])) {
      const type: string = rel["@_Type"] ?? "";
      if (type.includes("image")) {
        rels[rel["@_Id"]] = rel["@_Target"] ?? "";
      }
    }
  } catch { /* ignore */ }
  return rels;
}

// Resolve a slide-relative path (e.g. "../media/image1.png") to a zip path
function resolveMediaPath(relTarget: string): string {
  // relTarget is relative to ppt/slides/, e.g. "../media/image1.png"
  return ("ppt/slides/" + relTarget).replace(/\/[^/]+\/\.\.\//g, "/");
}

// Content type for a file extension
function contentTypeFor(ext: string): string {
  switch (ext.toLowerCase()) {
    case "png": return "image/png";
    case "jpg": case "jpeg": return "image/jpeg";
    case "gif": return "image/gif";
    case "webp": return "image/webp";
    case "svg": return "image/svg+xml";
    case "bmp": return "image/bmp";
    default: return "image/png";
  }
}

// ── exports ───────────────────────────────────────────────────────────────────

export interface ImageEntry {
  data: Buffer;
  ext: string;
  name: string;
  contentType: string;
}

export interface PptxResult {
  width: number;
  height: number;
  formatId: string;
  pages: CanvaPage[];
  images: Map<string, ImageEntry>;
}

export async function parsePptx(buffer: Buffer): Promise<PptxResult> {
  const zip = await JSZip.loadAsync(buffer);

  // ── Slide dimensions ───────────────────────────────────────────────────────
  const presFile = zip.file("ppt/presentation.xml");
  if (!presFile) throw new Error("Invalid PPTX: missing ppt/presentation.xml");
  const pres = PARSER.parse(await presFile.async("text"));
  const presRoot = pres["presentation"];
  const sldSz = presRoot?.["sldSz"];
  const sldCx = Number(sldSz?.["@_cx"] ?? 9144000);
  const sldCy = Number(sldSz?.["@_cy"] ?? 5143500);

  // Map to the closest known canvas format by aspect ratio
  const aspect = sldCx / sldCy;
  let targetW = Math.round(sldCx / 9525); // 96 DPI
  let targetH = Math.round(sldCy / 9525);
  let formatId = "custom";
  for (const fmt of CANVA_FORMATS) {
    if (Math.abs(fmt.width / fmt.height - aspect) < 0.02) {
      targetW = fmt.width; targetH = fmt.height; formatId = fmt.id; break;
    }
  }
  const scaleX = targetW / sldCx;
  const scaleY = targetH / sldCy;

  // ── Theme colors ───────────────────────────────────────────────────────────
  const themeFile = zip.file("ppt/theme/theme1.xml");
  const theme = themeFile ? parseTheme(await themeFile.async("text")) : {};

  // ── Collect slide files in order ───────────────────────────────────────────
  const slideFiles = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml/)![1], 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml/)![1], 10);
      return na - nb;
    });

  const pages: CanvaPage[] = [];
  const images = new Map<string, ImageEntry>();

  // ── Per-slide processing ───────────────────────────────────────────────────
  for (let si = 0; si < slideFiles.length; si++) {
    const slideXml = await zip.file(slideFiles[si])!.async("text");
    const slide = PARSER.parse(slideXml);
    const cSld = slide["sld"]?.["cSld"];

    // Background color
    let background = "#ffffff";
    const bgPr = cSld?.["bg"]?.["bgPr"];
    if (bgPr) {
      const sf = bgPr["solidFill"];
      if (sf) { const c = extractColor(sf, theme); if (c) background = c; }
      const gf = bgPr["gradFill"];
      if (gf) {
        const stops = arr<any>(gf["gsLst"]?.["gs"]);
        if (stops[0]) { const c = extractColor(stops[0], theme); if (c) background = c; }
      }
      // Background image: blipFill — we don't extract it as a background colour,
      // so it will fall through to white. The image is added as a full-size
      // element later if we detect it here.
    }

    // Slide relationships (for embedded images)
    const slideNum = slideFiles[si].match(/slide(\d+)\.xml/)![1];
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    const relsFile = zip.file(relsPath);
    const slideRels = relsFile ? parseSlideRels(await relsFile.async("text")) : {};

    const elements: CanvaElement[] = [];

    // ── Shape tree walker ────────────────────────────────────────────────────
    async function walkTree(tree: any) {
      if (!tree) return;

      // ── Shapes (p:sp) ────────────────────────────────────────────────────
      for (const sp of arr<any>(tree["sp"])) {
        const spPr = sp["spPr"];
        const txBody = sp["txBody"];
        const xfrm = spPr?.["xfrm"];
        if (!xfrm) continue;

        const x = px(xfrm["off"]?.["@_x"], scaleX);
        const y = px(xfrm["off"]?.["@_y"], scaleY);
        const w = px(xfrm["ext"]?.["@_cx"], scaleX);
        const h = px(xfrm["ext"]?.["@_cy"], scaleY);
        if (w <= 0 || h <= 0) continue;

        const rotation = Math.round(Number(xfrm["@_rot"] ?? 0) / 60000);

        const prst: string = spPr?.["prstGeom"]?.["@_prst"] ?? "rect";
        const shapeType: CanvaElement["type"] = GEOM_MAP[prst] ?? "rect";

        // Fill
        let fill: string | undefined;
        if (spPr?.["solidFill"]) fill = extractColor(spPr["solidFill"], theme);
        if (spPr?.["gradFill"]) {
          const stops = arr<any>(spPr["gradFill"]["gsLst"]?.["gs"]);
          if (stops[0]) fill = extractColor(stops[0], theme);
        }
        if (spPr?.["noFill"] !== undefined) fill = "transparent";

        // Stroke
        let stroke: string | undefined;
        let strokeWidth: number | undefined;
        const ln = spPr?.["ln"];
        if (ln) {
          if (ln["solidFill"]) stroke = extractColor(ln["solidFill"], theme);
          if (ln["@_w"]) strokeWidth = Math.max(1, Math.round(Number(ln["@_w"]) * scaleX));
          if (ln["noFill"] !== undefined) { stroke = undefined; strokeWidth = undefined; }
        }

        // Corner radius for roundRect
        let radius: number | undefined;
        if (prst === "roundRect") {
          const gds = arr<any>(spPr?.["prstGeom"]?.["avLst"]?.["gd"]);
          const adj = gds.find((g: any) => g["@_name"] === "adj");
          if (adj) {
            const fmla: string = adj["@_fmla"] ?? "val 16667";
            const val = parseInt(fmla.replace("val ", ""), 10);
            radius = Math.round(Math.min(1, val / 100000) * Math.min(w, h) / 2);
          } else {
            radius = Math.round(Math.min(w, h) * 0.1); // default ~10%
          }
        }

        const text = extractText(txBody).trim();
        const ts = text ? extractTextStyle(txBody, scaleY, theme) : {};
        const hasVisibleShape = (fill && fill !== "transparent") || (stroke && strokeWidth);

        // Emit shape element
        if (hasVisibleShape) {
          elements.push({
            id: uid(), type: shapeType, x, y, w, h, rotation, opacity: 1,
            fill, stroke, strokeWidth, radius,
          });
        }

        // Emit text element (overlaid on top of the shape at same coords)
        if (text) {
          elements.push({
            id: uid(), type: "text", x, y, w, h, rotation, opacity: 1,
            text,
            fontSize: ts.fontSize ?? 24,
            fontFamily: ts.fontFamily,
            fontWeight: ts.fontWeight,
            fontStyle: ts.fontStyle,
            textAlign: ts.textAlign ?? "left",
            color: ts.color ?? "#000000",
            underline: ts.underline,
            strike: ts.strike,
          });
        }
      }

      // ── Pictures (p:pic) ─────────────────────────────────────────────────
      for (const pic of arr<any>(tree["pic"])) {
        const spPr = pic["spPr"];
        const blipFill = pic["blipFill"];
        const xfrm = spPr?.["xfrm"];
        if (!xfrm) continue;

        const x = px(xfrm["off"]?.["@_x"], scaleX);
        const y = px(xfrm["off"]?.["@_y"], scaleY);
        const w = px(xfrm["ext"]?.["@_cx"], scaleX);
        const h = px(xfrm["ext"]?.["@_cy"], scaleY);
        if (w <= 0 || h <= 0) continue;

        const rotation = Math.round(Number(xfrm["@_rot"] ?? 0) / 60000);

        // Extract embedded image
        const rId: string = blipFill?.["blip"]?.["@_embed"] ?? "";
        let src: string | undefined;

        if (rId && slideRels[rId]) {
          const resolved = resolveMediaPath(slideRels[rId]);
          const mediaFile = zip.file(resolved);
          if (mediaFile) {
            const data = await mediaFile.async("nodebuffer");
            const ext = resolved.split(".").pop()?.toLowerCase() ?? "png";
            const name = resolved.split("/").pop() ?? `img.${ext}`;
            const key = `slide${si}_${rId}`;
            images.set(key, { data, ext, name, contentType: contentTypeFor(ext) });
            src = key; // placeholder replaced with Blob URL by the API route
          }
        }

        elements.push({
          id: uid(), type: "image", x, y, w, h, rotation, opacity: 1, src,
        });
      }

      // ── Recurse into groups (p:grpSp) ────────────────────────────────────
      for (const grp of arr<any>(tree["grpSp"])) {
        await walkTree(grp);
      }
    }

    await walkTree(cSld?.["spTree"]);

    pages.push({ id: uid(), background, elements });
  }

  return { width: targetW, height: targetH, formatId, pages, images };
}
