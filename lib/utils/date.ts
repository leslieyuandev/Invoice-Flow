import { format, addDays, isAfter } from "date-fns";

export function formatDate(date: Date | string, pattern = "MMM d, yyyy"): string {
  return format(new Date(date), pattern);
}

export function defaultDueDate(issueDateOrDays = 30): Date {
  return addDays(new Date(), issueDateOrDays);
}

export function isPastDue(dueDate: Date | string): boolean {
  return isAfter(new Date(), new Date(dueDate));
}

export function generateInvoiceNumber(prefix = "INV", existingNumbers: string[] = []): string {
  const year = new Date().getFullYear();
  // Match any numeric suffix for this prefix+year, regardless of zero-padding width
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  let maxSeq = 0;
  for (const num of existingNumbers) {
    const match = num.match(pattern);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  return `${prefix}-${year}-${String(maxSeq + 1).padStart(4, "0")}`;
}
