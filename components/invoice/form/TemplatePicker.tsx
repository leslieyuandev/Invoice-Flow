"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { centsToDollars } from "@/lib/utils/calculations";
import type { LineItemTemplate } from "@prisma/client";

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
  templates: LineItemTemplate[];
  onSelect: (template: LineItemTemplate) => void;
}

export function TemplatePicker({ open, onClose, templates, onSelect }: TemplatePickerProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Select Template">
        <div className="mt-2 space-y-1 max-h-80 overflow-y-auto">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { onSelect(t); onClose(); }}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-brand-50 hover:text-brand-800 transition-colors border border-transparent hover:border-brand-100"
            >
              <p className="text-sm font-medium text-surface-900">{t.name}</p>
              <p className="text-xs text-surface-500 mt-0.5 flex items-center justify-between">
                <span>{t.description}</span>
                <span className="font-medium">MYR {centsToDollars(t.unitPrice).toFixed(2)}</span>
              </p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
