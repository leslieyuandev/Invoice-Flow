import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import React from "react";
import type { ProposalWithItems } from "@/types/proposal";

Font.registerHyphenationCallback((word) => [word]);

const PAGE_SIZE: [number, number] = [841.89, 595.28]; // A4 landscape

// ── Style helpers ─────────────────────────────────────────────────────────────

function getAccentColor(creativity: number): string {
  if (creativity < 30) return "#64748b";
  if (creativity < 65) return "#4f46e5";
  return "#7c3aed";
}

function getAccentLight(creativity: number): string {
  if (creativity < 30) return "#f1f5f9";
  if (creativity < 65) return "#eef2ff";
  return "#f5f3ff";
}

function getPad(elegance: number): number {
  return 28 + Math.round((elegance / 100) * 24); // 28–52 pt
}

function getLineH(elegance: number): number {
  return 1.25 + (elegance / 100) * 0.5; // 1.25–1.75
}

function fmtPrice(cents: number) {
  return `RM ${(cents / 100).toFixed(0)}`;
}

// ── Cover Page ─────────────────────────────────────────────────────────────────
// Left 55%: hero image (or gradient); right 45%: white panel with details

function CoverPage({
  proposal,
  creativity,
  elegance,
}: {
  proposal: ProposalWithItems;
  creativity: number;
  elegance: number;
}) {
  const accent = getAccentColor(creativity);
  const accentLight = getAccentLight(creativity);
  const pad = getPad(elegance);
  const lh = getLineH(elegance);

  const LEFT_W = 506; // ~60% of 842
  const RIGHT_W = PAGE_SIZE[0] - LEFT_W;

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { flexDirection: "row" } },

    // ── LEFT: hero image panel ────────────────────────────────────────────────
    React.createElement(
      View,
      { style: { width: LEFT_W, height: PAGE_SIZE[1], position: "relative", backgroundColor: accent } },
      // Cover image
      proposal.coverImageUrl
        ? React.createElement(Image, {
            src: proposal.coverImageUrl,
            style: { position: "absolute", top: 0, left: 0, width: LEFT_W, height: PAGE_SIZE[1], objectFit: "cover" },
          })
        : null,
      // Dark overlay for text legibility
      React.createElement(View, {
        style: {
          position: "absolute", top: 0, left: 0, width: LEFT_W, height: PAGE_SIZE[1],
          backgroundColor: "rgba(0,0,0,0.35)",
        },
      }),
      // Diagonal accent strip at right edge
      React.createElement(View, {
        style: {
          position: "absolute", top: 0, right: 0, width: 8, height: PAGE_SIZE[1],
          backgroundColor: accent,
        },
      }),
      // Logo — top-left
      React.createElement(
        View,
        { style: { position: "absolute", top: pad, left: pad } },
        proposal.senderLogoUrl
          ? React.createElement(Image, {
              src: proposal.senderLogoUrl,
              style: { width: 130, height: 65, objectFit: "contain" },
            })
          : React.createElement(
              View,
              {
                style: {
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                },
              },
              React.createElement(Text, {
                style: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 1 },
              }, proposal.senderName || "HALO BALLOON")
            )
      ),
      // Bottom-left: event title + lead name
      React.createElement(
        View,
        { style: { position: "absolute", bottom: pad + 8, left: pad, right: pad } },
        // Accent line above title
        React.createElement(View, { style: { width: 40, height: 3, backgroundColor: accent, marginBottom: 12 } }),
        React.createElement(Text, {
          style: {
            fontSize: 34, fontFamily: "Helvetica-Bold", color: "#ffffff",
            lineHeight: lh, marginBottom: 10,
          },
        }, proposal.eventTitle || "Event Proposal"),
        React.createElement(Text, {
          style: { fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: lh },
        }, `Prepared for ${proposal.leadName}`),
      )
    ),

    // ── RIGHT: white info panel ───────────────────────────────────────────────
    React.createElement(
      View,
      {
        style: {
          width: RIGHT_W, height: PAGE_SIZE[1],
          backgroundColor: "#ffffff",
          paddingHorizontal: pad,
          paddingVertical: pad,
          justifyContent: "space-between",
        },
      },
      // Top section — "Proposal" label
      React.createElement(
        View,
        null,
        React.createElement(Text, {
          style: {
            fontSize: 9, fontFamily: "Helvetica-Bold", color: accent,
            letterSpacing: 3, marginBottom: 14,
          },
        }, "PROPOSAL"),
        React.createElement(View, { style: { width: 30, height: 2, backgroundColor: accent, marginBottom: 20 } }),
        React.createElement(Text, {
          style: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#0f172a", lineHeight: lh, marginBottom: 6 },
        }, proposal.eventTitle || "Event Proposal"),
        React.createElement(Text, {
          style: { fontSize: 10, color: "#64748b", lineHeight: lh },
        }, `Prepared for: ${proposal.leadName}`),
        proposal.leadPhone
          ? React.createElement(Text, {
              style: { fontSize: 10, color: "#64748b", marginTop: 4 },
            }, `📞 ${proposal.leadPhone}`)
          : null,
      ),
      // Middle — package count summary
      React.createElement(
        View,
        {
          style: {
            backgroundColor: accentLight,
            borderRadius: 8,
            padding: 14,
          },
        },
        React.createElement(Text, {
          style: { fontSize: 9, fontFamily: "Helvetica-Bold", color: accent, letterSpacing: 1.5, marginBottom: 8 },
        }, "PACKAGES INCLUDED"),
        ...proposal.items.slice(0, 6).map((item, i) =>
          React.createElement(
            View,
            { key: i, style: { flexDirection: "row", alignItems: "center", marginBottom: 5 } },
            React.createElement(View, {
              style: {
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: accent,
                marginRight: 8,
                justifyContent: "center", alignItems: "center",
              },
            }, React.createElement(Text, { style: { fontSize: 7, color: "#ffffff", fontFamily: "Helvetica-Bold" } }, `${i + 1}`)),
            React.createElement(Text, {
              style: { fontSize: 9, color: "#374151", flex: 1, lineHeight: 1.3 },
            }, item.packageName),
            React.createElement(Text, {
              style: { fontSize: 9, fontFamily: "Helvetica-Bold", color: accent },
            }, fmtPrice(item.price))
          )
        ),
        proposal.items.length > 6
          ? React.createElement(Text, {
              style: { fontSize: 8, color: "#94a3b8", marginTop: 4 },
            }, `+ ${proposal.items.length - 6} more packages…`)
          : null
      ),
      // Bottom — sender contact
      React.createElement(
        View,
        null,
        React.createElement(View, { style: { width: "100%", height: 1, backgroundColor: "#e2e8f0", marginBottom: 12 } }),
        proposal.senderLogoUrl
          ? React.createElement(Image, {
              src: proposal.senderLogoUrl,
              style: { width: 80, height: 40, objectFit: "contain", marginBottom: 6 },
            })
          : React.createElement(Text, {
              style: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 4 },
            }, proposal.senderName),
        proposal.senderEmail
          ? React.createElement(Text, { style: { fontSize: 8, color: "#64748b" } }, proposal.senderEmail)
          : null,
        proposal.senderPhone
          ? React.createElement(Text, { style: { fontSize: 8, color: "#64748b", marginTop: 2 } }, proposal.senderPhone)
          : null,
      )
    )
  );
}

