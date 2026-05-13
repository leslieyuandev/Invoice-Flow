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

const PAGE_SIZE: [number, number] = [841.89, 595.28];

// ── Style helpers derived from creativity / elegance ──────────────────────────

function getAccentColor(creativity: number): string {
  if (creativity < 30) return "#64748b";
  if (creativity < 65) return "#4f46e5";
  return "#7c3aed";
}

function getSecondaryColor(creativity: number): string {
  if (creativity < 30) return "#94a3b8";
  if (creativity < 65) return "#818cf8";
  return "#c084fc";
}

function getPad(elegance: number): number {
  return 32 + Math.round((elegance / 100) * 28); // 32–60 pt
}

function getLineHeight(elegance: number): number {
  return 1.3 + (elegance / 100) * 0.5;
}

function fmtPrice(cents: number) {
  return `RM ${(cents / 100).toFixed(2)}`;
}

// ── Cover Page ─────────────────────────────────────────────────────────────────

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
  const secondary = getSecondaryColor(creativity);
  const pad = getPad(elegance);

  const coverBg = proposal.coverImageUrl
    ? { src: proposal.coverImageUrl }
    : null;

  return React.createElement(
    Page,
    { size: PAGE_SIZE },
    // Background color layer
    React.createElement(View, {
      style: {
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: `${accent}`,
        backgroundColor: accent,
      },
    }),
    // Background image (if provided)
    coverBg
      ? React.createElement(Image, {
          src: coverBg.src,
          style: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 },
        })
      : null,
    // Decorative circles (creativity-driven)
    creativity > 40
      ? React.createElement(View, {
          style: {
            position: "absolute", top: -80, right: -80,
            width: 300, height: 300, borderRadius: 150,
            backgroundColor: "rgba(255,255,255,0.08)",
          },
        })
      : null,
    creativity > 40
      ? React.createElement(View, {
          style: {
            position: "absolute", bottom: -50, left: -50,
            width: 200, height: 200, borderRadius: 100,
            backgroundColor: "rgba(255,255,255,0.06)",
          },
        })
      : null,
    // Sender name — top-left
    React.createElement(
      View,
      { style: { position: "absolute", top: pad, left: pad } },
      proposal.senderLogoUrl
        ? React.createElement(Image, { style: { width: 140, height: 70, objectFit: "contain" }, src: proposal.senderLogoUrl })
        : React.createElement(Text, { style: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.85)", letterSpacing: 1 } }, proposal.senderName)
    ),
    // Center content
    React.createElement(
      View,
      { style: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: pad * 2 } },
      creativity > 55
        ? React.createElement(View, { style: { width: 48, height: 2, backgroundColor: "rgba(255,255,255,0.6)", marginBottom: 20 } })
        : null,
      React.createElement(Text, {
        style: {
          fontSize: 42, fontFamily: "Helvetica-Bold", color: "#ffffff",
          textAlign: "center", lineHeight: getLineHeight(elegance),
          marginBottom: 16,
        },
      }, proposal.eventTitle),
      React.createElement(Text, {
        style: { fontSize: 16, color: "rgba(255,255,255,0.8)", textAlign: "center" },
      }, `Prepared for ${proposal.leadName}`),
      creativity > 55
        ? React.createElement(View, { style: { width: 48, height: 2, backgroundColor: "rgba(255,255,255,0.6)", marginTop: 20 } })
        : null
    ),
    // Bottom accent bar
    elegance > 40
      ? React.createElement(View, {
          style: { position: "absolute", bottom: 0, left: 0, right: 0, height: 4, backgroundColor: "rgba(255,255,255,0.25)" },
        })
      : null
  );
}

// ── Single-package full-page layout ───────────────────────────────────────────

