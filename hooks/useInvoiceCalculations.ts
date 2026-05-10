import { useWatch, type Control } from "react-hook-form";
import { useMemo } from "react";
import { calculateInvoiceFinancials, calculateLineItemAmount } from "@/lib/utils/calculations";
import type { InvoiceFormData } from "@/types";

export function useInvoiceCalculations(control: Control<InvoiceFormData>) {
  const lineItems  = useWatch({ control, name: "lineItems" });
  const taxRate    = useWatch({ control, name: "taxRate" });
  const discountType  = useWatch({ control, name: "discountType" });
  const discountValue = useWatch({ control, name: "discountValue" });

  // Recompute only when the watched values change (memoised)
  const financials = useMemo(
    () =>
      calculateInvoiceFinancials(
        (lineItems ?? []).map((item) => ({
          ...item,
          // Ensure numeric types — form fields can return strings
          quantity:  Number(item?.quantity  ?? 0),
          unitPrice: Number(item?.unitPrice ?? 0),
          amount:    Number(item?.amount    ?? 0),
        })),
        Number(taxRate ?? 0),
        discountType,
        discountValue !== undefined ? Number(discountValue) : undefined
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(lineItems), taxRate, discountType, discountValue]
  );

  // Per-row amounts for displaying in the form without a separate fetch
  const lineItemAmounts = useMemo(
    () =>
      (lineItems ?? []).map((item) =>
        calculateLineItemAmount(Number(item?.quantity ?? 0), Number(item?.unitPrice ?? 0))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(lineItems)]
  );

  return { financials, lineItemAmounts };
}
