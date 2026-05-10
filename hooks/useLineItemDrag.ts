import { useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { UseFieldArrayReturn } from "react-hook-form";
import type { InvoiceFormData } from "@/types";

export function useLineItemDrag(
  fields: UseFieldArrayReturn<InvoiceFormData, "lineItems">["fields"],
  move: UseFieldArrayReturn<InvoiceFormData, "lineItems">["move"]
) {
  const [activeId, setActiveId] = useState<string | null>(null);

  function handleDragStart(event: { active: { id: string | number } }) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) move(oldIndex, newIndex);
  }

  return { activeId, handleDragStart, handleDragEnd };
}