function SinglePackagePage({
  item,
  index,
  creativity,
  elegance,
}: {
  item: ProposalWithItems["items"][number];
  index: number;
  creativity: number;
  elegance: number;
}) {
  const accent = getAccentColor(creativity);
  const pad = getPad(elegance);
  let features: string[] = [];
  try { features = JSON.parse(item.features) as string[]; } catch { features = []; }

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { flexDirection: "row" } },
    // Left: photo
    item.imageUrl
      ? React.createElement(Image, { style: { width: 380, height: PAGE_SIZE[1], objectFit: "cover" }, src: item.imageUrl })
      : React.createElement(View, {
          style: {
            width: 380, height: PAGE_SIZE[1], backgroundColor: `${accent}15`,
            justifyContent: "center", alignItems: "center",
          },
        }, React.createElement(Text, { style: { fontSize: 40, color: accent, opacity: 0.3 } }, "✦")),
    // Right: info
    React.createElement(
      View,
      { style: { flex: 1, padding: pad, justifyContent: "center" } },
      React.createElement(Text, {
        style: { fontSize: 10, fontFamily: "Helvetica-Bold", color: accent, letterSpacing: 2, marginBottom: 8 },
      }, `PACKAGE ${index + 1}`),
      React.createElement(View, { style: { width: 40, height: 2, backgroundColor: accent, marginBottom: 16 } }),
      React.createElement(Text, {
        style: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#0f172a", lineHeight: getLineHeight(elegance), marginBottom: 8 },
      }, item.packageName),
      item.tagline
        ? React.createElement(Text, { style: { fontSize: 12, color: "#475569", marginBottom: 16, lineHeight: getLineHeight(elegance) } }, item.tagline)
        : null,
      item.isBestSeller
        ? React.createElement(
            View,
            { style: { backgroundColor: "#fef9c3", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 14 } },
            React.createElement(Text, { style: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#854d0e" } }, "⭐ BEST SELLER")
          )
        : null,
      React.createElement(
        View,
        { style: { flexDirection: "row", alignItems: "baseline", marginBottom: 18 } },
        React.createElement(Text, { style: { fontSize: 28, fontFamily: "Helvetica-Bold", color: accent, marginRight: 10 } }, fmtPrice(item.price)),
        item.originalPrice
          ? React.createElement(Text, { style: { fontSize: 14, color: "#94a3b8", textDecoration: "line-through" } }, fmtPrice(item.originalPrice))
          : null
      ),
      ...features.map((feat, fi) =>
        React.createElement(
          View,
          { key: `f${fi}`, style: { flexDirection: "row", marginBottom: 7, alignItems: "flex-start" } },
          React.createElement(Text, { style: { fontSize: 10, color: accent, marginRight: 8, marginTop: 1 } }, "●"),
          React.createElement(Text, { style: { fontSize: 11, color: "#475569", flex: 1, lineHeight: getLineHeight(elegance) } }, feat)
        )
      )
    )
  );
}

// ── Multi-package grid page ────────────────────────────────────────────────────