// ── Single-package page (1 pkg per spread) ─────────────────────────────────
// Left: full-height photo; Right: package details

function SinglePackagePage({
  item,
  index,
  total,
  proposal,
  creativity,
  elegance,
}: {
  item: ProposalWithItems["items"][number];
  index: number;
  total: number;
  proposal: ProposalWithItems;
  creativity: number;
  elegance: number;
}) {
  const accent = getAccentColor(creativity);
  const accentLight = getAccentLight(creativity);
  const pad = getPad(elegance);
  const lh = getLineH(elegance);
  let features: string[] = [];
  try { features = JSON.parse(item.features) as string[]; } catch { features = []; }

  const PHOTO_W = Math.round(PAGE_SIZE[0] * 0.52);
  const INFO_W = PAGE_SIZE[0] - PHOTO_W;

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { flexDirection: "row" } },

    // ── LEFT: photo ───────────────────────────────────────────────────────────
    React.createElement(
      View,
      { style: { width: PHOTO_W, height: PAGE_SIZE[1], position: "relative", backgroundColor: `${accent}22` } },
      item.imageUrl
        ? React.createElement(Image, {
            src: item.imageUrl,
            style: { width: PHOTO_W, height: PAGE_SIZE[1], objectFit: "cover" },
          })
        : React.createElement(
            View,
            {
              style: {
                width: PHOTO_W, height: PAGE_SIZE[1],
                backgroundColor: accentLight,
                justifyContent: "center", alignItems: "center",
              },
            },
            React.createElement(Text, { style: { fontSize: 60, color: `${accent}40` } }, "✦")
          ),
      // Package index badge — bottom left
      React.createElement(
        View,
        {
          style: {
            position: "absolute", bottom: pad, left: pad,
            backgroundColor: accent,
            borderRadius: 4,
            paddingHorizontal: 10, paddingVertical: 4,
          },
        },
        React.createElement(Text, {
          style: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 2 },
        }, `${index + 1} / ${total}`)
      )
    ),

    // ── RIGHT: info panel ─────────────────────────────────────────────────────
    React.createElement(
      View,
      {
        style: {
          width: INFO_W, height: PAGE_SIZE[1],
          backgroundColor: "#ffffff",
          paddingHorizontal: pad,
          paddingTop: pad,
          paddingBottom: pad * 0.6,
          justifyContent: "space-between",
        },
      },
      // Top section
      React.createElement(
        View,
        null,
        // Header row: logo + "PACKAGE X"
        React.createElement(
          View,
          { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 } },
          proposal.senderLogoUrl
            ? React.createElement(Image, {
                src: proposal.senderLogoUrl,
                style: { width: 70, height: 35, objectFit: "contain" },
              })
            : React.createElement(Text, {
                style: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#94a3b8" },
              }, proposal.senderName),
          React.createElement(Text, {
            style: { fontSize: 8, fontFamily: "Helvetica-Bold", color: accent, letterSpacing: 2 },
          }, `PACKAGE ${index + 1}`)
        ),
        // Accent line
        React.createElement(View, { style: { width: "100%", height: 1, backgroundColor: "#f1f5f9", marginBottom: 16 } }),
        // Best seller badge
        item.isBestSeller
          ? React.createElement(
              View,
              {
                style: {
                  backgroundColor: "#fef3c7",
                  borderRadius: 4,
                  paddingHorizontal: 8, paddingVertical: 3,
                  alignSelf: "flex-start", marginBottom: 10,
                },
              },
              React.createElement(Text, {
                style: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#92400e" },
              }, "⭐  BEST SELLER")
            )
          : null,
        // Package name
        React.createElement(Text, {
          style: {
            fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0f172a",
            lineHeight: lh, marginBottom: 6,
          },
        }, item.packageName),
        // Tagline
        item.tagline
          ? React.createElement(Text, {
              style: { fontSize: 11, color: "#64748b", lineHeight: lh, marginBottom: 14, fontStyle: "italic" },
            }, item.tagline)
          : React.createElement(View, { style: { marginBottom: 14 } }),
        // Price row
        React.createElement(
          View,
          { style: { flexDirection: "row", alignItems: "baseline", marginBottom: 18 } },
          React.createElement(Text, {
            style: { fontSize: 30, fontFamily: "Helvetica-Bold", color: accent, marginRight: 10 },
          }, fmtPrice(item.price)),
          item.originalPrice
            ? React.createElement(Text, {
                style: { fontSize: 14, color: "#94a3b8", textDecoration: "line-through" },
              }, fmtPrice(item.originalPrice))
            : null
        ),
      ),
      // Features list
      React.createElement(
        View,
        { style: { flex: 1 } },
        ...features.map((feat, fi) =>
          React.createElement(
            View,
            { key: fi, style: { flexDirection: "row", marginBottom: 7, alignItems: "flex-start" } },
            React.createElement(View, {
              style: {
                width: 5, height: 5, borderRadius: 2.5,
                backgroundColor: accent,
                marginRight: 8, marginTop: 3, flexShrink: 0,
              },
            }),
            React.createElement(Text, {
              style: { fontSize: 10, color: "#475569", flex: 1, lineHeight: lh },
            }, feat)
          )
        )
      ),
      // Footer
      React.createElement(
        View,
        { style: { borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 8, marginTop: 8 } },
        React.createElement(Text, {
          style: { fontSize: 8, color: "#cbd5e1" },
        }, proposal.eventTitle)
      )
    )
  );
}

