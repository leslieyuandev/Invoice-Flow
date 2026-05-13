"use client";

import { useRef, useState, useEffect } from "react";
import type { ProposalFormData, ProposalPackageFormItem, ProposalAddOnFormItem } from "@/types/proposal";

interface ProposalPreviewProps {
  data: Partial<ProposalFormData>;
  senderName?: string;
}

// A4 landscape: 842 × 595
const A4_W = 842;
const A4_H = 595;

// Style helpers derived from creativity / elegance sliders
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
  return 28 + Math.round((elegance / 100) * 24); // 28–52 px
}

function getLineHeight(elegance: number): number {
  return 1.3 + (elegance / 100) * 0.5; // 1.3–1.8
}

// ── Cover Slide ───────────────────────────────────────────────────────────────

function CoverSlide({
  eventTitle,
  leadName,
  senderName,
  creativity,
  elegance,
  coverImageUrl,
}: {
  eventTitle?: string;
  leadName?: string;
  senderName?: string;
  creativity: number;
  elegance: number;
  coverImageUrl?: string;
}) {
  const accent = getAccentColor(creativity);
  const secondary = getSecondaryColor(creativity);
  const pad = getPad(elegance);

  return (
    <div
      style={{
        width: A4_W,
        height: A4_H,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: coverImageUrl
          ? `url(${coverImageUrl}) center/cover no-repeat`
          : `linear-gradient(135deg, ${accent} 0%, ${secondary} 100%)`,
      }}
    >
      {/* Overlay for image backgrounds */}
      {coverImageUrl && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      )}

      {/* Decorative circles (creativity-driven) */}
      {creativity > 40 && (
        <>
          <div style={{
            position: "absolute", top: -60, right: -60, width: 240, height: 240,
            borderRadius: "50%", background: "rgba(255,255,255,0.08)",
          }} />
          <div style={{
            position: "absolute", bottom: -40, left: -40, width: 160, height: 160,
            borderRadius: "50%", background: "rgba(255,255,255,0.06)",
          }} />
        </>
      )}

      {/* Sender name — top left */}
      {senderName && (
        <div style={{
          position: "absolute", top: pad, left: pad,
          fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)",
          letterSpacing: 1,
        }}>
          {senderName}
        </div>
      )}

      {/* Center content */}
      <div style={{ position: "relative", textAlign: "center", padding: `0 ${pad * 2}px` }}>
        {creativity > 55 && (
          <div style={{
            width: 48, height: 2, background: "rgba(255,255,255,0.6)",
            margin: "0 auto 20px",
          }} />
        )}
        <div style={{
          fontSize: 40, fontWeight: 800, color: "#fff",
          lineHeight: getLineHeight(elegance),
          textShadow: "0 2px 12px rgba(0,0,0,0.3)",
        }}>
          {eventTitle || <span style={{ opacity: 0.4 }}>Event Title</span>}
        </div>
        {leadName && (
          <div style={{
            marginTop: 16, fontSize: 16,
            color: "rgba(255,255,255,0.8)",
            fontStyle: "italic",
          }}>
            Prepared for {leadName}
          </div>
        )}
        {creativity > 55 && (
          <div style={{
            width: 48, height: 2, background: "rgba(255,255,255,0.6)",
            margin: "20px auto 0",
          }} />
        )}
      </div>

      {/* Bottom bar */}
      {elegance > 40 && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 4, background: "rgba(255,255,255,0.25)",
        }} />
      )}
    </div>
  );
}

// ── Single Package Card (for multi-package pages) ──────────────────────────────