function MultiPackagePage({
  items,
  pageIndex,
  totalPages,
  creativity,
  elegance,
}: {
  items: ProposalWithItems["items"];
  pageIndex: number;
  totalPages: number;
  creativity: number;
  elegance: number;
}) {
  const accent = getAccentColor(creativity);
  const pad = getPad(elegance);
  const cols = items.length <= 2 ? 1 : 2;

  function PackageCard({ item, idx }: { item: ProposalWithItems["items"][number]; idx: number }) {
    let features: string[] = [];
    try { features = JSON.parse(item.features) as string[]; } catch { features = []; }
    const isCompact = items.length > 2;

    return React.createElement(
      View,
      { style: { flex: 1, flexDirection: "row", backgroundColor: "#ffffff", borderRadius: 6, overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f0" } },
      // Photo
      item.imageUrl
        ? React.createElement(Image, {
            style: { width: isCompact ? 100 : 160, objectFit: "cover" },
            src: item.imageUrl,
          })
        : React.createElement(View, {
            style: { width: isCompact ? 100 : 160, backgroundColor: `${accent}15`, justifyContent: "center", alignItems: "center" },
          }, React.createElement(Text, { style: { fontSize: 20, color: accent, opacity: 0.4 } }, "✦")),
      // Info
      React.createElement(
        View,
        { style: { flex: 1, padding: isCompact ? 10 : 14, justifyContent: "center" } },
        React.createElement(Text, { style: { fontSize: 8, fontFamily: "Helvetica-Bold", color: accent, letterSpacing: 1.5, marginBottom: 3 } }, `PKG ${idx + 1}`),
        React.createElement(Text, { style: { fontSize: isCompact ? 12 : 16, fontFamily: "Helvetica-Bold", color: "#0f172a", lineHeight: 1.2, marginBottom: 4 } }, item.packageName),
        React.createElement(Text, { style: { fontSize: isCompact ? 13 : 18, fontFamily: "Helvetica-Bold", color: accent, marginBottom: 6 } }, fmtPrice(item.price)),
        ...features.slice(0, isCompact ? 2 : 4).map((f, fi) =>
          React.createElement(
            View,
            { key: fi, style: { flexDirection: "row", marginBottom: 3 } },
            React.createElement(Text, { style: { fontSize: 8, color: accent, marginRight: 5 } }, "•"),
            React.createElement(Text, { style: { fontSize: 8, color: "#475569", flex: 1, lineHeight: 1.4 } }, f)
          )
        ),
        item.isBestSeller
          ? React.createElement(
              View,
              { style: { backgroundColor: "#fef9c3", borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2, alignSelf: "flex-start", marginTop: 4 } },
              React.createElement(Text, { style: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#854d0e" } }, "⭐ BEST")
            )
          : null
      )
    );
  }

  // Build rows
  const rows: ProposalWithItems["items"][] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { padding: pad, backgroundColor: "#f8fafc" } },
    // Header
    React.createElement(
      View,
      { style: { flexDirection: "row", alignItems: "center", marginBottom: 12 } },
      React.createElement(View, { style: { width: 4, height: 20, backgroundColor: accent, borderRadius: 2, marginRight: 10 } }),
      React.createElement(
        View,
        null,
        React.createElement(Text, { style: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#0f172a" } }, "Our Packages"),
        totalPages > 1
          ? React.createElement(Text, { style: { fontSize: 9, color: "#94a3b8" } }, `Page ${pageIndex + 1} of ${totalPages}`)
          : null
      )
    ),
    // Rows of cards
    React.createElement(
      View,
      { style: { flex: 1, gap: 8 } },
      ...rows.map((rowItems, ri) =>
        React.createElement(
          View,
          { key: ri, style: { flex: 1, flexDirection: "row", gap: 8 } },
          ...rowItems.map((item, ci) =>
            React.createElement(PackageCard, { key: ci, item, idx: ri * cols + ci })
          )
        )
      )
    )
  );
}

// ── Add-ons Page ───────────────────────────────────────────────────────────────

function AddOnsPage({
  addOns,
  creativity,
  elegance,
}: {
  addOns: ProposalWithItems["addOns"];
  creativity: number;
  elegance: number;
}) {
  const accent = getAccentColor(creativity);
  const pad = getPad(elegance);

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { padding: pad, backgroundColor: "#f8fafc" } },
    React.createElement(
      View,
      { style: { flexDirection: "row", alignItems: "center", marginBottom: 8 } },
      React.createElement(View, { style: { width: 4, height: 28, backgroundColor: accent, borderRadius: 2, marginRight: 10 } }),
      React.createElement(
        View,
        null,
        React.createElement(Text, { style: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#0f172a" } }, "Optional Add-Ons"),
        React.createElement(Text, { style: { fontSize: 11, color: "#475569" } }, "Enhance your event with these extras")
      )
    ),
    React.createElement(
      View,
      { style: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20 } },
      ...addOns.map((ao) =>
        React.createElement(
          View,
          {
            key: ao.id,
            style: {
              backgroundColor: "#ffffff", borderRadius: 8,
              padding: 14, minWidth: 140,
              borderTopWidth: 3, borderTopColor: accent,
              borderWidth: 1, borderColor: "#e2e8f0",
            },
          },
          React.createElement(Text, { style: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 4 } }, ao.addOnName),
          React.createElement(Text, { style: { fontSize: 11, color: accent, fontFamily: "Helvetica-Bold" } }, ao.priceLabel ?? (ao.price != null ? fmtPrice(ao.price) : ""))
        )
      )
    )
  );
}

// ── Terms Page ─────────────────────────────────────────────────────────────────

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
  const secondary = getSecondaryColor(creativity);
  const pad = getPad(elegance);

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: { padding: pad, justifyContent: "center" } },
    // Background gradient strip on left
    React.createElement(View, {
      style: {
        position: "absolute", top: 0, left: 0, bottom: 0, width: 8,
        backgroundColor: accent,
      },
    }),
    React.createElement(
      View,
      { style: { paddingLeft: 20 } },
      proposal.senderLogoUrl
        ? React.createElement(Image, { style: { width: 160, height: 80, objectFit: "contain", marginBottom: 20 }, src: proposal.senderLogoUrl })
        : null,
      React.createElement(Text, { style: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 4 } }, proposal.senderName),
      proposal.senderEmail
        ? React.createElement(Text, { style: { fontSize: 11, color: "#475569", marginBottom: 3 } }, proposal.senderEmail)
        : null,
      proposal.senderPhone
        ? React.createElement(Text, { style: { fontSize: 11, color: "#475569", marginBottom: 3 } }, proposal.senderPhone)
        : null,
      React.createElement(View, { style: { width: 48, height: 2, backgroundColor: accent, marginVertical: 20 } }),
      proposal.termsText
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#94a3b8", letterSpacing: 1, marginBottom: 8 } }, "TERMS & CONDITIONS"),
            React.createElement(Text, { style: { fontSize: 10, color: "#475569", lineHeight: getLineHeight(elegance) } }, proposal.termsText)
          )
        : React.createElement(Text, { style: { fontSize: 12, color: "#94a3b8", fontStyle: "italic" } }, "Thank you for your interest. Please contact us for more information.")
    )
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

