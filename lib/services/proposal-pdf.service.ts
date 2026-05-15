import {
  Document,
  Page,
  Text,
  View,
  Image,
  Svg,
  Path,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import React from "react";
import type { ProposalWithItems } from "@/types/proposal";
import { FONT_PAIRS, getFontPair } from "@/lib/constants/fontPairs";

Font.registerHyphenationCallback((word) => [word]);

// Register all font pairs at module load — errors are non-fatal
const _registeredFamilies = new Set<string>();
function registerFontPair(pairId: string) {
  const pair = getFontPair(pairId);
  try {
    if (!_registeredFamilies.has(pair.heading)) {
      Font.register({ family: pair.heading, src: pair.pdfHeadingUrl });
      _registeredFamilies.add(pair.heading);
    }
    if (!_registeredFamilies.has(pair.body)) {
      Font.register({
        family: pair.body,
        fonts: [
          { src: pair.pdfBodyUrl, fontWeight: "normal" },
          { src: pair.pdfBodyBoldUrl, fontWeight: "bold" },
        ],
      });
      _registeredFamilies.add(pair.body);
    }
  } catch { /* non-fatal */ }
}
// Pre-register all pairs at startup
for (const p of FONT_PAIRS) registerFontPair(p.id);

const PAGE_SIZE: [number, number] = [841.89, 595.28];
const COVER_PHOTO_H = 330;
const GOLD = "#D4A843";
const DEFAULT_BG = "#C8151B";

function fmtRm(cents: number) {
  return `RM${Math.round(cents / 100)}`;
}

function getBg(proposal: ProposalWithItems) {
  return (proposal as unknown as { bgColor?: string }).bgColor || DEFAULT_BG;
}
function getProposalFont(proposal: ProposalWithItems) {
  const pairId = (proposal as unknown as { fontPair?: string }).fontPair;
  return getFontPair(pairId);
}

// ── Simple HTML → react-pdf parser ───────────────────────────────────────────

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function htmlToReactPdfNodes(html: string, bodyFont: string): React.ReactElement[] {
  if (!html?.trim() || html === "<p></p>") return [];

  // If no HTML tags, treat as plain text (backward compat)
  if (!html.includes("<")) {
    return [React.createElement(Text, {
      key: 0,
      style: { color: "rgba(255,255,255,0.9)", fontSize: 9, lineHeight: 1.6 },
    }, html)];
  }

  const nodes: React.ReactElement[] = [];
  let remaining = html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n/g, "");

  const GOLD_COLOR = GOLD;
  const WHITE = "rgba(255,255,255,0.9)";

  while (remaining.length > 0) {
    remaining = remaining.trimStart();
    if (!remaining) break;

    // Heading match
    const hMatch = remaining.match(/^<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/i);
    if (hMatch) {
      const level = hMatch[1];
      const text = stripTags(hMatch[2]);
      if (text) {
        const fontSize = level === "h1" ? 18 : level === "h2" ? 14 : 11;
        nodes.push(React.createElement(Text, {
          key: nodes.length,
          style: { color: GOLD_COLOR, fontSize, fontWeight: "bold", marginTop: 10, marginBottom: 5, fontFamily: bodyFont },
        }, text));
      }
      remaining = remaining.slice(hMatch[0].length);
      continue;
    }

    // Unordered list
    const ulMatch = remaining.match(/^<ul[^>]*>([\s\S]*?)<\/ul>/i);
    if (ulMatch) {
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liM;
      while ((liM = liRegex.exec(ulMatch[1])) !== null) {
        const text = stripTags(liM[1]);
        if (text.trim()) {
          nodes.push(React.createElement(View, {
            key: nodes.length,
            style: { flexDirection: "row", gap: 6, marginBottom: 3, alignItems: "flex-start" },
          },
            React.createElement(Text, { style: { color: GOLD_COLOR, fontSize: 9, lineHeight: 1.6 } }, "•"),
            React.createElement(Text, { style: { color: WHITE, fontSize: 9, lineHeight: 1.6, flex: 1 } }, text),
          ));
        }
      }
      remaining = remaining.slice(ulMatch[0].length);
      continue;
    }

    // Ordered list
    const olMatch = remaining.match(/^<ol[^>]*>([\s\S]*?)<\/ol>/i);
    if (olMatch) {
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liM;
      let n = 1;
      while ((liM = liRegex.exec(olMatch[1])) !== null) {
        const text = stripTags(liM[1]);
        if (text.trim()) {
          nodes.push(React.createElement(View, {
            key: nodes.length,
            style: { flexDirection: "row", gap: 6, marginBottom: 3, alignItems: "flex-start" },
          },
            React.createElement(Text, { style: { color: GOLD_COLOR, fontSize: 9, lineHeight: 1.6 } }, `${n}.`),
            React.createElement(Text, { style: { color: WHITE, fontSize: 9, lineHeight: 1.6, flex: 1 } }, text),
          ));
          n++;
        }
      }
      remaining = remaining.slice(olMatch[0].length);
      continue;
    }

    // Paragraph
    const pMatch = remaining.match(/^<p[^>]*>([\s\S]*?)<\/p>/i);
    if (pMatch) {
      const text = stripTags(pMatch[1]);
      if (text.trim()) {
        nodes.push(React.createElement(Text, {
          key: nodes.length,
          style: { color: WHITE, fontSize: 9, lineHeight: 1.6, marginBottom: 3 },
        }, text));
      }
      remaining = remaining.slice(pMatch[0].length);
      continue;
    }

    // Skip unknown tag
    const tagEnd = remaining.indexOf(">", 1);
    if (tagEnd !== -1) {
      remaining = remaining.slice(tagEnd + 1);
    } else {
      break;
    }
  }

  return nodes;
}