// ── Multi-package grid page ────────────────────────────────────────────────────
// Header strip + grid of package cards

function MultiPackagePage({
  items,
  pageIndex,
  proposal,
  creativity,
  elegance,
}: {
  items: ProposalWithItems["items"];
  pageIndex: number;
  proposal: ProposalWithItems;
  creativity: number;
  elegance: number;
}) {
  const accent = getAccentColor(creativity);
  const accentLight = getAccentLight(creativity);
  const pad = getPad(elegance);
  const lh = getLineH(elegance);
  const cols = items.length <= 3 ? items.length : Math.ceil(items.length / 2) <= 3 ? 3 : 3;
  const CARD_W = Math.floor((PAGE_SIZE[0] - pad * 2 - (cols - 1) * 10) / cols);

  function PackageCard({ item, idx }: { item: ProposalWithItems["items"][number]; idx: number }) {
    let features: string[] = [];
    try { features = JSON.parse(item.features) as string[]; } catch { features = []; }
    const showFeatures = Math.min(features.length, items.length <= 3 ? 4 : 3);

    return React.createElement(
      View,
      {
        style: {
          width: CARD_W,
          backgroundColor: "#ffffff",
          borderRadius: 8,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#e2e8f0",
        },
      },
      // Card photo
      item.imageUrl
        ? React.createElement(Image, {
            src: item.imageUrl,
            style: { width: CARD_W, height: items.length <= 2 ? 200 : 130, objectFit: "cover" },
          })
        : React.createElement(View, {
            style: {
              width: CARD_W,
              height: items.length <= 2 ? 200 : 130,
              backgroundColor: accentLight,
              justifyContent: "center", alignItems: "center",
            },
          }, React.createElement(Text, { style: { fontSize: 28, color: `${accent}50` } }, "✦")),
      // Card body
      React.createElement(
        View,
        { style: { padding: 10 } },
        item.isBestSeller
          ? React.createElement(
              View,
              {
                style: {
                  backgroundColor: "#fef3c7", borderRadius: 3,
                  paddingHorizontal: 5, paddingVertical: 2,
                  alignSelf: "flex-start", marginBottom: 4,
                },
              },
              React.createElement(Text, { style: { fontSize: 6, fontFamily: "Helvetica-Bold", color: "#92400e" } }, "⭐ BEST SELLER")
            )
          : null,
        React.createElement(Text, {
          style: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", lineHeight: 1.2, marginBottom: 3 },
        }, item.packageName),
        React.createElement(Text, {
          style: { fontSize: 14, fontFamily: "Helvetica-Bold", color: accent, marginBottom: 6 },
        }, fmtPrice(item.price)),
        ...features.slice(0, showFeatures).map((f, fi) =>
          React.createElement(
            View,
            { key: fi, style: { flexDirection: "row", marginBottom: 2.5 } },
            React.createElement(View, {
              style: { width: 4, height: 4, borderRadius: 2, backgroundColor: accent, marginRight: 5, marginTop: 2, flexShrink: 0 },
            }),
            React.createElement(Text, { style: { fontSize: 7.5, color: "#64748b", flex: 1, lineHeight: 1.35 } }, f)
          )
        ),
        features.length > showFeatures
          ? React.createElement(Text, {
              style: { fontSize: 7, color: "#94a3b8", marginTop: 2 },
            }, `+${features.length - showFeatures} more…`)
          : null,
        item.originalPrice
          ? React.createElement(Text, {
              style: { fontSize: 8, color: "#94a3b8", textDecoration: "line-through", marginTop: 3 },
            }, fmtPrice(item.originalPrice))
          : null
      )
    );
  }

  // Build rows
  const rows: ProposalWithItems["items"][] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { backgroundColor: "#f8fafc" } },
    // Header strip
    React.createElement(
      View,
      {
        style: {
          backgroundColor: accent, height: 50,
          flexDirection: "row", alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: pad,
        },
      },
      proposal.senderLogoUrl
        ? React.createElement(Image, {
            src: proposal.senderLogoUrl,
            style: { width: 80, height: 38, objectFit: "contain" },
          })
        : React.createElement(Text, {
            style: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },
          }, proposal.senderName),
      React.createElement(Text, {
        style: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.8)", letterSpacing: 2 },
      }, `PACKAGES — PAGE ${pageIndex + 1}`)
    ),
    // Cards grid
    React.createElement(
      View,
      { style: { flex: 1, paddingHorizontal: pad, paddingVertical: pad * 0.6 } },
      ...rows.map((row, ri) =>
        React.createElement(
          View,
          {
            key: ri,
            style: {
              flexDirection: "row",
              gap: 10,
              marginBottom: ri < rows.length - 1 ? 10 : 0,
              justifyContent: "flex-start",
            },
          },
          ...row.map((item, ci) =>
            React.createElement(PackageCard, { key: ci, item, idx: rows.flat().indexOf(item) })
          )
        )
      )
    ),
    // Footer
    React.createElement(
      View,
      {
        style: {
          height: 28, backgroundColor: "#ffffff",
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: pad, justifyContent: "space-between",
          borderTopWidth: 1, borderTopColor: "#e2e8f0",
        },
      },
      React.createElement(Text, { style: { fontSize: 7, color: "#94a3b8" } }, proposal.eventTitle),
      React.createElement(Text, { style: { fontSize: 7, color: "#94a3b8" } }, proposal.senderName)
    )
  );
}