function ProposalDocument({ proposal }: { proposal: ProposalWithItems }) {
  const creativity = proposal.creativity ?? 50;
  const elegance = proposal.elegance ?? 50;
  const pagesCount = Math.max(1, proposal.pagesCount ?? 1);
  const addOnsEnabled = proposal.addOnsEnabled ?? false;

  // Distribute packages across pages (max 6 per page enforced by validation)
  const items = proposal.items;
  const pkgsPerPage = items.length > 0 ? Math.ceil(items.length / pagesCount) : 0;

  const packagePages: ProposalWithItems["items"][] = [];
  for (let i = 0; i < pagesCount && i * pkgsPerPage < items.length; i++) {
    const slice = items.slice(i * pkgsPerPage, (i + 1) * pkgsPerPage);
    if (slice.length > 0) packagePages.push(slice);
  }

  const packagePageElements = packagePages.map((pkgsOnPage, pi) => {
    if (pkgsOnPage.length === 1) {
      return React.createElement(SinglePackagePage, {
        key: `pkg-page-${pi}`,
        item: pkgsOnPage[0],
        index: pi,
        creativity,
        elegance,
      });
    }
    return React.createElement(MultiPackagePage, {
      key: `pkg-page-${pi}`,
      items: pkgsOnPage,
      pageIndex: pi,
      totalPages: packagePages.length,
      creativity,
      elegance,
    });
  });

  return React.createElement(
    Document,
    { title: proposal.eventTitle, author: proposal.senderName },
    React.createElement(CoverPage, { proposal, creativity, elegance }),
    ...packagePageElements,
    addOnsEnabled && proposal.addOns.length > 0
      ? React.createElement(AddOnsPage, { addOns: proposal.addOns, creativity, elegance })
      : null,
    React.createElement(TermsPage, { proposal, creativity, elegance })
  );
}

export async function generateProposalPDF(proposal: ProposalWithItems): Promise<Buffer> {
  const element = React.createElement(
    ProposalDocument,
    { proposal }
  ) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(element);
}
