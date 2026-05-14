"use client";

import { useEffect, useRef, useState } from "react";
import type { ProposalFormData } from "@/types/proposal";

function getAccent(c: number) {
  if (c < 30) return "#64748b";
  if (c < 65) return "#4f46e5";
  return "#7c3aed";
}
function getAccentLight(c: number) {
  if (c < 30) return "#f1f5f9";
  if (c < 65) return "#eef2ff";
  return "#f5f3ff";
}
function getPad(e: number) { return 28 + Math.round((e / 100) * 24); }
function fmtPrice(cents: number) { return `RM ${(cents / 100).toFixed(0)}`; }

// ── Cover ─────────────────────────────────────────────────────────────────────

function CoverSlide({ data, senderName, senderLogoUrl, accent, accentLight, pad }: {
  data: Partial<ProposalFormData>; senderName: string; senderLogoUrl?: string | null;
  accent: string; accentLight: string; pad: number;
}) {
  return (
    <div className="relative flex h-full">
      <div className="relative flex-shrink-0 h-full overflow-hidden" style={{ width: "62%", backgroundColor: accent }}>
        {data.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.coverImageUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: accent }} />
        <div className="absolute" style={{ top: pad * 0.45, left: pad * 0.45 }}>
          {senderLogoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={senderLogoUrl} alt="logo" className="object-contain" style={{ width: 100, height: 50 }} />
            : <div className="text-white font-bold tracking-widest rounded px-2 py-1" style={{ backgroundColor: "rgba(255,255,255,0.15)", fontSize: 9 }}>{senderName || "HALO BALLOON"}</div>
          }
        </div>
        <div className="absolute bottom-0 left-0 right-2" style={{ padding: pad * 0.45 }}>
          <div className="w-8 h-0.5 mb-2" style={{ backgroundColor: accent }} />
          <p className="text-white font-bold leading-tight mb-1.5" style={{ fontSize: 18 }}>{data.eventTitle || "Event Proposal"}</p>
          <p className="text-white/80" style={{ fontSize: 9 }}>Prepared for {data.leadName || "…"}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between bg-white" style={{ padding: pad * 0.45 }}>
        <div>
          <p className="font-bold tracking-widest mb-2" style={{ fontSize: 7, color: accent, letterSpacing: 3 }}>PROPOSAL</p>
          <div className="w-5 h-0.5 mb-3" style={{ backgroundColor: accent }} />
          <p className="font-bold text-slate-900 leading-snug mb-1" style={{ fontSize: 9 }}>{data.eventTitle || "Event Proposal"}</p>
          <p className="text-slate-500" style={{ fontSize: 7 }}>Prepared for: {data.leadName || "…"}</p>
          {data.leadPhone && <p className="text-slate-500 mt-0.5" style={{ fontSize: 7 }}>📞 {data.leadPhone}</p>}
        </div>
        {(data.selectedPackages ?? []).length > 0 && (
          <div className="rounded-lg px-2.5 py-2" style={{ backgroundColor: accentLight }}>
            <p className="font-bold tracking-widest mb-1.5" style={{ fontSize: 6, color: accent, letterSpacing: 2 }}>PACKAGES INCLUDED</p>
            {(data.selectedPackages ?? []).slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center gap-1.5 mb-1">
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: accent, fontSize: 5 }}>{i + 1}</div>
                <span className="text-slate-700 truncate flex-1" style={{ fontSize: 7 }}>{p.packageName}</span>
                <span className="font-bold flex-shrink-0" style={{ fontSize: 7, color: accent }}>{fmtPrice(p.price)}</span>
              </div>
            ))}
            {(data.selectedPackages ?? []).length > 5 && <p className="text-slate-400 mt-0.5" style={{ fontSize: 6 }}>+{(data.selectedPackages ?? []).length - 5} more…</p>}
          </div>
        )}
        <div>
          <div className="w-full h-px bg-slate-200 mb-2" />
          {senderLogoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={senderLogoUrl} alt="logo" className="object-contain" style={{ width: 60, height: 30 }} />
            : <p className="font-bold text-slate-800" style={{ fontSize: 8 }}>{senderName}</p>
          }
        </div>
      </div>
    </div>
  );
}

// ── Single Package ────────────────────────────────────────────────────────────