// ── Add-ons Page ──────────────────────────────────────────────────────────────

function AddOnsPage({
  proposal,
  creativity,
  elegance,
}: {
  proposal: ProposalWithItems;
  creativity: number;
  elegance: number;
}) {
  const accent = getAccentColor(creativity);
  const accentLight = getAccentLight(creativity);
  const pad = getPad(elegance);
  const addOns = proposal.addOns;
  const COLS = 4;
  const CARD_W = Math.floor((PAGE_SIZE[0] - pad * 2 - (COLS - 1) * 10) / COLS);

  const rows: typeof addOns[] = [];
  for (let i = 0; i < addOns.length; i += COLS) rows.push(addOns.slice(i, i + COLS));

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { backgroundColor: "#f8fafc" } },
    // Header
    React.createElement(
      View,
      {
        style: {
          backgroundColor: accent, height: 50,
          flexDirection: "row", alignItems: "center",
          justifyContent: "space-between", paddingHorizontal: pad,
        },
      },
      proposal.senderLogoUrl
        ? React.createElement(Image, {
            src: proposal.senderLogoUrl,
            style: { width: 80, height: 38, objectFit: "contain" },
          })
        : React.createElement(Text, {
            style: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },
          }, proposal.senderName),
      React.createElement(Text, {
        style: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.8)", letterSpacing: 2 },
      }, "OPTIONAL ADD-ONS")
    ),
    // Grid
    React.createElement(
      View,
      { style: { flex: 1, paddingHorizontal: pad, paddingVertical: pad * 0.7 } },
      ...rows.map((row, ri) =>
        React.createElement(
          View,
          { key: ri, style: { flexDirection: "row", gap: 10, marginBottom: 10 } },
          ...row.map((ao, ci) =>
            React.createElement(
              View,
              {
                key: ci,
                style: {
                  width: CARD_W,
                  backgroundColor: "#ffffff",
                  borderRadius: 8,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                },
              },
              ao.imageUrl
                ? React.createElement(Image, {
                    src: ao.imageUrl,
                    style: { width: CARD_W, height: 110, objectFit: "cover" },
                  })
                : React.createElement(View, {
                    style: {
                      width: CARD_W, height: 110,
                      backgroundColor: accentLight,
                      justifyContent: "center", alignItems: "center",
                    },
                  }, React.createElement(Text, { style: { fontSize: 22, color: `${accent}50` } }, "✦")),
              // Card body
              React.createElement(
                View,
                { style: { padding: 8, borderTopWidth: 2, borderTopColor: accent } },
                React.createElement(Text, {
                  style: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 2, lineHeight: 1.3 },
                }, ao.addOnName),
                ao.priceLabel || ao.price
                  ? React.createElement(Text, {
                      style: { fontSize: 9, color: accent, fontFamily: "Helvetica-Bold" },
                    }, ao.priceLabel ?? fmtPrice(ao.price!))
                  : null,
                ao.quantity > 1
                  ? React.createElement(Text, {
                      style: { fontSize: 7, color: "#94a3b8", marginTop: 2 },
                    }, `Qty: ${ao.quantity}`)
                  : null
              )
            )
          )
        )
      )
    ),
    // Footer
    React.createElement(
      View,
      {
        style: {
          height: 28, backgroundColor: "#ffffff",
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: pad, justifyContent: "space-between",
          borderTopWidth: 1, borderTopColor: "#e2e8f0",
        },
      },
      React.createElement(Text, { style: { fontSize: 7, color: "#94a3b8" } }, proposal.eventTitle),
      React.createElement(Text, { style: { fontSize: 7, color: "#94a3b8" } }, proposal.senderName)
    )
  );
}