function PackageCard({
  pkg,
  index,
  accent,
  secondary,
  elegance,
  isCompact,
}: {
  pkg: ProposalPackageFormItem;
  index: number;
  accent: string;
  secondary: string;
  elegance: number;
  isCompact: boolean;
}) {
  const imgUrl = pkg.imageOverride || pkg.imageUrl;
  const pad = isCompact ? 16 : 24;

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "row",
      background: "#fff", overflow: "hidden",
      border: "1px solid #e2e8f0", borderRadius: 8,
    }}>
      {/* Photo */}
      <div style={{
        width: isCompact ? 120 : 180, flexShrink: 0,
        background: imgUrl ? `url(${imgUrl}) center/cover no-repeat` : `linear-gradient(135deg, ${accent}22, ${secondary}33)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {!imgUrl && (
          <span style={{ fontSize: 28, color: accent, opacity: 0.5 }}>✦</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: pad, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: accent, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
          Package {index + 1}
        </div>
        <div style={{ fontSize: isCompact ? 14 : 18, fontWeight: 800, color: "#0f172a", lineHeight: 1.2, marginBottom: 4 }}>
          {pkg.packageName}
        </div>
        {pkg.tagline && !isCompact && (
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>{pkg.tagline}</div>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: isCompact ? 15 : 20, fontWeight: 800, color: accent }}>
            RM {(pkg.price / 100).toFixed(2)}
          </span>
          {pkg.originalPrice && !isCompact && (
            <span style={{ fontSize: 11, color: "#94a3b8", textDecoration: "line-through" }}>
              RM {(pkg.originalPrice / 100).toFixed(2)}
            </span>
          )}
        </div>
        {pkg.features.slice(0, isCompact ? 2 : 4).map((f, fi) => (
          <div key={fi} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
            <span style={{ color: accent, fontSize: 9, marginTop: 1, flexShrink: 0 }}>●</span>
            <span style={{ fontSize: 9, color: "#475569", lineHeight: 1.4 }}>{f}</span>
          </div>
        ))}
        {pkg.isBestSeller && (
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "#fef9c3", borderRadius: 3,
            padding: "2px 6px", fontSize: 8, fontWeight: 700, color: "#854d0e",
            marginTop: 6, alignSelf: "flex-start",
          }}>
            ⭐ BEST SELLER
          </div>
        )}
      </div>
    </div>
  );
}

// ── Package Page Slide ─────────────────────────────────────────────────────────

function PackagePageSlide({
  pkgsOnPage,
  pageIndex,
  totalPages,
  creativity,
  elegance,
}: {
  pkgsOnPage: ProposalPackageFormItem[];
  pageIndex: number;
  totalPages: number;
  creativity: number;
  elegance: number;
}) {
  const accent = getAccentColor(creativity);
  const secondary = getSecondaryColor(creativity);
  const pad = getPad(elegance);
  const isCompact = pkgsOnPage.length > 2;
  const isSingle = pkgsOnPage.length === 1;

  if (isSingle) {
    // Full-page split: photo left / info right
    const pkg = pkgsOnPage[0];
    const imgUrl = pkg.imageOverride || pkg.imageUrl;
    const pkgIndex = pageIndex; // approximate — exact index not needed in preview

    return (
      <div style={{ width: A4_W, height: A4_H, display: "flex", background: "#fff" }}>
        {/* Left: photo */}
        <div style={{
          width: 380, height: A4_H, flexShrink: 0, overflow: "hidden",
          background: imgUrl
            ? `url(${imgUrl}) center/cover no-repeat`
            : `linear-gradient(160deg, ${accent}20, ${secondary}35)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {!imgUrl && <span style={{ fontSize: 56, color: accent, opacity: 0.3 }}>✦</span>}
        </div>
        {/* Right: info */}
        <div style={{ flex: 1, padding: pad, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            Package {pkgIndex + 1} · {totalPages > 1 ? `Page ${pageIndex + 1} of ${totalPages}` : ""}
          </div>
          <div style={{ width: 40, height: 2, background: accent, marginBottom: 16 }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", lineHeight: 1.2, marginBottom: 8 }}>
            {pkg.packageName}
          </div>
          {pkg.tagline && (
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 16, lineHeight: getLineHeight(elegance) }}>{pkg.tagline}</div>
          )}
          {pkg.isBestSeller && (
            <div style={{
              background: "#fef9c3", display: "inline-flex", alignItems: "center",
              borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 700,
              color: "#854d0e", marginBottom: 14, alignSelf: "flex-start",
            }}>
              ⭐ BEST SELLER
            </div>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 30, fontWeight: 800, color: accent }}>RM {(pkg.price / 100).toFixed(2)}</span>
            {pkg.originalPrice && (
              <span style={{ fontSize: 14, color: "#94a3b8", textDecoration: "line-through" }}>
                RM {(pkg.originalPrice / 100).toFixed(2)}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {pkg.features.slice(0, 6).map((f, fi) => (
              <div key={fi} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: accent, fontSize: 10, marginTop: 1, flexShrink: 0 }}>●</span>
                <span style={{ fontSize: 11, color: "#475569", lineHeight: getLineHeight(elegance) }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Multi-package grid on one page
  const cols = pkgsOnPage.length <= 2 ? 1 : 2;
  const rows = Math.ceil(pkgsOnPage.length / cols);

  return (
    <div style={{
      width: A4_W, height: A4_H, padding: pad,
      background: "#f8fafc",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 4, height: 20, background: accent, borderRadius: 2 }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
          Our Packages
          {totalPages > 1 && (
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400, marginLeft: 8 }}>
              (Page {pageIndex + 1} of {totalPages})
            </span>
          )}
        </div>
      </div>
      {/* Grid */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: 8,
      }}>
        {pkgsOnPage.map((pkg, i) => (
          <PackageCard
            key={pkg.catalogPackageId}
            pkg={pkg}
            index={i}
            accent={accent}
            secondary={secondary}
            elegance={elegance}
            isCompact={isCompact}
          />
        ))}
      </div>
    </div>
  );
}

// ── Add-Ons Slide ──────────────────────────────────────────────────────────────

function AddOnsSlide({
  addOns,
  creativity,
  elegance,
}: {
  addOns: ProposalAddOnFormItem[];
  creativity: number;
  elegance: number;
}) {
  const accent = getAccentColor(creativity);
  const pad = getPad(elegance);
  return (
    <div style={{ width: A4_W, height: A4_H, padding: pad, background: "#f8fafc" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 4, height: 24, background: accent, borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Optional Add-Ons</div>
          <div style={{ fontSize: 12, color: "#475569" }}>Enhance your event with these extras</div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
        {addOns.map((ao) => (
          <div key={ao.catalogAddOnId} style={{
            background: "#fff", borderRadius: 8, padding: "12px 16px",
            border: `1px solid ${accent}30`, minWidth: 140,
            borderTop: `3px solid ${accent}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{ao.addOnName}</div>
            {ao.priceLabel && <div style={{ fontSize: 12, color: accent, fontWeight: 600 }}>{ao.priceLabel}</div>}
            {ao.quantity > 1 && <div style={{ fontSize: 10, color: "#94a3b8" }}>Qty: {ao.quantity}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function ProposalPreview({ data, senderName }: ProposalPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width - 32;
      setScale(Math.min(1, available / A4_W));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const packages = data.selectedPackages ?? [];
  const addOns = data.selectedAddOns ?? [];
  const addOnsEnabled = data.addOnsEnabled ?? false;
  const pagesCount = Math.max(1, data.pagesCount ?? 1);
  const creativity = data.creativity ?? 50;
  const elegance = data.elegance ?? 50;

  // Distribute packages across pages
  const pkgsPerPage = pagesCount > 0 ? Math.ceil(packages.length / pagesCount) : packages.length;
  const packagePages: ProposalPackageFormItem[][] = [];
  for (let i = 0; i < pagesCount; i++) {
    const slice = packages.slice(i * pkgsPerPage, (i + 1) * pkgsPerPage);
    if (slice.length > 0) packagePages.push(slice);
  }

  const totalSlides = 1 + packagePages.length + (addOnsEnabled && addOns.length > 0 ? 1 : 0);
  const totalHeight = totalSlides * A4_H + (totalSlides - 1) * 16;

  return (
    <div ref={containerRef} className="overflow-y-auto h-full bg-surface-100 p-4 flex flex-col items-center">
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          marginBottom: `${(scale - 1) * totalHeight}px`,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Cover */}
        <CoverSlide
          eventTitle={data.eventTitle}
          leadName={data.leadName}
          senderName={senderName}
          creativity={creativity}
          elegance={elegance}
          coverImageUrl={data.coverImageUrl}
        />

        {/* Package pages */}
        {packagePages.map((pkgsOnPage, pi) => (
          <PackagePageSlide
            key={pi}
            pkgsOnPage={pkgsOnPage}
            pageIndex={pi}
            totalPages={packagePages.length}
            creativity={creativity}
            elegance={elegance}
          />
        ))}

        {/* Add-ons page */}
        {addOnsEnabled && addOns.length > 0 && (
          <AddOnsSlide addOns={addOns} creativity={creativity} elegance={elegance} />
        )}

        {packages.length === 0 && (
          <div style={{
            width: A4_W, height: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#fff", borderRadius: 8, border: "1px dashed #e2e8f0",
            color: "#94a3b8", fontSize: 14,
          }}>
            Select packages to see the preview
          </div>
        )}
      </div>
    </div>
  );
}
