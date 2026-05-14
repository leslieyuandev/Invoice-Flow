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

Font.registerHyphenationCallback((word) => [word]);

// Register Tenor Sans for headings (Google Fonts CDN)
try {
  Font.register({
    family: "Tenor Sans",
    src: "https://fonts.gstatic.com/s/tenorsans/v19/bx6ANxqUneKx06UkIXISr3JyC22IyqI.woff2",
  });
  Font.register({
    family: "Clear Sans",
    fonts: [
      { src: "https://fonts.gstatic.com/s/clearsans/v2/q2sTCqbg-6-m1Hm2Y3LMRQ.ttf", fontWeight: "normal" },
      { src: "https://fonts.gstatic.com/s/clearsans/v2/q2sUCqbg-6-m1Hm2Y3LMRQ.ttf", fontWeight: "bold" },
    ],
  });
} catch {
  // Font registration failure is non-fatal; PDF falls back to Helvetica
}

const HEADING_FONT = "Tenor Sans";
const BODY_FONT = "Clear Sans";

const PAGE_SIZE: [number, number] = [841.89, 595.28];
const GOLD = "#D4A843";
const DEFAULT_BG = "#C8151B";

function fmtRm(cents: number) {
  return `RM${Math.round(cents / 100)}`;
}

function getBg(proposal: ProposalWithItems) {
  return (proposal as unknown as { bgColor?: string }).bgColor || DEFAULT_BG;
}
function getCoverTitle(proposal: ProposalWithItems) {
  return (proposal as unknown as { coverTitle?: string }).coverTitle || proposal.eventTitle || "Balloon Packages";
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

// ── Logo box ──────────────────────────────────────────────────────────────────

function logoEl(logoUrl: string | null | undefined, name: string, small = false) {
  if (logoUrl) {
    return React.createElement(Image, {
      src: logoUrl,
      style: { height: small ? 20 : 28, objectFit: "contain" },
    });
  }
  return React.createElement(
    Text,
    { style: { color: "white", fontWeight: "bold", fontSize: small ? 8 : 11 } },
    name || "HALO BALLOON"
  );
}

// ── Cover Page ────────────────────────────────────────────────────────────────

function CoverPage({ proposal }: { proposal: ProposalWithItems }) {
  const bg = getBg(proposal);
  const title = getCoverTitle(proposal);

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { flexDirection: "row" } },
    // Left colored panel 58%
    React.createElement(
      View,
      {
        style: {
          width: "58%",
          height: "100%",
          backgroundColor: bg,
          position: "relative",
          overflow: "hidden",
        },
      },
      CurlTopLeftSvg(),
      // Logo top-left
      React.createElement(
        View,
        { style: { position: "absolute", top: 30, left: 30 } },
        logoEl(proposal.senderLogoUrl, proposal.senderName),
        React.createElement(
          Text,
          { style: { color: "rgba(255,255,255,0.75)", fontSize: 7, marginTop: 4 } },
          "Your Vision. Our Craft."
        ),
      ),
      // Title bottom-left
      React.createElement(
        View,
        { style: { position: "absolute", bottom: 34, left: 30, right: 20 } },
        React.createElement(
          Text,
          {
            style: {
              color: "white",
              fontSize: 34,
              fontWeight: "bold",
              lineHeight: 1.2,
            },
          },
          title
        ),
      ),
    ),
    // Right photo 42%
    React.createElement(
      View,
      {
        style: {
          flex: 1,
          height: "100%",
          backgroundColor: "#888",
          overflow: "hidden",
        },
      },
      proposal.coverImageUrl
        ? React.createElement(Image, {
            src: proposal.coverImageUrl,
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              objectFit: "cover",
            },
          })
        : React.createElement(View, {
            style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bg, opacity: 0.3 },
          }),
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
  let features: string[] = [];
  try { features = JSON.parse(item.features) as string[]; } catch { features = []; }

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { flexDirection: "row" } },
    // Left photo 40%
    React.createElement(
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
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              objectFit: "cover",
            },
          })
        : React.createElement(View, {
            style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bg, opacity: 0.35 },
          }),
    ),
    // Right info panel 60%
    React.createElement(
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
      CurlPkgRightSvg(),
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
            fontFamily: BODY_FONT,
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
          { style: { color: GOLD, fontSize: 44, fontWeight: "bold", lineHeight: 1, fontFamily: HEADING_FONT } },
          fmtRm(item.price)
        ),
        item.originalPrice != null
          ? React.createElement(
              Text,
              {
                style: {
                  color: GOLD,
                  fontSize: 18,
                  marginLeft: 12,
                  textDecoration: "line-through",
                  opacity: 0.8,
                  marginBottom: 4,
                },
              },
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
            React.createElement(
              Text,
              { style: { color: GOLD, fontSize: 11, lineHeight: 1.2 } },
              "•"
            ),
            React.createElement(
              Text,
              { style: { color: "rgba(255,255,255,0.9)", fontSize: 9, lineHeight: 1.4, flex: 1 } },
              f
            ),
          )
        ),
      ),
      // Logo bottom-right
      React.createElement(
        View,
        { style: { position: "absolute", bottom: 20, right: 26 } },
        logoEl(proposal.senderLogoUrl, proposal.senderName, true),
        React.createElement(
          Text,
          { style: { color: "rgba(255,255,255,0.6)", fontSize: 6, marginTop: 2 } },
          "Your Vision. Our Craft."
        ),
      ),
    ),
  );
}