// ── Terms / Contact Page ───────────────────────────────────────────────────────

function TermsPage({
  proposal,
  creativity,
  elegance,
}: {
  proposal: ProposalWithItems;
  creativity: number;
  elegance: number;
}) {
  const accent = getAccentColor(creativity);
  const accentLight = getAccentLight(creativity);
  const pad = getPad(elegance);
  const lh = getLineH(elegance);
  const SIDEBAR_W = 220;

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { flexDirection: "row" } },

    // ── LEFT sidebar ──────────────────────────────────────────────────────────
    React.createElement(
      View,
      {
        style: {
          width: SIDEBAR_W, height: PAGE_SIZE[1],
          backgroundColor: accent,
          paddingHorizontal: pad * 0.9,
          paddingVertical: pad,
          justifyContent: "space-between",
        },
      },
      // Logo / name
      React.createElement(
        View,
        null,
        proposal.senderLogoUrl
          ? React.createElement(Image, {
              src: proposal.senderLogoUrl,
              style: { width: SIDEBAR_W - pad * 1.8, height: 70, objectFit: "contain", marginBottom: 24 },
            })
          : React.createElement(Text, {
              style: {
                fontSize: 14, fontFamily: "Helvetica-Bold", color: "#ffffff",
                marginBottom: 24, letterSpacing: 0.5,
              },
            }, proposal.senderName || "HALO BALLOON"),
        React.createElement(View, { style: { width: 30, height: 2, backgroundColor: "rgba(255,255,255,0.4)", marginBottom: 16 } }),
        React.createElement(Text, {
          style: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.6)", letterSpacing: 2, marginBottom: 12 },
        }, "CONTACT US"),
        proposal.senderEmail
          ? React.createElement(Text, { style: { fontSize: 9, color: "rgba(255,255,255,0.85)", marginBottom: 5, lineHeight: lh } }, `✉ ${proposal.senderEmail}`)
          : null,
        proposal.senderPhone
          ? React.createElement(Text, { style: { fontSize: 9, color: "rgba(255,255,255,0.85)", marginBottom: 5, lineHeight: lh } }, `📞 ${proposal.senderPhone}`)
          : null,
        proposal.leadEmail
          ? React.createElement(
              View,
              { style: { marginTop: 20 } },
              React.createElement(Text, {
                style: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.6)", letterSpacing: 2, marginBottom: 8 },
              }, "PREPARED FOR"),
              React.createElement(Text, { style: { fontSize: 9, color: "rgba(255,255,255,0.85)", lineHeight: lh } }, proposal.leadName),
              React.createElement(Text, { style: { fontSize: 9, color: "rgba(255,255,255,0.7)", lineHeight: lh, marginTop: 2 } }, proposal.leadEmail)
            )
          : null
      ),
      // Event title at bottom
      React.createElement(
        View,
        null,
        React.createElement(View, { style: { width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 10 } }),
        React.createElement(Text, {
          style: { fontSize: 8, color: "rgba(255,255,255,0.5)", lineHeight: lh },
        }, proposal.eventTitle)
      )
    ),

    // ── RIGHT: terms content ──────────────────────────────────────────────────
    React.createElement(
      View,
      {
        style: {
          flex: 1, height: PAGE_SIZE[1],
          backgroundColor: "#ffffff",
          paddingHorizontal: pad,
          paddingVertical: pad,
        },
      },
      React.createElement(Text, {
        style: {
          fontSize: 9, fontFamily: "Helvetica-Bold", color: accent,
          letterSpacing: 3, marginBottom: 14,
        },
      }, "TERMS & CONDITIONS"),
      React.createElement(View, { style: { width: 40, height: 2, backgroundColor: accent, marginBottom: 18 } }),
      proposal.termsText
        ? React.createElement(Text, {
            style: { fontSize: 10, color: "#475569", lineHeight: lh + 0.2 },
          }, proposal.termsText)
        : React.createElement(
            View,
            null,
            ...[
              "Payment of 50% deposit is required upon confirmation of booking.",
              "Remaining balance to be paid on the day of event.",
              "Cancellation within 7 days of event: deposit is non-refundable.",
              "Halo Balloon reserves the right to substitute items of equal or greater value.",
            ].map((line, i) =>
              React.createElement(
                View,
                { key: i, style: { flexDirection: "row", marginBottom: 8 } },
                React.createElement(View, {
                  style: { width: 4, height: 4, borderRadius: 2, backgroundColor: accent, marginRight: 8, marginTop: 3, flexShrink: 0 },
                }),
                React.createElement(Text, { style: { fontSize: 10, color: "#475569", flex: 1, lineHeight: lh } }, line)
              )
            )
          ),
      // Thank you note
      React.createElement(
        View,
        {
          style: {
            position: "absolute",
            bottom: pad,
            left: pad,
            right: pad,
            backgroundColor: accentLight,
            borderRadius: 8,
            padding: 14,
          },
        },
        React.createElement(Text, {
          style: {
            fontSize: 11, fontFamily: "Helvetica-Bold", color: accent,
            textAlign: "center", marginBottom: 4,
          },
        }, "Thank you for choosing us! 🎈"),
        React.createElement(Text, {
          style: { fontSize: 9, color: "#64748b", textAlign: "center", lineHeight: lh },
        }, "We look forward to making your event beautiful and memorable.")
      )
    )
  );
}

