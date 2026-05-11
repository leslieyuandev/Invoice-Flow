"use client";

import { type UseFormReturn } from "react-hook-form";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/calculations";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { InvoiceFormData } from "@/types";

interface LineItemRowProps {
  form: UseFormReturn<InvoiceFormData>;
  index: number;
  fieldId: string;
  amount: number;
  currency: string;
  onRemove: () => void;
  isOnly: boolean;
}

export function LineItemRow({ form, index, fieldId, amount, currency, onRemove, isOnly }: LineItemRowProps) {
  const { register, formState: { errors } } = form;
  const rowErrors = errors.lineItems?.[index];
  const { t } = useTranslation();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        // Mobile: 3-col [drag | description+subitems | delete]
        // Desktop: 6-col flat grid (same as column headers)
        "grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_3fr_1fr_1.5fr_1.5fr_auto] gap-2 items-start py-2 px-1 rounded-lg transition-all",
        isDragging ? "opacity-50 bg-surface-50 shadow-card-lg z-50" : "hover:bg-surface-50"
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="mt-2 cursor-grab active:cursor-grabbing text-surface-300 hover:text-surface-500 touch-none"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* On mobile: flex-col block in the 1fr middle column.
          On desktop: display:contents so children become direct grid cells. */}
      <div className="flex flex-col gap-2 md:contents">
        {/* Description — full width on mobile, own grid cell on desktop */}
        <Input
          {...register(`lineItems.${index}.description`)}
          placeholder={t("lineItems.descriptionPlaceholder")}
          error={rowErrors?.description?.message}
        />

        {/* On mobile: 3-col sub-row for qty, price, amount.
            On desktop: display:contents exposes children as separate grid cells. */}
        <div className="grid grid-cols-3 gap-2 md:contents">
          {/* Qty */}
          <div>
            <p className="text-[10px] text-surface-400 mb-0.5 md:hidden">{t("lineItems.qty")}</p>
            <Input
              type="number"
              step="0.001"
              min="0"
              {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
              placeholder="1"
              error={rowErrors?.quantity?.message}
            />
          </div>

          {/* Unit price */}
          <div>
            <p className="text-[10px] text-surface-400 mb-0.5 md:hidden">{t("lineItems.unitPrice")}</p>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })}
              placeholder="0.00"
              error={rowErrors?.unitPrice?.message}
            />
          </div>

          {/* Amount (read-only) */}
          <div className="flex flex-col items-end md:flex-row md:items-center md:justify-end md:mt-1">
            <p className="text-[10px] text-surface-400 mb-0.5 md:hidden">{t("lineItems.amount")}</p>
            <span className="text-sm font-medium tabular-nums text-surface-700">
              {formatCurrency(amount, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        disabled={isOnly}
        aria-label="Remove line item"
        className={cn(
          "mt-1.5 p-1.5 rounded-md transition-colors",
          isOnly
            ? "text-surface-200 cursor-not-allowed"
            : "text-surface-400 hover:text-red-500 hover:bg-red-50"
        )}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