// ── Add-Ons Page ──────────────────────────────────────────────────────────────

function AddOnsPage({ proposal }: { proposal: ProposalWithItems }) {
  const bg = getBg(proposal);
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
            fontFamily: HEADING_FONT,
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
      React.createElement(
        Text,
        { style: { color: "rgba(255,255,255,0.6)", fontSize: 6, marginTop: 2 } },
        "Your Vision. Our Craft."
      ),
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
          fontFamily: HEADING_FONT,
        },
      },
      pageIndex > 0 ? "PACKAGES (CONT.)" : "PACKAGES"
    ),
    // 2-row × 3-col grid
    React.createElement(
      View,
      { style: { flex: 1, flexDirection: "column", gap: 8 } },
      ...[0, 1].map((row) =>
        React.createElement(
          View,
          { key: row, style: { flex: 1, flexDirection: "row", gap: 8 } },
          ...[0, 1, 2].map((col) => {
            const item = items[row * 3 + col];
            if (!item) return React.createElement(View, { key: col, style: { flex: 1 } });
            let features: string[] = [];
            try { features = JSON.parse(item.features) as string[]; } catch { features = []; }
            return React.createElement(
              View,
              {
                key: col,
                style: {
                  flex: 1,
                  flexDirection: "row",
                  backgroundColor: "rgba(0,0,0,0.18)",
                  borderRadius: 4,
                  overflow: "hidden",
                },
              },
              // Thumbnail
              React.createElement(
                View,
                { style: { width: 60, backgroundColor: "#555" } },
                item.imageUrl
                  ? React.createElement(Image, {
                      src: item.imageUrl,
                      style: { width: 60, height: "100%", objectFit: "cover" },
                    })
                  : React.createElement(View, {
                      style: { width: 60, height: "100%", backgroundColor: "rgba(255,255,255,0.1)" },
                    })
              ),
              // Info
              React.createElement(
                View,
                { style: { flex: 1, padding: 8, justifyContent: "center" } },
                React.createElement(
                  Text,
                  { style: { color: GOLD, fontSize: 14, fontWeight: "bold", lineHeight: 1, fontFamily: HEADING_FONT } },
                  fmtRm(item.price)
                ),
                React.createElement(
                  Text,
                  { style: { color: "white", fontSize: 8, fontWeight: "bold", marginTop: 2, marginBottom: 2, lineHeight: 1.2 } },
                  item.packageName
                ),
                ...features.slice(0, 2).map((f, fi) =>
                  React.createElement(
                    Text,
                    { key: fi, style: { color: "rgba(255,255,255,0.75)", fontSize: 7, lineHeight: 1.3 } },
                    `• ${f}`
                  )
                )
              )
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

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { backgroundColor: bg, position: "relative" } },
    CurlTopLeftSvg(),
    CurlTopRightSvg(),
    // Header: centered logo
    React.createElement(
      View,
      {
        style: {
          alignItems: "center",
          paddingTop: 26,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.25)",
          marginHorizontal: 36,
        },
      },
      logoEl(proposal.senderLogoUrl, proposal.senderName),
      React.createElement(View, {
        style: {
          width: 160,
          height: 1,
          backgroundColor: "rgba(255,255,255,0.3)",
          marginVertical: 6,
        },
      }),
      React.createElement(
        Text,
        { style: { color: "rgba(255,255,255,0.7)", fontSize: 7 } },
        "Your Vision. Our Craft."
      ),
    ),
    // Terms content
    React.createElement(
      View,
      { style: { flex: 1, paddingHorizontal: 36, paddingTop: 14 } },
      React.createElement(
        Text,
        { style: { color: "rgba(255,255,255,0.9)", fontSize: 9, lineHeight: 1.6 } },
        terms
      ),
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
        {
          style: {
            color: "rgba(255,255,255,0.6)",
            fontSize: 7,
            letterSpacing: 2,
            fontWeight: "bold",
            marginBottom: 4,
          },
        },
        "FOR ENQUIRY:"
      ),
      React.createElement(
        Text,
        { style: { color: "white", fontSize: 9 } },
        proposal.senderName
      ),
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
