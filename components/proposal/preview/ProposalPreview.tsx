"use client";

import { useRef, useState, useEffect } from "react";
import type { ProposalFormData, ProposalPackageFormItem, ProposalAddOnFormItem } from "@/types/proposal";

interface ProposalPreviewProps {
  data: Partial<ProposalFormData>;
  senderName?: string;
}

// A4 landscape: 842 x 595px
const A4_W = 842;
const A4_H = 595;

function CoverSlide({ eventTitle, leadName, senderName }: { eventTitle?: string; leadName?: string; senderName?: string }) {
  return (
    <div
      className="shrink-0 rounded-lg overflow-hidden shadow-sm"
      style={{ width: A4_W, height: A4_H, background: "#4f46e5", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative" }}
    >
      {senderName && (
        <div style={{ position: "absolute", top: 28, left: 36, fontSize: 13, color: "#c7d2fe", fontWeight: 600 }}>
          {senderName}
        </div>
      )}
      <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", textAlign: "center", lineHeight: 1.2, padding: "0 60px" }}>
        {eventTitle || "Event Title"}
      </div>
      {leadName && (
        <div style={{ fontSize: 18, color: "#c7d2fe", marginTop: 16 }}>
          Prepared for {leadName}
        </div>
      )}
    </div>
  );
}

function PackageSlide({ pkg, index }: { pkg: ProposalPackageFormItem; index: number }) {
  const imgUrl = pkg.imageOverride || pkg.imageUrl;
  return (
    <div
      className="shrink-0 rounded-lg overflow-hidden shadow-sm"
      style={{ width: A4_W, height: A4_H, display: "flex", background: "#fff" }}
    >
      {/* Left photo */}
      <div style={{ width: 380, height: A4_H, background: "#e2e8f0", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={pkg.packageName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 40, color: "#cbd5e1" }}>✦</span>
        )}
      </div>
      {/* Right info */}
      <div style={{ flex: 1, padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 8 }}>
          Package {index + 1}
        </div>
        <div style={{ width: 40, height: 2, background: "#4f46e5", marginBottom: 16 }} />
        <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 1.2, marginBottom: 8 }}>
          {pkg.packageName}
        </div>
        {pkg.tagline && (
          <div style={{ fontSize: 13, color: "#475569", marginBottom: 16 }}>{pkg.tagline}</div>
        )}
        {pkg.isBestSeller && (
          <div style={{ background: "#fef9c3", display: "inline-flex", alignItems: "center", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: "#854d0e", marginBottom: 12, alignSelf: "flex-start" }}>
            ⭐ BEST SELLER
          </div>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#4f46e5" }}>RM {(pkg.price / 100).toFixed(2)}</span>
          {pkg.originalPrice && (
            <span style={{ fontSize: 14, color: "#94a3b8", textDecoration: "line-through" }}>
              RM {(pkg.originalPrice / 100).toFixed(2)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {pkg.features.slice(0, 5).map((f, fi) => (
            <div key={fi} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: "#4f46e5", fontSize: 11, marginTop: 1, flexShrink: 0 }}>•</span>
              <span style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddOnsSlide({ addOns }: { addOns: ProposalAddOnFormItem[] }) {
  return (
    <div
      className="shrink-0 rounded-lg overflow-hidden shadow-sm"
      style={{ width: A4_W, height: A4_H, background: "#f8fafc", padding: "48px" }}
    >
      <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Optional Add-Ons</div>
      <div style={{ fontSize: 13, color: "#475569", marginBottom: 28 }}>Enhance your event with these extras</div>
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 14 }}>
        {addOns.map((ao) => (
          <div key={ao.catalogAddOnId} style={{ background: "#fff", borderRadius: 8, padding: "14px 16px", border: "1px solid #e2e8f0", minWidth: 140 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{ao.addOnName}</div>
            {ao.priceLabel && <div style={{ fontSize: 12, color: "#4f46e5" }}>{ao.priceLabel}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

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

  return (
    <div ref={containerRef} className="overflow-y-auto h-full bg-surface-100 p-4 flex flex-col items-center gap-4">
      {/* All slides stacked vertically */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          marginBottom: `${(scale - 1) * A4_H}px`,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <CoverSlide eventTitle={data.eventTitle} leadName={data.leadName} senderName={senderName} />
        {packages.map((pkg, i) => (
          <PackageSlide key={pkg.catalogPackageId} pkg={pkg} index={i} />
        ))}
        {addOns.length > 0 && <AddOnsSlide addOns={addOns} />}
      </div>
    </div>
  );
}