// ── Main entry ─────────────────────────────────────────────────────────────────

export async function generateProposalPDF(proposal: ProposalWithItems): Promise<Buffer> {
  const creativity = (proposal as { creativity?: number }).creativity ?? 50;
  const elegance = (proposal as { elegance?: number }).elegance ?? 50;
  const pagesCount = (proposal as { pagesCount?: number }).pagesCount ?? 1;
  const addOnsEnabled = (proposal as { addOnsEnabled?: boolean }).addOnsEnabled ?? false;

  const items = proposal.items;
  const pkgsPerPage = Math.ceil(items.length / pagesCount);

  // Build package pages
  const pkgPages: React.ReactElement[] = [];
  for (let p = 0; p < pagesCount; p++) {
    const slice = items.slice(p * pkgsPerPage, (p + 1) * pkgsPerPage);
    if (slice.length === 0) continue;
    if (pkgsPerPage === 1) {
      pkgPages.push(
        React.createElement(SinglePackagePage, {
          key: `pkg-${p}`,
          item: slice[0],
          index: p,
          total: pagesCount,
          proposal,
          creativity,
          elegance,
        })
      );
    } else {
      pkgPages.push(
        React.createElement(MultiPackagePage, {
          key: `pkg-${p}`,
          items: slice,
          pageIndex: p,
          proposal,
          creativity,
          elegance,
        })
      );
    }
  }

  const docEl = React.createElement(
    Document as React.ComponentType<DocumentProps>,
    { title: proposal.eventTitle, author: proposal.senderName },
    React.createElement(CoverPage, { proposal, creativity, elegance }),
    ...pkgPages,
    ...(addOnsEnabled && proposal.addOns.length > 0
      ? [React.createElement(AddOnsPage, { key: "addons", proposal, creativity, elegance })]
      : []),
    React.createElement(TermsPage, { proposal, creativity, elegance })
  );

  return renderToBuffer(docEl);
}