// ── Decorative SVG curls ──────────────────────────────────────────────────────

function CurlTopLeftSvg() {
  return React.createElement(
    Svg,
    { width: 90, height: 90, style: { position: "absolute", top: 0, left: 0 } },
    React.createElement(Path, {
      d: "M5 85 C20 60 35 35 70 12 C78 7 84 3 90 0",
      stroke: GOLD, strokeWidth: 1.2, fill: "none",
    }),
    React.createElement(Path, {
      d: "M0 55 C12 42 25 28 50 16",
      stroke: GOLD, strokeWidth: 0.8, fill: "none",
    }),
    React.createElement(Path, {
      d: "M0 25 C8 20 16 14 28 8",
      stroke: GOLD, strokeWidth: 0.6, fill: "none",
    }),
  );
}

function CurlTopRightSvg() {
  return React.createElement(
    Svg,
    { width: 90, height: 90, style: { position: "absolute", top: 0, right: 0 } },
    React.createElement(Path, {
      d: "M85 85 C70 60 55 35 20 12 C12 7 6 3 0 0",
      stroke: GOLD, strokeWidth: 1.2, fill: "none",
    }),
    React.createElement(Path, {
      d: "M90 55 C78 42 65 28 40 16",
      stroke: GOLD, strokeWidth: 0.8, fill: "none",
    }),
    React.createElement(Path, {
      d: "M90 25 C82 20 74 14 62 8",
      stroke: GOLD, strokeWidth: 0.6, fill: "none",
    }),
  );
}

function CurlPkgRightSvg() {
  return React.createElement(
    Svg,
    { width: 80, height: 80, style: { position: "absolute", top: 0, right: 0 } },
    React.createElement(Path, {
      d: "M80 0 C65 8 52 20 48 38 C44 50 46 62 40 72",
      stroke: GOLD, strokeWidth: 1.5, fill: "none",
    }),
    React.createElement(Path, {
      d: "M80 20 C70 26 62 34 58 46",
      stroke: GOLD, strokeWidth: 1, fill: "none",
    }),
  );
}

function CurlPkgLeftSvg() {
  return React.createElement(
    Svg,
    { width: 80, height: 80, style: { position: "absolute", top: 0, left: 0 } },
    React.createElement(Path, {
      d: "M0 0 C15 8 28 20 32 38 C36 50 34 62 40 72",
      stroke: GOLD, strokeWidth: 1.5, fill: "none",
    }),
    React.createElement(Path, {
      d: "M0 20 C10 26 18 34 22 46",
      stroke: GOLD, strokeWidth: 1, fill: "none",
    }),
  );
}

// ── Logo box ──────────────────────────────────────────────────────────────────

