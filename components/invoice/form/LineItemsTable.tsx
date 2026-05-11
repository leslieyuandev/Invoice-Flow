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
import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineItemRow } from "./LineItemRow";
import { TemplatePicker } from "./TemplatePicker";
import { useLineItemDrag } from "@/hooks/useLineItemDrag";
import { centsToDollars } from "@/lib/utils/calculations";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { InvoiceFormData } from "@/types";
import type { LineItemTemplate } from "@prisma/client";

interface LineItemsTableProps {
  form: UseFormReturn<InvoiceFormData>;
  lineItemAmounts: number[];
  currency: string;
  templates?: LineItemTemplate[];
}

export function LineItemsTable({ form, lineItemAmounts, currency, templates = [] }: LineItemsTableProps) {
  const { control } = form;
  const [pickerOpen, setPickerOpen] = useState(false);
  const { t } = useTranslation();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "lineItems",
  });

  const { activeId, handleDragStart, handleDragEnd } = useLineItemDrag(fields, move);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div className="space-y-1">
      {/* Column headers — hidden on mobile */}
      <div className="hidden md:grid grid-cols-[auto_3fr_1fr_1.5fr_1.5fr_auto] gap-2 px-1">
        <div className="w-4" />
        <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("lineItems.description")}</span>
        <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("lineItems.qty")}</span>
        <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("lineItems.unitPrice")}</span>
        <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide text-right">{t("lineItems.amount")}</span>
        <div className="w-7" />
      </div>

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
              form={form}
              index={index}
              fieldId={field.id}
              amount={lineItemAmounts[index] ?? 0}
              currency={currency}
              onRemove={() => remove(index)}
              isOnly={fields.length === 1}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex gap-2 mt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="flex-1 border border-dashed border-surface-200 text-surface-500 hover:text-surface-700 hover:border-surface-300"
          onClick={() => append({ description: "", quantity: 1, unitPrice: 0, amount: 0 })}
        >
          <Plus className="w-4 h-4" />
          {t("lineItems.addLineItem")}
        </Button>
        {templates.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="border border-dashed border-surface-200 text-surface-500 hover:text-surface-700 hover:border-surface-300"
            onClick={() => setPickerOpen(true)}
          >
            <BookOpen className="w-4 h-4" />
            {t("lineItems.useTemplate")}
          </Button>
        )}
      </div>

      <TemplatePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        templates={templates}
        onSelect={(t) => append({
          description: t.name,
          quantity: 1,
          unitPrice: centsToDollars(t.unitPrice),
          amount: 0,
        })}
      />
    </div>
  );
}
