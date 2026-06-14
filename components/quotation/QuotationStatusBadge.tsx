"use client";
import { cn } from "@/lib/utils/cn";
import type { QuotationStatus } from "@/types";

const styles: Record<QuotationStatus, string> = {
  DRAFT:    "bg-surface-100 text-surface-600",
  SENT:     "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-green-50 text-green-700",
  DECLINED: "bg-red-50 text-red-700",
  EXPIRED:  "bg-amber-50 text-amber-700",
};

const labels: Record<QuotationStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}
