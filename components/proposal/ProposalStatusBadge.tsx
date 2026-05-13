"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { ProposalStatus } from "@/types/proposal";

const variantMap: Record<ProposalStatus, "draft" | "sent" | "accepted" | "rejected"> = {
  DRAFT:    "draft",
  SENT:     "sent",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const { t } = useTranslation();
  const key = `proposalStatus.${status}` as Parameters<typeof t>[0];
  return <Badge variant={variantMap[status]}>{t(key)}</Badge>;
}
