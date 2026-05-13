"use client";

import { useState } from "react";
import { useWatch } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { ProposalFormData, CatalogPackageData, ProposalPackageFormItem } from "@/types/proposal";

interface PackageSelectionSectionProps {
  form: UseFormReturn<ProposalFormData>;
  packages: CatalogPackageData[];
}

function fmtPrice(cents: number) {
  return `RM ${(cents / 100).toFixed(2)}`;
}

export function PackageSelectionSection({ form, packages }: PackageSelectionSectionProps) {
  const { t } = useTranslation();
  const { setValue } = form;
  const selectedCategoryId = useWatch({ control: form.control, name: "eventCategoryId" });
  const selectedPackages = useWatch({ control: form.control, name: "selectedPackages" }) ?? [];
  const [photoOverrides, setPhotoOverrides] = useState<Record<string, string>>({});
  const [showPhotoInput, setShowPhotoInput] = useState<Record<string, boolean>>({});

  const filtered = packages.filter((p) => p.categoryId === selectedCategoryId);

  function isSelected(pkgId: string) {
    return selectedPackages.some((p) => p.catalogPackageId === pkgId);
  }

  function togglePackage(pkg: CatalogPackageData) {
    const current = selectedPackages ?? [];
    if (isSelected(pkg.id)) {
      setValue(
        "selectedPackages",
        current.filter((p) => p.catalogPackageId !== pkg.id),
        { shouldDirty: true }
      );
    } else {
      const newItem: ProposalPackageFormItem = {
        catalogPackageId: pkg.id,
        packageName: pkg.name,
        tagline: pkg.tagline,
        price: pkg.price,
        originalPrice: pkg.originalPrice,
        imageUrl: pkg.imageUrl,
        imageOverride: photoOverrides[pkg.id] ?? "",
        isBestSeller: pkg.isBestSeller,
        features: pkg.features,
        sortOrder: current.length,
      };
      setValue("selectedPackages", [...current, newItem], { shouldDirty: true });
    }
  }

  function handlePhotoOverride(pkgId: string, url: string) {
    setPhotoOverrides((prev) => ({ ...prev, [pkgId]: url }));
    const current = selectedPackages ?? [];
    const idx = current.findIndex((p) => p.catalogPackageId === pkgId);
    if (idx >= 0) {
      const updated = [...current];
      updated[idx] = { ...updated[idx], imageOverride: url };
      setValue("selectedPackages", updated, { shouldDirty: true });
    }
  }

  if (!selectedCategoryId) {
    return (
      <p className="text-sm text-surface-400">Select an event category first to see available packages.</p>
    );
  }

  if (filtered.length === 0) {
    return <p className="text-sm text-surface-400">{t("proposalBuilder.noPackages")}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {filtered.map((pkg) => {
        const selected = isSelected(pkg.id);
        return (
          <div
            key={pkg.id}
            className={cn(
              "border rounded-lg p-4 cursor-pointer transition-all",
              selected
                ? "border-brand-500 bg-brand-50 shadow-sm"
                : "border-surface-200 hover:border-brand-300 bg-white"
            )}
            onClick={() => togglePackage(pkg)}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                  selected ? "border-brand-600 bg-brand-600" : "border-surface-300"
                )}
              >
                {selected && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-surface-900 text-sm">{pkg.name}</span>
                  {pkg.isBestSeller && (
                    <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-2 py-0.5 font-medium">
                      {t("proposalBuilder.bestSeller")}
                    </span>
                  )}
                </div>

                {pkg.tagline && (
                  <p className="text-xs text-surface-500 mt-0.5">{pkg.tagline}</p>
                )}

                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="font-bold text-brand-600">{fmtPrice(pkg.price)}</span>
                  {pkg.originalPrice && (
                    <span className="text-xs text-surface-400 line-through">{fmtPrice(pkg.originalPrice)}</span>
                  )}
                </div>

                <ul className="mt-2 space-y-0.5">
                  {pkg.features.slice(0, 3).map((f, i) => (
                    <li key={i} className="text-xs text-surface-600 flex gap-1">
                      <span className="text-brand-400 shrink-0">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                  {pkg.features.length > 3 && (
                    <li className="text-xs text-surface-400">+{pkg.features.length - 3} more</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Photo override (shown only when selected) */}
            {selected && (
              <div className="mt-3 pt-3 border-t border-brand-200" onClick={(e) => e.stopPropagation()}>
                {showPhotoInput[pkg.id] ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-surface-600">{t("proposalBuilder.replacePhoto")}</label>
                    <input
                      type="url"
                      value={photoOverrides[pkg.id] ?? ""}
                      onChange={(e) => handlePhotoOverride(pkg.id, e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded border border-surface-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPhotoInput((prev) => ({ ...prev, [pkg.id]: true }))}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    + {t("proposalBuilder.replacePhoto")}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
