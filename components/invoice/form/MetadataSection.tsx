"use client";

import { type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPPORTED_CURRENCIES } from "@/lib/utils/currency";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { InvoiceFormData } from "@/types";

interface MetadataSectionProps {
  form: UseFormReturn<InvoiceFormData>;
  defaultPaymentTerms?: number;
  showDueDate?: boolean;
}

export function MetadataSection({ form, defaultPaymentTerms = 30, showDueDate = true }: MetadataSectionProps) {
  const { register, formState: { errors } } = form;
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5">
        <Label required>{t("metadata.invoiceNumber")}</Label>
        <Input
          {...register("invoiceNumber")}
          placeholder="INV-2025-001"
          error={errors.invoiceNumber?.message}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label required>{t("metadata.currency")}</Label>
        <select
          {...register("currency")}
          className="flex h-9 w-full rounded-md border border-surface-200 bg-white px-3 py-1 text-sm text-surface-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
          ))}
        </select>
      </div>

      <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
        <Label required>{t("metadata.issueDate")}</Label>
        <Input
          type="date"
          {...register("issueDate")}
          error={errors.issueDate?.message}
        />
      </div>

      {showDueDate && (
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
          <Label required>{t("metadata.dueDate")}</Label>
          <Input
            type="date"
            {...register("dueDate")}
            error={errors.dueDate?.message}
          />
          <p className="text-xs text-surface-400">
            {t("metadata.dueDate.hint").replace("{n}", String(defaultPaymentTerms))}
          </p>
        </div>
      )}
    </div>
  );
}
