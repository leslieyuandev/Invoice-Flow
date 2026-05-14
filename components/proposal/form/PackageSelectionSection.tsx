"use client";

import { useState } from "react";
import { useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { cn } from "@/lib/utils/cn";
import { createPackageAction } from "@/actions/catalog";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { ProposalFormData, CatalogPackageData, CatalogCategoryTree } from "@/types/proposal";

interface PackageSelectionSectionProps {
  form: UseFormReturn<ProposalFormData>;
  packages: CatalogPackageData[];
  categoryTree: CatalogCategoryTree[];
}

function fmtPrice(cents: number) {
  return `RM ${(cents / 100).toFixed(0)}`;
}

// ── Create Package Dialog ─────────────────────────────────────────────────────

function CreatePackageDialog({
  categoryId,
  categoryName,
  onCreated,
  onClose,
}: {
  categoryId: string;
  categoryName: string;
  onCreated: (pkg: CatalogPackageData) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [priceRm, setPriceRm] = useState("");
  const [tagline, setTagline] = useState("");
  const [featuresText, setFeaturesText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) { toast.error("Package name is required"); return; }
    if (!priceRm || isNaN(Number(priceRm)) || Number(priceRm) < 0) {
      toast.error("Enter a valid price"); return;
    }
    setSaving(true);
    const result = await createPackageAction({
      categoryId,
      name: name.trim(),
      priceRm: Number(priceRm),
      tagline: tagline.trim() || null,
      features: featuresText.split("\n").map((l) => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean),
      imageUrl,
    });
    setSaving(false);
    if ("error" in result && result.error) { toast.error(result.error); return; }
    toast.success("Package created");
    onCreated(result.data!);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-900">New Package — {categoryName}</h3>
          <button type="button" onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <ImageUploadField label="Package Photo" value={imageUrl} onChange={setImageUrl} previewHeight="h-40" />
          <div className="space-y-1.5">
            <Label htmlFor="pkg-name" required>Package Name</Label>
            <Input id="pkg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Premium Package" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-tagline">Tagline <span className="text-surface-400 font-normal">(optional)</span></Label>
            <Input id="pkg-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. 锦上添花" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-price" required>Price (RM)</Label>
            <Input id="pkg-price" type="number" min="0" step="1" value={priceRm} onChange={(e) => setPriceRm(e.target.value)} placeholder="e.g. 488" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-features">Description / Features</Label>
            <p className="text-xs text-surface-400">One item per line.</p>
            <textarea
              id="pkg-features"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={5}
              placeholder={"12x Helium Balloons\n1x Balloon Arch\nSetup & teardown included"}
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
            />
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-surface-100">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="button" className="flex-1" loading={saving} onClick={handleCreate}>Create Package</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PackageSelectionSection({
  form,
  packages: initialPackages,
  categoryTree,
}: PackageSelectionSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { setValue } = form;
  const [localPackages, setLocalPackages] = useState<CatalogPackageData[]>(initialPackages);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const selectedCategoryId = useWatch({ control: form.control, name: "eventCategoryId" });
  const selectedPackages = useWatch({ control: form.control, name: "selectedPackages" }) ?? [];

  const filteredPackages = localPackages.filter((p) => p.categoryId === selectedCategoryId);
  const selectedIds = new Set(selectedPackages.map((p) => p.catalogPackageId));

  const allCats = categoryTree.flatMap((top) => [top, ...top.children]);
  const selectedCatName = allCats.find((c) => c.id === selectedCategoryId)?.name ?? "";

  function togglePackage(pkg: CatalogPackageData) {
    if (selectedIds.has(pkg.id)) {
      setValue(
        "selectedPackages",
        selectedPackages.filter((p) => p.catalogPackageId !== pkg.id),
        { shouldDirty: true }
      );
      if (expandedId === pkg.id) setExpandedId(null);
    } else {
      setValue(
        "selectedPackages",
        [
          ...selectedPackages,
          {
            catalogPackageId: pkg.id,
            packageName: pkg.name,
            tagline: pkg.tagline,
            price: pkg.price,
            originalPrice: pkg.originalPrice,
            imageUrl: pkg.imageUrl,
            imageOverride: "",
            isBestSeller: pkg.isBestSeller,
            features: pkg.features,
            sortOrder: selectedPackages.length,
          },
        ],
        { shouldDirty: true }
      );
      setExpandedId(pkg.id);
    }
  }

  function updateFormItem<K extends keyof typeof selectedPackages[0]>(
    catalogPackageId: string,
    key: K,
    value: typeof selectedPackages[0][K]
  ) {
    setValue(
      "selectedPackages",
      selectedPackages.map((p) =>
        p.catalogPackageId === catalogPackageId ? { ...p, [key]: value } : p
      ),
      { shouldDirty: true }
    );
  }

  function handleCreated(pkg: CatalogPackageData) {
    setLocalPackages((prev) => [...prev, pkg]);
    router.refresh();
  }

  if (!selectedCategoryId) {
    return <p className="text-sm text-surface-400 italic">Select an event category above to see available packages.</p>;
  }

  return (
    <div className="space-y-3">
      {filteredPackages.length === 0 ? (
        <p className="text-sm text-surface-400 italic">{t("proposalBuilder.noPackages")}</p>
      ) : (
        <div className="space-y-3">
          {filteredPackages.map((pkg) => {
            const checked = selectedIds.has(pkg.id);
            const formItem = selectedPackages.find((p) => p.catalogPackageId === pkg.id);
            const displayImage = formItem?.imageOverride || pkg.imageUrl;
            const isExpanded = expandedId === pkg.id;

            return (
              <div
                key={pkg.id}
                className={cn(
                  "rounded-xl border transition-all overflow-hidden",
                  checked
                    ? "border-brand-400 shadow-sm bg-brand-50/20"
                    : "border-surface-200 bg-white hover:border-surface-300"
                )}
              >
                {/* Card header — click to select/deselect */}
                <div
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  onClick={() => togglePackage(pkg)}
                >
                  <div className={cn(
                    "mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                    checked ? "bg-brand-600 border-brand-600" : "border-surface-300"
                  )}>
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {displayImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayImage} alt={pkg.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl text-brand-200">✦</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate">{formItem?.packageName ?? pkg.name}</p>
                    {(formItem?.tagline ?? pkg.tagline) && (
                      <p className="text-xs text-surface-500 truncate">{formItem?.tagline ?? pkg.tagline}</p>
                    )}
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-sm font-bold text-brand-600">{fmtPrice(formItem?.price ?? pkg.price)}</span>
                      {(formItem?.originalPrice ?? pkg.originalPrice) != null && (
                        <span className="text-xs text-surface-400 line-through">{fmtPrice(formItem?.originalPrice ?? pkg.originalPrice ?? 0)}</span>
                      )}
                    </div>
                  </div>

                  {checked && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : pkg.id); }}
                      className="text-surface-400 hover:text-surface-600 flex-shrink-0"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Editable fields when selected + expanded */}
                {checked && isExpanded && formItem && (
                  <div className="px-3 pb-4 space-y-3 border-t border-surface-100 pt-3" onClick={(e) => e.stopPropagation()}>
                    <ImageUploadField
                      label="Package Photo"
                      value={formItem.imageOverride || null}
                      onChange={(url) => updateFormItem(pkg.id, "imageOverride", url ?? "")}
                      previewHeight="h-32"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Package Title</Label>
                        <Input
                          value={formItem.packageName}
                          onChange={(e) => updateFormItem(pkg.id, "packageName", e.target.value)}
                          placeholder="Package name"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tagline <span className="text-surface-400">(optional)</span></Label>
                        <Input
                          value={formItem.tagline ?? ""}
                          onChange={(e) => updateFormItem(pkg.id, "tagline", e.target.value || null)}
                          placeholder="e.g. 锦上添花"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Price (RM)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={(formItem.price / 100).toFixed(0)}
                          onChange={(e) => updateFormItem(pkg.id, "price", Math.round(Number(e.target.value) * 100))}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Original / Discount Price (RM) <span className="text-surface-400">optional</span></Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={formItem.originalPrice != null ? (formItem.originalPrice / 100).toFixed(0) : ""}
                          onChange={(e) => updateFormItem(pkg.id, "originalPrice", e.target.value ? Math.round(Number(e.target.value) * 100) : null)}
                          placeholder="e.g. 1288"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description / Features <span className="text-surface-400">(one per line)</span></Label>
                      <textarea
                        value={formItem.features.join("\n")}
                        onChange={(e) =>
                          updateFormItem(
                            pkg.id,
                            "features",
                            e.target.value.split("\n").map((l) => l.trim()).filter(Boolean)
                          )
                        }
                        rows={4}
                        className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
                        placeholder={"12x Helium Balloons\n1x Balloon Arch\nSetup & teardown included"}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium mt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Create custom package{selectedCatName ? ` for ${selectedCatName}` : ""}
      </button>

      {showCreate && selectedCategoryId && (
        <CreatePackageDialog
          categoryId={selectedCategoryId}
          categoryName={selectedCatName}
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
