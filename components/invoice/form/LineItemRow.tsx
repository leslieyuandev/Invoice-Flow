"use client";

import { type UseFormReturn } from "react-hook-form";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency, centsToDollars } from "@/lib/utils/calculations";
import { cn } from "@/lib/utils/cn";
import type { InvoiceFormData } from "@/types";

interface LineItemRowProps {
  form: UseFormReturn<InvoiceFormData>;
  index: number;
  fieldId: string;
  amount: number; // in cents, calculated by hook
  currency: string;
  onRemove: () => void;
  isOnly: boolean;
}

export function LineItemRow({ form, index, fieldId, amount, currency, onRemove, isOnly }: LineItemRowProps) {
  const { register, formState: { errors } } = form;
  const rowErrors = errors.lineItems?.[index];

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
        "grid grid-cols-[auto_1fr_80px_100px_80px_auto] gap-2 items-start py-2 px-1 rounded-lg transition-all",
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

      {/* Description */}
      <Input
        {...register(`lineItems.${index}.description`)}
        placeholder="Service or product description"
        error={rowErrors?.description?.message}
      />

      {/* Qty */}
      <Input
        type="number"
        step="0.001"
        min="0"
        {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
        placeholder="1"
        error={rowErrors?.quantity?.message}
      />

      {/* Unit price */}
      <Input
        type="number"
        step="0.01"
        min="0"
        {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })}
        placeholder="0.00"
        error={rowErrors?.unitPrice?.message}
      />

      {/* Amount (read-only) */}
      <div className="flex items-center justify-end mt-1">
        <span className="text-sm font-medium tabular-nums text-surface-700">
          {formatCurrency(amount, currency)}
        </span>
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
