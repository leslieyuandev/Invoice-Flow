"use client";

import { useEffect, useRef, useState } from "react";
import type { ProposalFormData, ProposalAddOnFormItem } from "@/types/proposal";

const BASE_W = 842;
const BASE_H = 595;
const GOLD = "#D4A843";
const DEFAULT_BG = "#C8151B";

function fmtPriceRm(cents: number) {
  return `RM${Math.round(cents / 100)}`;
}

function displayAddOnPrice(ao: ProposalAddOnFormItem) {
  if (ao.priceLabel) return ao.priceLabel;
  if (ao.price != null) return `RM${Math.round(ao.price / 100)}`;
  return null;
}

// ── Decorative SVG elements (gold curls) ──────────────────────────────────────

function CurlTopLeft({ color = GOLD }: { color?: string }) {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ position: "absolute", top: 0, left: 0 }}>
      <path d="M5 85 C20 60 35 35 70 12 C78 7 84 3 90 0" stroke={color} strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M0 55 C12 42 25 28 50 16" stroke={color} strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M0 25 C8 20 16 14 28 8" stroke={color} strokeWidth="0.6" fill="none" opacity="0.4" />
    </svg>
  );
}

function CurlTopRight({ color = GOLD }: { color?: string }) {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" fill="none" style={{ position: "absolute", top: 0, right: 0 }}>
      <path d="M85 85 C70 60 55 35 20 12 C12 7 6 3 0 0" stroke={color} strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M90 55 C78 42 65 28 40 16" stroke={color} strokeWidth="0.8" fill="none" opacity="0.5" />
      <path d="M90 25 C82 20 74 14 62 8" stroke={color} strokeWidth="0.6" fill="none" opacity="0.4" />
    </svg>
  );
}

function CurlPackageRight({ color = GOLD }: { color?: string }) {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ position: "absolute", top: 0, right: 0 }}>
      <path d="M80 0 C65 8 52 20 48 38 C44 50 46 62 40 72" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M80 20 C70 26 62 34 58 46" stroke={color} strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  );
}

// ── Slide components ──────────────────────────────────────────────────────────

function LogoBox({
  senderLogoUrl,
  senderName,
  small = false,
}: {
  senderLogoUrl?: string | null;
  senderName: string;
  small?: boolean;
}) {
  if (senderLogoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={senderLogoUrl}
        alt="logo"
        style={{ height: small ? 22 : 32, objectFit: "contain", maxWidth: small ? 90 : 130 }}
      />
    );
  }
  return (
    <span style={{ color: "white", fontWeight: "bold", fontSize: small ? 9 : 13 }}>
      {senderName || "HALO BALLOON"}
    </span>
  );
}

function CoverSlide({
  data,
  senderName,
  senderLogoUrl,
}: {
  data: Partial<ProposalFormData>;
  senderName: string;
  senderLogoUrl?: string | null;
}) {
  const bg = data.bgColor || DEFAULT_BG;
  const title = data.coverTitle || data.eventTitle || "Balloon Packages";

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      {/* Left colored panel ~58% */}
      <div
        style={{
          position: "relative",
          width: "58%",
          height: "100%",
          backgroundColor: bg,
          overflow: "hidden",
        }}
      >
        <CurlTopLeft />
        {/* Logo top-left */}
        <div style={{ position: "absolute", top: 32, left: 32 }}>
          <LogoBox senderLogoUrl={senderLogoUrl} senderName={senderName} />
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 8, fontStyle: "italic", marginTop: 4 }}>
            Your Vision. Our Craft.
          </p>
        </div>
        {/* Title bottom-left */}
        <div style={{ position: "absolute", bottom: 36, left: 32, right: 20 }}>
          <h1
            style={{
              color: "white",
              fontSize: 36,
              fontWeight: "bold",
              lineHeight: 1.15,
              margin: 0,
              wordBreak: "break-word",
            }}
          >
            {title}
          </h1>
        </div>
      </div>
      {/* Right photo panel ~42% */}
      <div style={{ position: "relative", flex: 1, height: "100%", backgroundColor: "#888" }}>
        {data.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.coverImageUrl}
            alt="cover"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: bg,
              opacity: 0.35,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "white", fontSize: 11, opacity: 0.6 }}>Cover photo here</span>
          </div>
        )}
      </div>
    </div>
  );
}

