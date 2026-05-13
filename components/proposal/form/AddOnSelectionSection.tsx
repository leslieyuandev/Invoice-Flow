"use client";

import { useWatch } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { ProposalFormData, CatalogAddOnData, ProposalAddOnFormItem } from "@/types/proposal";

interface AddOnSelectionSectionProps {
  form: UseFormReturn<ProposalFormData>;
  addOns: CatalogAddOnData[];
}

export function AddOnSelectionSection({ form, addOns }: AddOnSelectionSectionProps) {
  const { t } = useTranslation();
  const { setValue } = form;
  const selectedAddOns = useWatch({ control: form.control, name: "selectedAddOns" }) ?? [];

  function isSelected(id: string) {
    return selectedAddOns.some((a) => a.catalogAddOnId === id);
  }

  function toggleAddOn(ao: CatalogAddOnData) {
    const current = selectedAddOns ?? [];
    if (isSelected(ao.id)) {
      setValue("selectedAddOns", current.filter((a) => a.catalogAddOnId !== ao.id), { shouldDirty: true });
    } else {
      const newItem: ProposalAddOnFormItem = {
        catalogAddOnId: ao.id,
        addOnName: ao.name,
        price: ao.price,
        priceLabel: ao.priceLabel,
        imageUrl: ao.imageUrl,
        quantity: 1,
        sortOrder: current.length,
      };
      setValue("selectedAddOns", [...current, newItem], { shouldDirty: true });
    }
  }

  function updateQuantity(id: string, delta: number) {
    const current = selectedAddOns ?? [];
    const updated = current.map((a) => {
      if (a.catalogAddOnId !== id) return a;
      return { ...a, quantity: Math.max(1, a.quantity + delta) };
    });
    setValue("selectedAddOns", updated, { shouldDirty: true });
  }

  if (addOns.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {addOns.map((ao) => {
        const selected = isSelected(ao.id);
        const item = selectedAddOns.find((a) => a.catalogAddOnId === ao.id);

        return (
          <div
            key={ao.id}
            className={cn(
              "border rounded-lg p-3 cursor-pointer transition-all",
              selected
                ? "border-brand-500 bg-brand-50 shadow-sm"
                : "border-surface-200 hover:border-brand-300 bg-white"
            )}
            onClick={() => toggleAddOn(ao)}
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

              <div className="flex-1">
                <p className="text-sm font-medium text-surface-900">{ao.name}</p>
                {(ao.priceLabel ?? ao.price) && (
                  <p className="text-xs text-brand-600 font-medium mt-0.5">
                    {ao.priceLabel ?? (ao.price != null ? `RM ${(ao.price / 100).toFixed(2)}` : "")}
                  </p>
                )}
              </div>
            </div>

            {/* Quantity stepper */}
            {selected && item && (
              <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => updateQuantity(ao.id, -1)}
                  disabled={item.quantity <= 1}
                  className="w-6 h-6 rounded-full border border-surface-200 flex items-center justify-center text-surface-600 hover:bg-surface-100 disabled:opacity-40 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(ao.id, 1)}
                  className="w-6 h-6 rounded-full border border-surface-200 flex items-center justify-center text-surface-600 hover:bg-surface-100 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