function logoEl(logoUrl: string | null | undefined, name: string, small = false, cover = false) {
  const height = cover ? 56 : small ? 20 : 28;
  const fontSize = cover ? 20 : small ? 8 : 11;
  if (logoUrl) {
    return React.createElement(Image, {
      src: logoUrl,
      style: { height, objectFit: "contain" },
    });
  }
  return React.createElement(
    Text,
    { style: { color: "white", fontWeight: "bold", fontSize } },
    name || "HALO BALLOON"
  );
}

// ── Cover Page ────────────────────────────────────────────────────────────────

function CoverPage({ proposal }: { proposal: ProposalWithItems }) {
  const bg = getBg(proposal);
  const title = proposal.eventTitle || "Balloon Packages";
  const font = getProposalFont(proposal);

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { flexDirection: "column" } },
    // Top: full-width photo section
    React.createElement(
      View,
      {
        style: {
          width: "100%",
          height: COVER_PHOTO_H,
          backgroundColor: "#666",
          overflow: "hidden",
          position: "relative",
        },
      },
      proposal.coverImageUrl
        ? React.createElement(Image, {
            src: proposal.coverImageUrl,
            style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, objectFit: "cover" },
          })
        : React.createElement(View, {
            style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bg, opacity: 0.45 },
          }),
      CurlTopLeftSvg(),
      CurlTopRightSvg(),
    ),
    // Bottom: colored panel with logo + title
    React.createElement(
      View,
      {
        style: {
          flex: 1,
          width: "100%",
          backgroundColor: bg,
          position: "relative",
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingLeft: 48,
          paddingRight: 48,
        },
      },
      // Logo centered at top of colored section
      React.createElement(
        View,
        { style: { position: "absolute", top: 18, left: 0, right: 0, alignItems: "center" } },
        logoEl(proposal.senderLogoUrl, proposal.senderName, false, true),
      ),
      // Event title
      React.createElement(
        Text,
        {
          style: {
            color: "white",
            fontSize: 36,
            fontWeight: "bold",
            lineHeight: 1.2,
            fontFamily: font.heading,
          },
        },
        title
      ),
    ),
  );
}

// ── Package Page (one per item) ───────────────────────────────────────────────

function PackagePage({
  item,
  index,
  proposal,
}: {
  item: ProposalWithItems["items"][0];
  index: number;
  proposal: ProposalWithItems;
}) {
  const bg = getBg(proposal);
  const isReversed = index % 2 === 1;
  let features: string[] = [];
  try { features = JSON.parse(item.features) as string[]; } catch { features = []; }

  const photoPanel = React.createElement(
    View,
    {
      style: {
        width: "40%",
        height: "100%",
        backgroundColor: "#555",
        overflow: "hidden",
      },
    },
    item.imageUrl
      ? React.createElement(Image, {
          src: item.imageUrl,
          style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, objectFit: "cover" },
        })
      : React.createElement(View, {
          style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bg, opacity: 0.35 },
        }),
  );

  const infoPanel = React.createElement(
    View,
    {
      style: {
        flex: 1,
        height: "100%",
        backgroundColor: bg,
        padding: 36,
        position: "relative",
        overflow: "hidden",
        justifyContent: "center",
      },
    },
    isReversed ? CurlPkgLeftSvg() : CurlPkgRightSvg(),
    // PACKAGE N label
    React.createElement(
      Text,
      {
        style: {
          color: GOLD,
          fontSize: 9,
          fontWeight: "bold",
          letterSpacing: 3,
          marginBottom: 8,
          fontFamily: getProposalFont(proposal).body,
        },
      },
      `PACKAGE ${index + 1}`
    ),
    // Price row
    React.createElement(
      View,
      { style: { flexDirection: "row", alignItems: "flex-end", marginBottom: 14 } },
      React.createElement(
        Text,
        { style: { color: GOLD, fontSize: 44, fontWeight: "bold", lineHeight: 1, fontFamily: getProposalFont(proposal).heading } },
        fmtRm(item.price)
      ),
      item.originalPrice != null
        ? React.createElement(
            Text,
            { style: { color: GOLD, fontSize: 18, marginLeft: 12, textDecoration: "line-through", opacity: 0.8, marginBottom: 4 } },
            fmtRm(item.originalPrice)
          )
        : null,
    ),
    // Package name
    React.createElement(
      Text,
      { style: { color: "white", fontSize: 18, fontWeight: "bold", marginBottom: item.tagline ? 4 : 12 } },
      item.packageName
    ),
    // Tagline
    item.tagline
      ? React.createElement(
          Text,
          { style: { color: "rgba(255,255,255,0.75)", fontSize: 10, marginBottom: 12 } },
          item.tagline
        )
      : null,
    // Features
    React.createElement(
      View,
      { style: { gap: 5 } },
      ...features.slice(0, 6).map((f, i) =>
        React.createElement(
          View,
          { key: i, style: { flexDirection: "row", gap: 8, alignItems: "flex-start" } },
          React.createElement(Text, { style: { color: GOLD, fontSize: 11, lineHeight: 1.2 } }, "•"),
          React.createElement(Text, { style: { color: "rgba(255,255,255,0.9)", fontSize: 9, lineHeight: 1.4, flex: 1 } }, f),
        )
      ),
    ),
    // Logo at outer corner of info panel
    React.createElement(
      View,
      { style: { position: "absolute", bottom: 20, ...(isReversed ? { left: 26 } : { right: 26 }) } },
      logoEl(proposal.senderLogoUrl, proposal.senderName, true),
    ),
  );

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { flexDirection: "row" } },
    isReversed ? infoPanel : photoPanel,
    isReversed ? photoPanel : infoPanel,
  );
}

