import type { DiscountType, InvoiceFinancials, LineItemFormData } from "@/types";

// All internal math operates in cents. UI layer passes dollars; convert at the boundary.

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function calculateLineItemAmount(quantity: number, unitPriceDollars: number): number {
  return dollarsToCents(quantity * unitPriceDollars);
}

export function calculateInvoiceFinancials(
  lineItems: LineItemFormData[],
  taxRate: number,
  discountType?: DiscountType,
  discountValue?: number
): InvoiceFinancials {
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + calculateLineItemAmount(item.quantity, item.unitPrice);
  }, 0);

  let discountAmount = 0;
  if (discountType && discountValue && discountValue > 0) {
    if (discountType === "PERCENTAGE") {
      discountAmount = Math.round(subtotal * (discountValue / 100));
    } else {
      discountAmount = dollarsToCents(discountValue);
    }
  }

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = Math.round(taxableAmount * (taxRate / 100));
  const total = taxableAmount + taxAmount;

  return { subtotal, taxAmount, discountAmount, total };
}

export function formatCurrency(cents: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(centsToDollars(cents));
}

export function isOverdue(dueDate: Date, status: string): boolean {
  return status !== "PAID" && status !== "CANCELLED" && new Date() > new Date(dueDate);
}