function PackageSlide({
  item,
  index,
  bg,
  senderName,
  senderLogoUrl,
}: {
  item: ProposalFormData["selectedPackages"][0];
  index: number;
  bg: string;
  senderName: string;
  senderLogoUrl?: string | null;
}) {
  const photoUrl = item.imageOverride || item.imageUrl;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      {/* Left photo ~40% */}
      <div
        style={{
          position: "relative",
          width: "40%",
          height: "100%",
          backgroundColor: "#555",
          overflow: "hidden",
        }}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={item.packageName}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, backgroundColor: bg, opacity: 0.4 }} />
        )}
      </div>
      {/* Right info panel ~60% */}
      <div
        style={{
          position: "relative",
          flex: 1,
          height: "100%",
          backgroundColor: bg,
          padding: "36px 36px 36px 40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <CurlPackageRight />
        {/* Package label */}
        <p
          style={{
            color: GOLD,
            fontSize: 10,
            fontWeight: "bold",
            letterSpacing: 3,
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          PACKAGE {index + 1}
        </p>
        {/* Price row */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
          <span style={{ color: GOLD, fontSize: 46, fontWeight: "bold", lineHeight: 1 }}>
            {fmtPriceRm(item.price)}
          </span>
          {item.originalPrice != null && (
            <span
              style={{
                color: GOLD,
                fontSize: 18,
                textDecoration: "line-through",
                opacity: 0.8,
              }}
            >
              {fmtPriceRm(item.originalPrice)}
            </span>
          )}
        </div>
        {/* Package name */}
        <h2
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "bold",
            margin: 0,
            marginBottom: item.tagline ? 4 : 14,
          }}
        >
          {item.packageName}
        </h2>
        {item.tagline && (
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginBottom: 14 }}>
            {item.tagline}
          </p>
        )}
        {/* Features */}
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {item.features.slice(0, 6).map((f, i) => (
            <li key={i} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
              <span style={{ color: GOLD, fontSize: 12, lineHeight: 1.2, flexShrink: 0 }}>•</span>
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 10, lineHeight: 1.4 }}>{f}</span>
            </li>
          ))}
        </ul>
        {/* Logo bottom-right */}
        <div style={{ position: "absolute", bottom: 22, right: 28, textAlign: "right" }}>
          <LogoBox senderLogoUrl={senderLogoUrl} senderName={senderName} small />
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 7, fontStyle: "italic", marginTop: 2 }}>
            Your Vision. Our Craft.
          </p>
        </div>
      </div>
    </div>
  );
}

function AddOnsSlide({
  addOns,
  bg,
  senderName,
  senderLogoUrl,
}: {
  addOns: ProposalAddOnFormItem[];
  bg: string;
  senderName: string;
  senderLogoUrl?: string | null;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: bg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <CurlTopLeft />
      <CurlTopRight />
      {/* Center content vertically */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 40px",
          gap: 0,
        }}
      >
        {/* Title */}
        <h2
          style={{
            color: GOLD,
            fontSize: 26,
            fontWeight: "bold",
            letterSpacing: 8,
            margin: "0 0 24px 0",
          }}
        >
          ADD ONS
        </h2>
        {/* Grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "16px 28px",
            width: "100%",
          }}
        >
          {addOns.map((ao, i) => {
            const price = displayAddOnPrice(ao);
            return (
              <div
                key={i}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 110 }}
              >
                {ao.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ao.imageUrl}
                    alt={ao.addOnName}
                    style={{ width: 65, height: 65, objectFit: "contain", borderRadius: 4 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 65,
                      height: 65,
                      borderRadius: 4,
                      backgroundColor: "rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ color: GOLD, fontSize: 18 }}>✦</span>
                  </div>
                )}
                <p style={{ color: "white", fontWeight: "bold", fontSize: 10, textAlign: "center", marginTop: 6 }}>
                  {ao.addOnName}
                </p>
                {price && (
                  <p style={{ color: GOLD, fontSize: 10, textAlign: "center", margin: 0 }}>{price}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Logo bottom-right */}
      <div style={{ position: "absolute", bottom: 20, right: 28, textAlign: "right" }}>
        <LogoBox senderLogoUrl={senderLogoUrl} senderName={senderName} small />
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 7, fontStyle: "italic", marginTop: 2 }}>
          Your Vision. Our Craft.
        </p>
      </div>
    </div>
  );
}

