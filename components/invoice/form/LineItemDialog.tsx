"use client";

import { useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { LineItemFormData } from "@/types";

interface LineItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: Omit<LineItemFormData, "amount">) => void;
  initialValues?: Partial<LineItemFormData>;
}

export function LineItemDialog({ open, onClose, onSave, initialValues }: LineItemDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(initialValues?.description);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) formRef.current?.reset();
  }, [open]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const description = (fd.get("description") as string).trim();
    const notes = (fd.get("notes") as string).trim() || undefined;
    const quantity = parseFloat(fd.get("quantity") as string) || 1;
    const unitPrice = parseFloat(fd.get("unitPrice") as string) || 0;
    onSave({ id: initialValues?.id, description, notes, quantity, unitPrice });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={isEdit ? t("lineItems.editItem") : t("lineItems.addLineItem")}>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="li-description" required>{t("lineItems.itemName")}</Label>
            <Input
              id="li-description"
              name="description"
              required
              defaultValue={initialValues?.description ?? ""}
              placeholder={t("lineItems.itemNamePlaceholder")}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="li-notes">{t("lineItems.itemNotes")}</Label>
            <textarea
              id="li-notes"
              name="notes"
              rows={4}
              defaultValue={initialValues?.notes ?? ""}
              placeholder={t("lineItems.itemNotesPlaceholder")}
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="li-quantity" required>{t("lineItems.qty")}</Label>
              <Input
                id="li-quantity"
                name="quantity"
                type="number"
                step="0.001"
                min="0"
                required
                defaultValue={initialValues?.quantity ?? 1}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="li-unitPrice" required>{t("lineItems.unitPrice")}</Label>
              <Input
                id="li-unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={initialValues?.unitPrice ?? ""}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {t("sendDialog.cancel")}
            </Button>
            <Button type="submit" size="sm">
              {isEdit ? t("builder.update") : t("lineItems.addLineItem")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