function SinglePackageSlide({ pkg, index, total, senderName, senderLogoUrl, accent, accentLight, pad }: {
  pkg: ProposalFormData["selectedPackages"][number]; index: number; total: number;
  senderName: string; senderLogoUrl?: string | null;
  accent: string; accentLight: string; pad: number;
}) {
  const displayImage = pkg.imageOverride || pkg.imageUrl;
  return (
    <div className="flex h-full">
      <div className="flex-shrink-0 relative h-full" style={{ width: "52%", backgroundColor: accentLight }}>
        {displayImage
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={displayImage} alt={pkg.packageName} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><span style={{ fontSize: 48, color: `${accent}30` }}>✦</span></div>
        }
        <div className="absolute text-white font-bold rounded"
          style={{ bottom: pad * 0.35, left: pad * 0.35, backgroundColor: accent, fontSize: 6, padding: "3px 7px", letterSpacing: 1 }}>
          {index + 1} / {total}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between bg-white" style={{ padding: pad * 0.45 }}>
        <div>
          <div className="flex justify-between items-center mb-3">
            {senderLogoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={senderLogoUrl} alt="logo" className="object-contain" style={{ width: 50, height: 25 }} />
              : <span className="text-slate-400 font-bold" style={{ fontSize: 6 }}>{senderName}</span>
            }
            <span className="font-bold tracking-widest" style={{ fontSize: 6, color: accent, letterSpacing: 2 }}>PACKAGE {index + 1}</span>
          </div>
          <div className="w-full h-px bg-slate-100 mb-3" />
          {pkg.isBestSeller && (
            <div className="inline-block rounded mb-2 px-1.5 py-0.5" style={{ backgroundColor: "#fef3c7", fontSize: 6 }}>
              <span className="font-bold text-amber-800">⭐ BEST SELLER</span>
            </div>
          )}
          <p className="font-bold text-slate-900 leading-snug mb-1" style={{ fontSize: 14 }}>{pkg.packageName}</p>
          {pkg.tagline && <p className="text-slate-500 italic mb-2" style={{ fontSize: 8 }}>{pkg.tagline}</p>}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-bold" style={{ fontSize: 20, color: accent }}>{fmtPrice(pkg.price)}</span>
            {pkg.originalPrice && <span className="line-through text-slate-400" style={{ fontSize: 9 }}>{fmtPrice(pkg.originalPrice)}</span>}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {(pkg.features ?? []).slice(0, 7).map((f, i) => (
            <div key={i} className="flex items-start gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: accent }} />
              <span className="text-slate-600 leading-snug" style={{ fontSize: 8 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Multi Package ─────────────────────────────────────────────────────────────

function MultiPackageSlide({ pkgs, pageIndex, senderName, senderLogoUrl, accent, accentLight, pad }: {
  pkgs: ProposalFormData["selectedPackages"]; pageIndex: number;
  senderName: string; senderLogoUrl?: string | null;
  accent: string; accentLight: string; pad: number;
}) {
  const cols = pkgs.length <= 3 ? pkgs.length : 3;
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#f8fafc" }}>
      <div className="flex items-center justify-between flex-shrink-0"
        style={{ backgroundColor: accent, height: 36, paddingInline: pad * 0.5 }}>
        {senderLogoUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={senderLogoUrl} alt="logo" className="object-contain" style={{ width: 60, height: 28 }} />
          : <span className="text-white font-bold" style={{ fontSize: 8 }}>{senderName}</span>
        }
        <span className="text-white/80 font-bold tracking-widest" style={{ fontSize: 6, letterSpacing: 2 }}>PACKAGES — PAGE {pageIndex + 1}</span>
      </div>
      <div className="flex-1 overflow-hidden" style={{ padding: pad * 0.35 }}>
        <div className="grid h-full gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {pkgs.map((pkg, i) => {
            const displayImage = pkg.imageOverride || pkg.imageUrl;
            return (
              <div key={i} className="bg-white rounded-lg overflow-hidden border border-slate-200 flex flex-col">
                {displayImage
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={displayImage} alt={pkg.packageName} className="w-full object-cover flex-shrink-0" style={{ height: pkgs.length <= 2 ? 120 : 80 }} />
                  : <div className="w-full flex items-center justify-center flex-shrink-0" style={{ height: pkgs.length <= 2 ? 120 : 80, backgroundColor: accentLight }}>
                      <span style={{ fontSize: 20, color: `${accent}40` }}>✦</span>
                    </div>
                }
                <div className="p-2 flex-1 flex flex-col">
                  {pkg.isBestSeller && (
                    <div className="inline-block rounded mb-1 px-1 py-0.5" style={{ backgroundColor: "#fef3c7", fontSize: 5 }}>
                      <span className="font-bold text-amber-800">⭐ BEST</span>
                    </div>
                  )}
                  <p className="font-bold text-slate-900 leading-tight mb-1" style={{ fontSize: 8 }}>{pkg.packageName}</p>
                  <p className="font-bold mb-1" style={{ fontSize: 10, color: accent }}>{fmtPrice(pkg.price)}</p>
                  {(pkg.features ?? []).slice(0, pkgs.length <= 2 ? 4 : 3).map((f, fi) => (
                    <div key={fi} className="flex items-start gap-1 mb-0.5">
                      <div className="w-1 h-1 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: accent }} />
                      <span className="text-slate-500 leading-tight" style={{ fontSize: 6 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center flex-shrink-0 bg-white border-t border-slate-200"
        style={{ height: 18, paddingInline: pad * 0.4 }}>
        <span className="text-slate-300" style={{ fontSize: 5 }}>{senderName}</span>
      </div>
    </div>
  );
}

// ── Add-ons ───────────────────────────────────────────────────────────────────

function AddOnsSlide({ data, senderName, senderLogoUrl, accent, accentLight, pad }: {
  data: Partial<ProposalFormData>; senderName: string; senderLogoUrl?: string | null;
  accent: string; accentLight: string; pad: number;
}) {
  const addOns = data.selectedAddOns ?? [];
  const cols = Math.min(4, addOns.length || 1);
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#f8fafc" }}>
      <div className="flex items-center justify-between flex-shrink-0"
        style={{ backgroundColor: accent, height: 36, paddingInline: pad * 0.5 }}>
        {senderLogoUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={senderLogoUrl} alt="logo" className="object-contain" style={{ width: 60, height: 28 }} />
          : <span className="text-white font-bold" style={{ fontSize: 8 }}>{senderName}</span>
        }
        <span className="text-white/80 font-bold tracking-widest" style={{ fontSize: 6, letterSpacing: 2 }}>OPTIONAL ADD-ONS</span>
      </div>
      <div className="flex-1 overflow-hidden" style={{ padding: pad * 0.35 }}>
        <div className="grid gap-2 h-full" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {addOns.map((ao, i) => (
            <div key={i} className="bg-white rounded-lg overflow-hidden border border-slate-200 flex flex-col">
              {ao.imageUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={ao.imageUrl} alt={ao.addOnName} className="w-full object-cover flex-shrink-0" style={{ height: 80 }} />
                : <div className="w-full flex items-center justify-center flex-shrink-0" style={{ height: 80, backgroundColor: accentLight }}>
                    <span style={{ fontSize: 16, color: `${accent}40` }}>✦</span>
                  </div>
              }
              <div className="p-1.5 border-t-2 flex-1" style={{ borderColor: accent }}>
                <p className="font-bold text-slate-800 leading-tight mb-0.5" style={{ fontSize: 7 }}>{ao.addOnName}</p>
                {(ao.priceLabel ?? ao.price) && (
                  <p className="font-bold" style={{ fontSize: 7, color: accent }}>
                    {ao.priceLabel ?? (ao.price != null ? fmtPrice(ao.price) : "")}
                  </p>
                )}
                {ao.quantity > 1 && <p className="text-slate-400" style={{ fontSize: 6 }}>Qty: {ao.quantity}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center flex-shrink-0 bg-white border-t border-slate-200"
        style={{ height: 18, paddingInline: pad * 0.4 }}>
        <span className="text-slate-300" style={{ fontSize: 5 }}>{senderName}</span>
      </div>
    </div>
  );
}

// ── Terms ─────────────────────────────────────────────────────────────────────

function TermsSlide({ data, senderName, senderLogoUrl, accent, accentLight, pad }: {
  data: Partial<ProposalFormData>; senderName: string; senderLogoUrl?: string | null;
  accent: string; accentLight: string; pad: number;
}) {
  return (
    <div className="flex h-full">
      <div className="flex-shrink-0 flex flex-col justify-between h-full"
        style={{ width: "28%", backgroundColor: accent, padding: pad * 0.45 }}>
        <div>
          {senderLogoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={senderLogoUrl} alt="logo" className="object-contain mb-4" style={{ width: "80%", height: 45 }} />
            : <p className="text-white font-bold mb-4" style={{ fontSize: 9 }}>{senderName || "HALO BALLOON"}</p>
          }
          <div className="w-6 h-0.5 mb-3" style={{ backgroundColor: "rgba(255,255,255,0.4)" }} />
          <p className="font-bold tracking-widest mb-2" style={{ fontSize: 5.5, color: "rgba(255,255,255,0.6)", letterSpacing: 2 }}>CONTACT US</p>
          <p className="text-white/80 leading-relaxed" style={{ fontSize: 7 }}>{senderName}</p>
        </div>
        <p className="text-white/40 truncate" style={{ fontSize: 6 }}>{data.eventTitle}</p>
      </div>
      <div className="flex-1 bg-white flex flex-col" style={{ padding: pad * 0.45 }}>
        <p className="font-bold tracking-widest mb-2" style={{ fontSize: 7, color: accent, letterSpacing: 3 }}>TERMS & CONDITIONS</p>
        <div className="w-8 h-0.5 mb-3" style={{ backgroundColor: accent }} />
        {data.termsText
          ? <p className="text-slate-500 leading-relaxed whitespace-pre-wrap overflow-hidden" style={{ fontSize: 8 }}>{data.termsText}</p>
          : <p className="text-slate-300 italic" style={{ fontSize: 8 }}>Payment terms will appear here.</p>
        }
        <div className="mt-auto rounded-lg p-3 text-center" style={{ backgroundColor: accentLight }}>
          <p className="font-bold mb-0.5" style={{ fontSize: 9, color: accent }}>Thank you for choosing us! 🎈</p>
          <p className="text-slate-500" style={{ fontSize: 7 }}>We look forward to making your event beautiful.</p>
        </div>
      </div>
    </div>
  );
}

// ── Main ProposalPreview ──────────────────────────────────────────────────────

interface ProposalPreviewProps {
  data: Partial<ProposalFormData>;
  senderName: string;
  senderLogoUrl?: string | null;
}

export function ProposalPreview({ data, senderName, senderLogoUrl }: ProposalPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [currentSlide, setCurrentSlide] = useState(0);

  const BASE_W = 842;
  const BASE_H = 595;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      setScale(Math.min(width / BASE_W, (height - 8) / BASE_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const creativity = data.creativity ?? 50;
  const elegance = data.elegance ?? 50;
  const accent = getAccent(creativity);
  const accentLight = getAccentLight(creativity);
  const pad = getPad(elegance);
  const pagesCount = data.pagesCount ?? 1;
  const selectedPkgs = data.selectedPackages ?? [];
  const pkgsPerPage = Math.ceil(selectedPkgs.length / Math.max(pagesCount, 1));

  type Slide = { key: string; label: string; el: React.ReactNode };
  const slides: Slide[] = [];

  slides.push({ key: "cover", label: "Cover",
    el: <CoverSlide data={data} senderName={senderName} senderLogoUrl={senderLogoUrl}
          accent={accent} accentLight={accentLight} pad={pad} /> });

  for (let p = 0; p < pagesCount; p++) {
    const slice = selectedPkgs.slice(p * pkgsPerPage, (p + 1) * pkgsPerPage);
    if (slice.length === 0) continue;
    if (pkgsPerPage === 1) {
      slides.push({ key: `pkg-${p}`, label: `Package ${p + 1}`,
        el: <SinglePackageSlide pkg={slice[0]} index={p} total={pagesCount}
              senderName={senderName} senderLogoUrl={senderLogoUrl}
              accent={accent} accentLight={accentLight} pad={pad} /> });
    } else {
      slides.push({ key: `pkgs-${p}`, label: `Packages ${p + 1}`,
        el: <MultiPackageSlide pkgs={slice} pageIndex={p}
              senderName={senderName} senderLogoUrl={senderLogoUrl}
              accent={accent} accentLight={accentLight} pad={pad} /> });
    }
  }

  if ((data.addOnsEnabled ?? false) && (data.selectedAddOns ?? []).length > 0) {
    slides.push({ key: "addons", label: "Add-Ons",
      el: <AddOnsSlide data={data} senderName={senderName} senderLogoUrl={senderLogoUrl}
            accent={accent} accentLight={accentLight} pad={pad} /> });
  }

  slides.push({ key: "terms", label: "Terms",
    el: <TermsSlide data={data} senderName={senderName} senderLogoUrl={senderLogoUrl}
          accent={accent} accentLight={accentLight} pad={pad} /> });

  const safeSlide = Math.min(currentSlide, slides.length - 1);

  return (
    <div className="flex flex-col h-full">
      <div className="flex overflow-x-auto gap-1 px-3 py-2 bg-surface-100 border-b border-surface-200 shrink-0">
        {slides.map((s, i) => (
          <button key={s.key} type="button" onClick={() => setCurrentSlide(i)}
            className={`text-xs px-2.5 py-1 rounded-md whitespace-nowrap transition-colors font-medium shrink-0 ${
              i === safeSlide ? "bg-white text-surface-900 shadow-sm" : "text-surface-500 hover:text-surface-700"
            }`}>
            {s.label}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="flex-1 flex items-center justify-center bg-surface-200 overflow-hidden">
        <div style={{
          width: BASE_W, height: BASE_H,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        }}>
          {slides[safeSlide]?.el}
        </div>
      </div>
    </div>
  );
}