function CompactPackagesSlide({
  packages,
  pageIndex,
  bg,
  senderName,
  senderLogoUrl,
}: {
  packages: ProposalFormData["selectedPackages"];
  pageIndex: number;
  bg: string;
  senderName: string;
  senderLogoUrl?: string | null;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: bg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        padding: "20px 28px 16px",
      }}
    >
      <CurlTopLeft />
      <CurlTopRight />
      {/* Header */}
      <p
        style={{
          color: GOLD,
          fontSize: 9,
          fontWeight: "bold",
          letterSpacing: 4,
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        PACKAGES{pageIndex > 0 ? ` (CONT.)` : ""}
      </p>
      {/* 3-column grid */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {[0, 1].map((row) => (
          <div key={row} style={{ flex: 1, display: "flex", gap: 10 }}>
            {[0, 1, 2].map((col) => {
              const pkg = packages[row * 3 + col];
              if (!pkg) return <div key={col} style={{ flex: 1 }} />;
              const photoUrl = pkg.imageOverride || pkg.imageUrl;
              return (
                <div
                  key={col}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "row",
                    backgroundColor: "rgba(0,0,0,0.18)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ width: 56, flexShrink: 0, backgroundColor: "#555", position: "relative" }}>
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrl} alt={pkg.packageName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", backgroundColor: "rgba(255,255,255,0.1)" }} />
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <p style={{ color: GOLD, fontSize: 13, fontWeight: "bold", lineHeight: 1, margin: 0 }}>
                      {fmtPriceRm(pkg.price)}
                    </p>
                    <p style={{ color: "white", fontSize: 9, fontWeight: "bold", margin: "3px 0 2px", lineHeight: 1.2 }}>
                      {pkg.packageName}
                    </p>
                    {pkg.features.slice(0, 2).map((f, fi) => (
                      <p key={fi} style={{ color: "rgba(255,255,255,0.75)", fontSize: 7.5, margin: 0, lineHeight: 1.3 }}>
                        • {f}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* Logo */}
      <div style={{ position: "absolute", bottom: 14, right: 24, textAlign: "right" }}>
        <LogoBox senderLogoUrl={senderLogoUrl} senderName={senderName} small />
      </div>
    </div>
  );
}

function TermsSlide({
  data,
  senderName,
  senderLogoUrl,
  senderPhone,
  senderEmail,
  bg,
}: {
  data: Partial<ProposalFormData>;
  senderName: string;
  senderLogoUrl?: string | null;
  senderPhone?: string | null;
  senderEmail?: string | null;
  bg: string;
}) {
  const terms = data.termsText || "";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: bg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <CurlTopLeft />
      <CurlTopRight />
      {/* Header: centered logo */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 28,
          paddingBottom: 12,
          borderBottom: "1px solid rgba(255,255,255,0.25)",
        }}
      >
        <LogoBox senderLogoUrl={senderLogoUrl} senderName={senderName} />
        <div style={{ width: 160, height: 1, backgroundColor: "rgba(255,255,255,0.35)", margin: "8px 0" }} />
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 8, fontStyle: "italic" }}>
          Your Vision. Our Craft.
        </p>
      </div>
      {/* Terms content */}
      <div style={{ flex: 1, padding: "16px 36px", overflow: "hidden" }}>
        {terms ? (
          <pre
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 9,
              lineHeight: 1.6,
              fontFamily: "inherit",
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {terms}
          </pre>
        ) : (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontStyle: "italic" }}>
            Terms & conditions will appear here.
          </p>
        )}
      </div>
      {/* Enquiry footer */}
      {(senderName || senderPhone || senderEmail) && (
        <div
          style={{
            padding: "12px 36px 18px",
            borderTop: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 7,
              letterSpacing: 2,
              fontWeight: "bold",
              marginBottom: 4,
            }}
          >
            FOR ENQUIRY:
          </p>
          {senderName && <p style={{ color: "white", fontSize: 9 }}>{senderName}</p>}
          {senderPhone && (
            <p style={{ color: "white", fontSize: 9 }}>T: {senderPhone}</p>
          )}
          {senderEmail && (
            <p style={{ color: "white", fontSize: 9 }}>E: {senderEmail}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ProposalPreviewProps {
  data: Partial<ProposalFormData>;
  senderName: string;
  senderLogoUrl?: string | null;
  senderPhone?: string | null;
  senderEmail?: string | null;
  compact?: boolean;
}

export function ProposalPreview({
  data,
  senderName,
  senderLogoUrl,
  senderPhone,
  senderEmail,
  compact = false,
}: ProposalPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      setScale(Math.min(width / BASE_W, height / BASE_H));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const bg = data.bgColor || DEFAULT_BG;
  const selectedPackages = data.selectedPackages ?? [];
  const selectedAddOns = data.selectedAddOns ?? [];
  const addOnsEnabled = data.addOnsEnabled ?? false;

  // Build slides based on compact mode
  const compactPages = compact
    ? Array.from({ length: Math.ceil(selectedPackages.length / 6) }, (_, i) => i)
    : [];

  const slides: { id: string; label: string }[] = [
    { id: "cover", label: "Cover" },
    ...(compact
      ? compactPages.map((pi) => ({ id: `compact-${pi}`, label: `Pkgs${pi > 0 ? ` ${pi + 1}` : ""}` }))
      : selectedPackages.map((_, i) => ({ id: `pkg-${i}`, label: `Pkg ${i + 1}` }))),
    ...(addOnsEnabled && selectedAddOns.length > 0 ? [{ id: "addons", label: "Add-Ons" }] : []),
    { id: "terms", label: "Terms" },
  ];

  const [activeSlide, setActiveSlide] = useState("cover");
  const effectiveSlide = slides.find((s) => s.id === activeSlide) ? activeSlide : slides[0]?.id ?? "cover";

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface-100">
      {/* Slide tabs */}
      <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-surface-200 overflow-x-auto shrink-0">
        {slides.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSlide(s.id)}
            className={`px-2.5 py-1 rounded text-xs font-medium shrink-0 transition-colors ${
              effectiveSlide === s.id
                ? "bg-brand-600 text-white"
                : "text-surface-500 hover:bg-surface-100"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div
          style={{
            width: BASE_W,
            height: BASE_H,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            position: "relative",
            boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
            flexShrink: 0,
          }}
        >
          {effectiveSlide === "cover" && (
            <CoverSlide data={data} senderName={senderName} senderLogoUrl={senderLogoUrl} />
          )}
          {compact
            ? compactPages.map((pi) =>
                effectiveSlide === `compact-${pi}` ? (
                  <CompactPackagesSlide
                    key={pi}
                    packages={selectedPackages.slice(pi * 6, pi * 6 + 6)}
                    pageIndex={pi}
                    bg={bg}
                    senderName={senderName}
                    senderLogoUrl={senderLogoUrl}
                  />
                ) : null
              )
            : selectedPackages.map((pkg, i) =>
                effectiveSlide === `pkg-${i}` ? (
                  <PackageSlide
                    key={i}
                    item={pkg}
                    index={i}
                    bg={bg}
                    senderName={senderName}
                    senderLogoUrl={senderLogoUrl}
                  />
                ) : null
              )}
          {effectiveSlide === "addons" && addOnsEnabled && selectedAddOns.length > 0 && (
            <AddOnsSlide
              addOns={selectedAddOns}
              bg={bg}
              senderName={senderName}
              senderLogoUrl={senderLogoUrl}
            />
          )}
          {effectiveSlide === "terms" && (
            <TermsSlide
              data={data}
              senderName={senderName}
              senderLogoUrl={senderLogoUrl}
              senderPhone={senderPhone}
              senderEmail={senderEmail}
              bg={bg}
            />
          )}
        </div>
      </div>
    </div>
  );
}
