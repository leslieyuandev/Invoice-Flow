"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { InvoiceStatus } from "@/types";

const variantMap: Record<InvoiceStatus, "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled"> = {
  DRAFT:     "draft",
  SENT:      "sent",
  VIEWED:    "viewed",
  PAID:      "paid",
  OVERDUE:   "overdue",
  CANCELLED: "cancelled",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation();
  return <Badge variant={variantMap[status]}>{t(`status.${status}`)}</Badge>;
}
