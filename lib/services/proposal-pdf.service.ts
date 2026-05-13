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

// A4 Landscape: 841.89 x 595.28 pt
const PAGE_SIZE: [number, number] = [841.89, 595.28];
const BRAND = "#4f46e5";
const DARK = "#0f172a";
const MID = "#475569";
const LIGHT = "#94a3b8";
const BG = "#f8fafc";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: DARK,
    backgroundColor: "#ffffff",
  },
  // ── Cover ──────────────────────────────────────────────────────────────────
  coverPage: {
    backgroundColor: BRAND,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
  },
  coverLogoWrap: { position: "absolute", top: 32, left: 40 },
  coverLogo: { width: 160, height: 80, objectFit: "contain" },
  coverCompanyName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#ffffff", position: "absolute", top: 36, left: 40 },
  coverTitle: { fontSize: 38, fontFamily: "Helvetica-Bold", color: "#ffffff", textAlign: "center", marginBottom: 16, lineHeight: 1.2 },
  coverSubtitle: { fontSize: 16, color: "#c7d2fe", textAlign: "center" },
  coverPrepared: { position: "absolute", bottom: 32, right: 40, fontSize: 11, color: "#c7d2fe" },
  // ── Package page ───────────────────────────────────────────────────────────
  packagePage: { flexDirection: "row" },
  photoHalf: { width: 380, height: 595.28, backgroundColor: "#e2e8f0" },
  photo: { width: 380, height: 595.28, objectFit: "cover" },
  photoPlaceholder: { width: 380, height: 595.28, backgroundColor: "#e2e8f0", justifyContent: "center", alignItems: "center" },
  photoPlaceholderText: { fontSize: 28, color: "#cbd5e1", fontFamily: "Helvetica-Bold" },
  infoHalf: { flex: 1, padding: 48, justifyContent: "center" },
  packageLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: BRAND, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  packageName: { fontSize: 28, fontFamily: "Helvetica-Bold", color: DARK, lineHeight: 1.2, marginBottom: 8 },
  packageTagline: { fontSize: 13, color: MID, marginBottom: 20, lineHeight: 1.4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 24 },
  price: { fontSize: 32, fontFamily: "Helvetica-Bold", color: BRAND, marginRight: 12 },
  originalPrice: { fontSize: 16, color: LIGHT, textDecoration: "line-through" },
  bestSellerBadge: { backgroundColor: "#fef9c3", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 20 },
  bestSellerText: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#854d0e" },
  featureRow: { flexDirection: "row", marginBottom: 8, alignItems: "flex-start" },
  featureBullet: { fontSize: 10, color: BRAND, marginRight: 8, marginTop: 1 },
  featureText: { fontSize: 11, color: MID, flex: 1, lineHeight: 1.5 },
  dividerLine: { width: 40, height: 2, backgroundColor: BRAND, marginBottom: 20 },
  // ── Add-ons page ───────────────────────────────────────────────────────────
  addOnsPage: { padding: 48, backgroundColor: BG },
  addOnsTitle: { fontSize: 24, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 8 },
  addOnsSubtitle: { fontSize: 12, color: MID, marginBottom: 32 },
  addOnsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  addOnCard: { width: 160, backgroundColor: "#ffffff", borderRadius: 8, padding: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  addOnName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 4 },
  addOnPrice: { fontSize: 11, color: BRAND },
  // ── Terms page ─────────────────────────────────────────────────────────────
  termsPage: { padding: 60, justifyContent: "center" },
  termsLogo: { width: 160, height: 80, objectFit: "contain", marginBottom: 24 },
  termsCompany: { fontSize: 18, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 4 },
  termsMeta: { fontSize: 11, color: MID, marginBottom: 4, lineHeight: 1.6 },
  termsDivider: { width: 48, height: 2, backgroundColor: BRAND, marginVertical: 24 },
  termsLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: LIGHT, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  termsText: { fontSize: 11, color: MID, lineHeight: 1.7 },
});

function fmtPrice(cents: number): string {
  return `RM ${(cents / 100).toFixed(2)}`;
}

function CoverPage({ proposal }: { proposal: ProposalWithItems }) {
  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: s.coverPage },
    // Logo or company name top-left
    proposal.senderLogoUrl
      ? React.createElement(View, { style: s.coverLogoWrap }, React.createElement(Image, { style: s.coverLogo, src: proposal.senderLogoUrl }))
      : React.createElement(Text, { style: s.coverCompanyName }, proposal.senderName),
    // Center content
    React.createElement(Text, { style: s.coverTitle }, proposal.eventTitle),
    React.createElement(Text, { style: s.coverSubtitle }, `Prepared for ${proposal.leadName}`),
    // Bottom-right: sender
    React.createElement(Text, { style: s.coverPrepared }, proposal.senderName)
  );
}