// ── Add-Ons Page ──────────────────────────────────────────────────────────────

function AddOnsPage({ proposal }: { proposal: ProposalWithItems }) {
  const bg = getBg(proposal);
  const font = getProposalFont(proposal);
  const addOns = proposal.addOns;

  function fmtAoPrice(ao: typeof addOns[0]) {
    if (ao.priceLabel) return ao.priceLabel;
    if (ao.price != null) return `RM${Math.round(ao.price / 100)}`;
    return null;
  }

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { backgroundColor: bg, position: "relative" } },
    CurlTopLeftSvg(),
    CurlTopRightSvg(),
    // Centered content wrapper
    React.createElement(
      View,
      {
        style: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 40,
        },
      },
      // ADD ONS title
      React.createElement(
        Text,
        {
          style: {
            color: GOLD,
            fontSize: 24,
            fontWeight: "bold",
            letterSpacing: 8,
            marginBottom: 22,
            fontFamily: font.heading,
          },
        },
        "ADD ONS"
      ),
      // Grid
      React.createElement(
        View,
        {
          style: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 18,
            width: "100%",
          },
        },
        ...addOns.map((ao, i) => {
          const price = fmtAoPrice(ao);
          return React.createElement(
            View,
            { key: i, style: { alignItems: "center", width: 110 } },
            ao.imageUrl
              ? React.createElement(Image, {
                  src: ao.imageUrl,
                  style: { width: 65, height: 65, objectFit: "contain" },
                })
              : React.createElement(View, {
                  style: {
                    width: 65,
                    height: 65,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: 4,
                  },
                }),
            React.createElement(
              Text,
              {
                style: {
                  color: "white",
                  fontWeight: "bold",
                  fontSize: 9,
                  marginTop: 6,
                  textAlign: "center",
                },
              },
              ao.addOnName
            ),
            price
              ? React.createElement(
                  Text,
                  { style: { color: GOLD, fontSize: 9, textAlign: "center" } },
                  price
                )
              : null,
          );
        }),
      ),
    ),
    // Logo bottom-right
    React.createElement(
      View,
      { style: { position: "absolute", bottom: 18, right: 24 } },
      logoEl(proposal.senderLogoUrl, proposal.senderName, true),
    ),
  );
}

// ── Compact Package Page (multiple packages per page) ─────────────────────────

