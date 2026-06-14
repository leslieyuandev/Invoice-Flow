"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils/calculations";
import { cn } from "@/lib/utils/cn";

interface LineItemRowProps {
  fieldId: string;
  description: string;
  notes?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  currency: string;
  onEdit: () => void;
  onRemove: () => void;
  isOnly: boolean;
}

export function LineItemRow({
  fieldId,
  description,
  notes,
  quantity,
  unitPrice,
  amount,
  currency,
  onEdit,
  onRemove,
  isOnly,
}: LineItemRowProps) {
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

      {/* Description + notes — flex-col on mobile, contents on desktop */}
      <div className="flex flex-col gap-2 md:contents min-w-0">
        {/* Item name (bold) + notes */}
        <div className="min-w-0">
          <p
            className="text-sm font-semibold text-surface-900 truncate cursor-pointer hover:text-brand-600 transition-colors"
            onClick={onEdit}
            title="Click to edit"
          >
            {description || <span className="text-surface-400 font-normal italic">Unnamed item</span>}
          </p>
          {notes && (
            <div
              className="text-xs text-surface-500 mt-0.5 leading-relaxed line-clamp-3 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0 [&_p]:mb-0"
              dangerouslySetInnerHTML={{ __html: notes }}
            />
          )}
        </div>

        {/* Qty / price / amount sub-row on mobile */}
        <div className="flex items-start gap-3 md:contents text-sm">
          <div className="shrink-0">
            <p className="text-[10px] text-surface-400 mb-0.5 md:hidden">Qty</p>
            <span className="text-surface-700 tabular-nums">{quantity}</span>
          </div>
          <div className="shrink-0">
            <p className="text-[10px] text-surface-400 mb-0.5 md:hidden">Unit Price</p>
            <span className="text-surface-700 tabular-nums">{formatCurrency(Math.round(unitPrice * 100), currency)}</span>
          </div>
          <div className="ml-auto text-right md:flex md:flex-row md:items-center md:justify-end">
            <p className="text-[10px] text-surface-400 mb-0.5 md:hidden">Amt</p>
            <span className="font-medium tabular-nums text-surface-700">{formatCurrency(amount, currency)}</span>
          </div>
        </div>
      </div>

      {/* Edit + Delete */}
      <div className="flex items-center gap-0.5 mt-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit line item"
          className="p-1.5 rounded-md text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={isOnly}
          aria-label="Remove line item"
          className={cn(
            "p-1.5 rounded-md transition-colors",
            isOnly ? "text-surface-200 cursor-not-allowed" : "text-surface-400 hover:text-red-500 hover:bg-red-50"
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
