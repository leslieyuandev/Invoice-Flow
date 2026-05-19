"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
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
  const [notes, setNotes] = useState(initialValues?.notes ?? "");

  useEffect(() => {
    if (open) {
      formRef.current?.reset();
      setNotes(initialValues?.notes ?? "");
    }
  }, [open, initialValues?.notes]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const description = (fd.get("description") as string).trim();
    const quantity = parseFloat(fd.get("quantity") as string) || 1;
    const unitPrice = parseFloat(fd.get("unitPrice") as string) || 0;
    onSave({ id: initialValues?.id, description, notes: notes || undefined, quantity, unitPrice });
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
            <Label>{t("lineItems.itemNotes")}</Label>
            <RichTextEditor
              value={notes}
              onChange={setNotes}
              placeholder={t("lineItems.itemNotesPlaceholder")}
              minHeight="100px"
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
