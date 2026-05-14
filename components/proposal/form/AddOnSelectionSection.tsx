"use client";

import { useState } from "react";
import { useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { cn } from "@/lib/utils/cn";
import { createAddOnAction } from "@/actions/catalog";
import type { ProposalFormData, CatalogAddOnData, ProposalAddOnFormItem } from "@/types/proposal";

interface AddOnSelectionSectionProps {
  form: UseFormReturn<ProposalFormData>;
  addOns: CatalogAddOnData[];
}

// ── Create Add-On Dialog ──────────────────────────────────────────────────────

function CreateAddOnDialog({
  onCreated,
  onClose,
}: {
  onCreated: (ao: CatalogAddOnData) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [priceRm, setPriceRm] = useState("");
  const [unit, setUnit] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) { toast.error("Add-on name is required"); return; }
    setSaving(true);
    const result = await createAddOnAction({
      name: name.trim(),
      priceRm: priceRm ? Number(priceRm) : null,
      unit: unit.trim() || null,
      imageUrl,
    });
    setSaving(false);
    if ("error" in result && result.error) { toast.error(result.error); return; }
    toast.success("Add-on created");
    onCreated(result.data!);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-900">New Add-On</h3>
          <button type="button" onClick={onClose} className="text-surface-400 hover:text-surface-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <ImageUploadField label="Photo" value={imageUrl} onChange={setImageUrl} previewHeight="h-32" />
          <div className="space-y-1.5">
            <Label htmlFor="ao-name" required>Name</Label>
            <Input id="ao-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Flower Bouquet" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ao-price">Price (RM) <span className="text-surface-400 font-normal">optional</span></Label>
              <Input id="ao-price" type="number" min="0" step="1" value={priceRm} onChange={(e) => setPriceRm(e.target.value)} placeholder="e.g. 20" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ao-unit">Unit <span className="text-surface-400 font-normal">optional</span></Label>
              <Input id="ao-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. pcs, set" />
            </div>
          </div>
          <p className="text-xs text-surface-400 -mt-2">Label: RM{priceRm || "X"}{unit ? `/${unit}` : ""}</p>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-surface-100">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="button" className="flex-1" loading={saving} onClick={handleCreate}>Create Add-On</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AddOnSelectionSection({ form, addOns: initialAddOns }: AddOnSelectionSectionProps) {
  const router = useRouter();
  const { setValue } = form;
  const [localAddOns, setLocalAddOns] = useState<CatalogAddOnData[]>(initialAddOns);
  const [showCreate, setShowCreate] = useState(false);
  const selectedAddOns = useWatch({ control: form.control, name: "selectedAddOns" }) ?? [];

  function isSelected(id: string) {
    return selectedAddOns.some((a) => a.catalogAddOnId === id);
  }

  function toggleAddOn(ao: CatalogAddOnData) {
    if (isSelected(ao.id)) {
      setValue("selectedAddOns", selectedAddOns.filter((a) => a.catalogAddOnId !== ao.id), { shouldDirty: true });
    } else {
      const newItem: ProposalAddOnFormItem = {
        catalogAddOnId: ao.id,
        addOnName: ao.name,
        price: ao.price,
        priceLabel: ao.priceLabel,
        imageUrl: ao.imageUrl,
        sortOrder: selectedAddOns.length,
      };
      setValue("selectedAddOns", [...selectedAddOns, newItem], { shouldDirty: true });
    }
  }

  function handleCreated(ao: CatalogAddOnData) {
    setLocalAddOns((prev) => [...prev, ao]);
    router.refresh();
  }

  function displayPrice(ao: CatalogAddOnData) {
    if (ao.priceLabel) return ao.priceLabel;
    if (ao.price != null) {
      const rm = (ao.price / 100).toFixed(0);
      return ao.unit ? `RM${rm}/${ao.unit}` : `RM${rm}`;
    }
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {localAddOns.map((ao) => {
          const selected = isSelected(ao.id);
          const price = displayPrice(ao);
          return (
            <div
              key={ao.id}
              onClick={() => toggleAddOn(ao)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                selected
                  ? "border-brand-400 bg-brand-50/30 shadow-sm"
                  : "border-surface-200 bg-white hover:border-surface-300"
              )}
            >
              <div className={cn(
                "mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center",
                selected ? "border-brand-600 bg-brand-600" : "border-surface-300"
              )}>
                {selected && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              {ao.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ao.imageUrl} alt={ao.name} className="w-12 h-12 rounded-lg object-contain flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg text-brand-200">✦</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate">{ao.name}</p>
                {price && <p className="text-xs text-brand-600 font-medium mt-0.5">{price}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
      >
        <Plus className="w-3.5 h-3.5" />
        Create custom add-on
      </button>

      {showCreate && (
        <CreateAddOnDialog onCreated={handleCreated} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