function PackagePage({ item, index }: { item: ProposalWithItems["items"][number]; index: number }) {
  let features: string[] = [];
  try { features = JSON.parse(item.features) as string[]; } catch { features = []; }

  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: s.packagePage },
    // Left: photo
    item.imageUrl
      ? React.createElement(Image, { style: s.photo, src: item.imageUrl })
      : React.createElement(
          View,
          { style: s.photoPlaceholder },
          React.createElement(Text, { style: s.photoPlaceholderText }, "✦")
        ),
    // Right: info
    React.createElement(
      View,
      { style: s.infoHalf },
      React.createElement(Text, { style: s.packageLabel }, `Package ${index + 1}`),
      React.createElement(View, { style: s.dividerLine }),
      React.createElement(Text, { style: s.packageName }, item.packageName),
      item.tagline ? React.createElement(Text, { style: s.packageTagline }, item.tagline) : null,
      item.isBestSeller
        ? React.createElement(
            View,
            { style: s.bestSellerBadge },
            React.createElement(Text, { style: s.bestSellerText }, "⭐ BEST SELLER")
          )
        : null,
      React.createElement(
        View,
        { style: s.priceRow },
        React.createElement(Text, { style: s.price }, fmtPrice(item.price)),
        item.originalPrice
          ? React.createElement(Text, { style: s.originalPrice }, fmtPrice(item.originalPrice))
          : null
      ),
      ...features.map((feat, fi) =>
        React.createElement(
          View,
          { key: `${item.id}-${fi}`, style: s.featureRow },
          React.createElement(Text, { style: s.featureBullet }, "•"),
          React.createElement(Text, { style: s.featureText }, feat)
        )
      )
    )
  );
}

function AddOnsPage({ addOns }: { addOns: ProposalWithItems["addOns"] }) {
  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: s.addOnsPage },
    React.createElement(Text, { style: s.addOnsTitle }, "Optional Add-Ons"),
    React.createElement(Text, { style: s.addOnsSubtitle }, "Enhance your event with these extras"),
    React.createElement(
      View,
      { style: s.addOnsGrid },
      ...addOns.map((ao) =>
        React.createElement(
          View,
          { key: ao.id, style: s.addOnCard },
          React.createElement(Text, { style: s.addOnName }, ao.addOnName),
          React.createElement(Text, { style: s.addOnPrice }, ao.priceLabel ?? (ao.price != null ? fmtPrice(ao.price) : ""))
        )
      )
    )
  );
}

function TermsPage({ proposal }: { proposal: ProposalWithItems }) {
  return React.createElement(
    Page,
    { size: PAGE_SIZE, style: s.termsPage },
    proposal.senderLogoUrl
      ? React.createElement(Image, { style: s.termsLogo, src: proposal.senderLogoUrl })
      : null,
    React.createElement(Text, { style: s.termsCompany }, proposal.senderName),
    proposal.senderEmail ? React.createElement(Text, { style: s.termsMeta }, proposal.senderEmail) : null,
    proposal.senderPhone ? React.createElement(Text, { style: s.termsMeta }, proposal.senderPhone) : null,
    React.createElement(View, { style: s.termsDivider }),
    proposal.termsText
      ? React.createElement(
          View,
          null,
          React.createElement(Text, { style: s.termsLabel }, "Terms & Conditions"),
          React.createElement(Text, { style: s.termsText }, proposal.termsText)
        )
      : React.createElement(Text, { style: s.termsMeta }, "Thank you for your interest. Please contact us for more information.")
  );
}

function ProposalDocument({ proposal }: { proposal: ProposalWithItems }) {
  return React.createElement(
    Document,
    { title: proposal.eventTitle, author: proposal.senderName },
    React.createElement(CoverPage, { proposal }),
    ...proposal.items.map((item, i) =>
      React.createElement(PackagePage, { key: item.id, item, index: i })
    ),
    proposal.addOns.length > 0
      ? React.createElement(AddOnsPage, { addOns: proposal.addOns })
      : null,
    React.createElement(TermsPage, { proposal })
  );
}

export async function generateProposalPDF(proposal: ProposalWithItems): Promise<Buffer> {
  const element = React.createElement(
    ProposalDocument,
    { proposal }
  ) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(element);
}
