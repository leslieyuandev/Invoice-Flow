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
  let seq = 1;
  while (existingNumbers.includes(`${prefix}-${year}-${String(seq).padStart(3, "0")}`)) {
    seq++;
  }
  return `${prefix}-${year}-${String(seq).padStart(3, "0")}`;
}
