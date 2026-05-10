import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/types";

const labelMap: Record<InvoiceStatus, string> = {
  DRAFT:     "Draft",
  SENT:      "Sent",
  VIEWED:    "Viewed",
  PAID:      "Paid",
  OVERDUE:   "Overdue",
  CANCELLED: "Cancelled",
};

const variantMap: Record<InvoiceStatus, "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled"> = {
  DRAFT:     "draft",
  SENT:      "sent",
  VIEWED:    "viewed",
  PAID:      "paid",
  OVERDUE:   "overdue",
  CANCELLED: "cancelled",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}
