"use client";

import { type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, centsToDollars } from "@/lib/utils/calculations";
import type { InvoiceFormData, InvoiceFinancials } from "@/types";

interface FinancialSummaryProps {
  form: UseFormReturn<InvoiceFormData>;
  financials: InvoiceFinancials;
  currency: string;
}

export function FinancialSummary({ form, financials, currency }: FinancialSummaryProps) {
  const { register, watch } = form;
  const discountType = watch("discountType");
  const fmt = (cents: number) => formatCurrency(cents, currency);

  return (
    <div className="flex justify-end">
      <div className="w-full sm:w-72 space-y-3">
        {/* Tax */}
        <div className="flex items-center justify-between gap-3">
          <Label className="shrink-0">Tax Rate (%)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register("taxRate", { valueAsNumber: true })}
            placeholder="0"
            className="w-24 text-right"
          />
        </div>

        {/* Discount */}
        <div className="flex items-center justify-between gap-3">
          <Label className="shrink-0">Discount</Label>
          <div className="flex gap-2 items-center">
            <select
              {...register("discountType")}
              className="h-9 rounded-md border border-surface-200 bg-white px-2 text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">None</option>
              <option value="PERCENTAGE">%</option>
              <option value="FIXED">Fixed</option>
            </select>
            {discountType && (
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("discountValue", { valueAsNumber: true })}
                placeholder={discountType === "PERCENTAGE" ? "10" : "50.00"}
                className="w-24 text-right"
              />
            )}
          </div>
        </div>

        <Separator />

        {/* Totals display */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-surface-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{fmt(financials.subtotal)}</span>
          </div>
          {financials.discountAmount > 0 && (
            <div className="flex justify-between text-green-700 animate-fade-up">
              <span>Discount</span>
              <span className="tabular-nums">- {fmt(financials.discountAmount)}</span>
            </div>
          )}
          {financials.taxAmount > 0 && (
            <div className="flex justify-between text-surface-600 animate-fade-up">
              <span>Tax</span>
              <span className="tabular-nums">{fmt(financials.taxAmount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-base text-surface-900 pt-1">
            <span>Total Due</span>
            <span className="tabular-nums text-brand-700">{fmt(financials.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