function CompactPackagePage({
  items,
  pageIndex,
  proposal,
}: {
  items: ProposalWithItems["items"];
  pageIndex: number;
  proposal: ProposalWithItems;
}) {
  const bg = getBg(proposal);
  const font = getProposalFont(proposal);

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { backgroundColor: bg, position: "relative", padding: 24 } },
    CurlTopLeftSvg(),
    CurlTopRightSvg(),
    React.createElement(
      Text,
      {
        style: {
          color: GOLD,
          fontSize: 9,
          fontWeight: "bold",
          letterSpacing: 4,
          textAlign: "center",
          marginBottom: 10,
          fontFamily: font.heading,
        },
      },
      pageIndex > 0 ? "PACKAGES (CONT.)" : "PACKAGES"
    ),
    // 2-col grid (up to 3 rows for max 6 packages)
    React.createElement(
      View,
      { style: { flex: 1, flexDirection: "column", gap: 10 } },
      ...Array.from({ length: Math.min(3, Math.ceil(items.length / 2)) }, (_, row) =>
        React.createElement(
          View,
          { key: row, style: { flex: 1, flexDirection: "row", gap: 10 } },
          ...[0, 1].map((col) => {
            const item = items[row * 2 + col];
            if (!item) return React.createElement(View, { key: col, style: { flex: 1 } });
            let features: string[] = [];
            try { features = JSON.parse(item.features) as string[]; } catch { features = []; }
            const savings = item.originalPrice != null
              ? Math.round((item.originalPrice - item.price) / 100)
              : null;
            const PHOTO_W = 148;
            return React.createElement(
              View,
              {
                key: col,
                style: {
                  flex: 1,
                  flexDirection: "row",
                  backgroundColor: "rgba(0,0,0,0.25)",
                  borderRadius: 8,
                  position: "relative",
                },
              },
              // Photo (clipped separately so badge can overflow card boundary)
              React.createElement(
                View,
                { style: { width: PHOTO_W, borderRadius: 8, overflow: "hidden" } },
                item.imageUrl
                  ? React.createElement(Image, {
                      src: item.imageUrl,
                      style: { width: PHOTO_W, height: "100%", objectFit: "cover" },
                    })
                  : React.createElement(View, {
                      style: { width: PHOTO_W, height: "100%", backgroundColor: "rgba(255,255,255,0.1)" },
                    })
              ),
              // Info
              React.createElement(
                View,
                { style: { flex: 1, padding: 10, justifyContent: "center" } },
                // Package name
                React.createElement(
                  Text,
                  { style: { color: "white", fontSize: 9, fontWeight: "bold", lineHeight: 1.2, marginBottom: 4 } },
                  item.packageName
                ),
                // START FROM
                React.createElement(
                  Text,
                  { style: { color: "rgba(255,255,255,0.5)", fontSize: 6, letterSpacing: 1, fontWeight: "bold" } },
                  "START FROM"
                ),
                // Strikethrough + SAVE badge row
                item.originalPrice != null
                  ? React.createElement(
                      View,
                      { style: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2, marginBottom: 1 } },
                      React.createElement(
                        Text,
                        { style: { color: "rgba(255,255,255,0.45)", fontSize: 9, textDecoration: "line-through" } },
                        fmtRm(item.originalPrice)
                      ),
                      savings != null
                        ? React.createElement(
                            View,
                            {
                              style: {
                                backgroundColor: "rgba(255,255,255,0.92)",
                                borderRadius: 4,
                                paddingTop: 1,
                                paddingBottom: 1,
                                paddingLeft: 4,
                                paddingRight: 4,
                              },
                            },
                            React.createElement(
                              Text,
                              { style: { color: GOLD, fontSize: 6, fontWeight: "bold" } },
                              `SAVE RM${savings}`
                            )
                          )
                        : null,
                    )
                  : null,
                // Current price
                React.createElement(
                  Text,
                  { style: { color: GOLD, fontSize: 22, fontWeight: "bold", lineHeight: 1, fontFamily: getProposalFont(proposal).heading, marginBottom: 5 } },
                  fmtRm(item.price)
                ),
                // Features
                React.createElement(
                  View,
                  { style: { gap: 2 } },
                  ...features.slice(0, 4).map((f, fi) =>
                    React.createElement(
                      View,
                      { key: fi, style: { flexDirection: "row", gap: 4, alignItems: "flex-start" } },
                      React.createElement(Text, { style: { color: GOLD, fontSize: 7.5, lineHeight: 1.3 } }, "•"),
                      React.createElement(Text, { style: { color: "rgba(255,255,255,0.85)", fontSize: 7, lineHeight: 1.3, flex: 1 } }, f),
                    )
                  )
                ),
              ),
              // Best seller circle badge straddling photo/info boundary
              item.isBestSeller
                ? React.createElement(
                    View,
                    {
                      style: {
                        position: "absolute",
                        top: 8,
                        left: PHOTO_W - 22,
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: GOLD,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    },
                    React.createElement(Text, { style: { color: "white", fontSize: 5.5, fontWeight: "bold", textAlign: "center" } }, "BEST"),
                    React.createElement(Text, { style: { color: "white", fontSize: 5.5, fontWeight: "bold", textAlign: "center" } }, "SELLER"),
                  )
                : null,
            );
          })
        )
      )
    ),
    // Logo
    React.createElement(
      View,
      { style: { position: "absolute", bottom: 14, right: 20 } },
      logoEl(proposal.senderLogoUrl, proposal.senderName, true)
    )
  );
}

