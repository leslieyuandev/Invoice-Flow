"use client";

import { useState } from "react";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, ChevronDown, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineItemRow } from "./LineItemRow";
import { LineItemDialog } from "./LineItemDialog";
import { TemplatePicker } from "./TemplatePicker";
import { useLineItemDrag } from "@/hooks/useLineItemDrag";
import { centsToDollars } from "@/lib/utils/calculations";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { InvoiceFormData, LineItemFormData } from "@/types";
import type { LineItemTemplate } from "@prisma/client";

interface LineItemsTableProps {
  form: UseFormReturn<InvoiceFormData>;
  lineItemAmounts: number[];
  currency: string;
  templates?: LineItemTemplate[];
}

export function LineItemsTable({ form, lineItemAmounts, currency, templates = [] }: LineItemsTableProps) {
  const { control, formState: { errors } } = form;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const { t } = useTranslation();

  const { fields, append, remove, move, update } = useFieldArray({
    control,
    name: "lineItems",
  });

  const { handleDragStart, handleDragEnd } = useLineItemDrag(fields, move);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleOpenAdd() {
    setEditIndex(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(index: number) {
    setEditIndex(index);
    setDialogOpen(true);
  }

  function handleSave(item: Omit<LineItemFormData, "amount">) {
    const fullItem = { ...item, amount: item.quantity * item.unitPrice };
    if (editIndex !== null) {
      update(editIndex, fullItem);
    } else {
      append(fullItem);
    }
  }

  const editingItem = editIndex !== null ? fields[editIndex] : undefined;

  // lineItems array-level error (from .min(1) rule)
  const lineItemsError = (errors.lineItems as { message?: string } | undefined)?.message
    ?? (errors.lineItems as { root?: { message?: string } } | undefined)?.root?.message;

  return (
    <div className="space-y-1">
      {/* Column headers — hidden on mobile */}
      {fields.length > 0 && (
        <div className="hidden md:grid grid-cols-[auto_3fr_1fr_1.5fr_1.5fr_auto] gap-2 px-1">
          <div className="w-4" />
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("lineItems.description")}</span>
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("lineItems.qty")}</span>
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("lineItems.unitPrice")}</span>
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide text-right">{t("lineItems.amount")}</span>
          <div className="w-14" />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {fields.map((field, index) => (
            <LineItemRow
              key={field.id}
              fieldId={field.id}
              description={field.description}
              notes={field.notes}
              quantity={field.quantity}
              unitPrice={field.unitPrice}
              amount={lineItemAmounts[index] ?? 0}
              currency={currency}
              onEdit={() => handleOpenEdit(index)}
              onRemove={() => remove(index)}
              isOnly={false}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Empty state */}
      {fields.length === 0 && (
        <div className={`flex flex-col items-center justify-center py-8 rounded-lg border border-dashed gap-2 ${lineItemsError ? "border-red-300 bg-red-50" : "border-surface-200"}`}>
          <PackageOpen className={`w-8 h-8 ${lineItemsError ? "text-red-300" : "text-surface-300"}`} />
          <p className={`text-sm font-medium ${lineItemsError ? "text-red-500" : "text-surface-400"}`}>
            {lineItemsError ?? "Empty Items"}
          </p>
          <p className="text-xs text-surface-400">Use the button below to add a line item</p>
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="flex-1 border border-dashed border-surface-200 text-surface-500 hover:text-surface-700 hover:border-surface-300"
          onClick={handleOpenAdd}
        >
          <Plus className="w-4 h-4" />
          {t("lineItems.addLineItem")}
        </Button>
        {templates.length > 0 && (
          <Button
            type="button"
            size="sm"
            className="bg-brand-600 hover:bg-brand-700 text-white shrink-0"
            onClick={() => setPickerOpen(true)}
          >
            <ChevronDown className="w-4 h-4" />
            Select
          </Button>
        )}
      </div>

      <LineItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialValues={editingItem}
      />

      <TemplatePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        templates={templates}
        onSelect={(tmpl) => {
          setEditIndex(null);
          setDialogOpen(false);
          append({
            description: tmpl.name,
            notes: tmpl.description || undefined,
            quantity: 1,
            unitPrice: centsToDollars(tmpl.unitPrice),
            amount: 0,
          });
        }}
      />
    </div>
  );
}