// ── Terms Page ────────────────────────────────────────────────────────────────

function TermsPage({ proposal }: { proposal: ProposalWithItems }) {
  const bg = getBg(proposal);
  const terms = proposal.termsText || "";
  const font = getProposalFont(proposal);

  const termsNodes = htmlToReactPdfNodes(terms, font.body);

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { backgroundColor: bg, position: "relative" } },
    CurlTopLeftSvg(),
    CurlTopRightSvg(),
    // Header: centered logo (same size as cover)
    React.createElement(
      View,
      {
        style: {
          alignItems: "center",
          paddingTop: 22,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.25)",
          marginHorizontal: 36,
        },
      },
      logoEl(proposal.senderLogoUrl, proposal.senderName, false, true),
    ),
    // Terms content (rich text nodes)
    React.createElement(
      View,
      { style: { flex: 1, paddingHorizontal: 36, paddingTop: 12 } },
      ...(termsNodes.length > 0
        ? termsNodes
        : [React.createElement(Text, {
            key: 0,
            style: { color: "rgba(255,255,255,0.4)", fontSize: 9, fontStyle: "italic" },
          }, "No terms provided.")])
    ),
    // Enquiry footer
    React.createElement(
      View,
      {
        style: {
          paddingHorizontal: 36,
          paddingTop: 10,
          paddingBottom: 16,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.2)",
        },
      },
      React.createElement(
        Text,
        { style: { color: "rgba(255,255,255,0.6)", fontSize: 7, letterSpacing: 2, fontWeight: "bold", marginBottom: 4 } },
        "FOR ENQUIRY:"
      ),
      React.createElement(Text, { style: { color: "white", fontSize: 9 } }, proposal.senderName),
      proposal.senderPhone
        ? React.createElement(Text, { style: { color: "white", fontSize: 9 } }, `T: ${proposal.senderPhone}`)
        : null,
      proposal.senderEmail
        ? React.createElement(Text, { style: { color: "white", fontSize: 9 } }, `E: ${proposal.senderEmail}`)
        : null,
    ),
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateProposalPDF(proposal: ProposalWithItems): Promise<Buffer> {
  const p = proposal as unknown as { addOnsEnabled?: boolean; compact?: boolean };
  const showAddOns = proposal.addOns.length > 0 && (p.addOnsEnabled ?? false);
  const compact = p.compact ?? false;

  // Compact: chunk items into pages of 6
  const packagePages = compact
    ? Array.from({ length: Math.ceil(proposal.items.length / 6) }, (_, pi) =>
        React.createElement(CompactPackagePage, {
          key: `compact-${pi}`,
          items: proposal.items.slice(pi * 6, pi * 6 + 6),
          pageIndex: pi,
          proposal,
        })
      )
    : proposal.items.map((item, i) =>
        React.createElement(PackagePage, { key: item.id, item, index: i, proposal })
      );

  const doc = React.createElement(
    Document,
    {},
    React.createElement(CoverPage, { proposal }),
    ...packagePages,
    ...(showAddOns ? [React.createElement(AddOnsPage, { proposal })] : []),
    React.createElement(TermsPage, { proposal }),
  );

  const buffer = await renderToBuffer(doc as unknown as React.ReactElement<DocumentProps>);
  return Buffer.from(buffer);
}
