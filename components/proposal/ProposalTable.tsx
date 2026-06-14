"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, ScrollText } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { ProposalStatusBadge } from "./ProposalStatusBadge";
import { deleteProposalAction } from "@/actions/proposal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { ProposalListItem } from "@/types/proposal";

interface ProposalTableProps {
  proposals: ProposalListItem[];
}

export function ProposalTable({ proposals }: ProposalTableProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dlg, setDlg] = useState<{ open: boolean; id: string }>({ open: false, id: "" });

  function handleDelete(id: string) {
    setDlg({ open: true, id });
  }

  async function executeDelete(id: string) {
    setLoadingId(`del-${id}`);
    const result = await deleteProposalAction(id);
    setLoadingId(null);
    if (result && "error" in result && result.error) {
      toast.error(String(result.error));
    } else {
      toast.success("Proposal deleted");
      router.refresh();
    }
  }

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-4">
          <ScrollText className="w-6 h-6 text-surface-400" />
        </div>
        <p className="text-sm font-medium text-surface-700">{t("proposals.empty")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100">
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Lead</th>
              <th className="hidden md:table-cell text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Event</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("table.status")}</th>
              <th className="hidden md:table-cell text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Date</th>
              <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {proposals.map((p) => (
              <tr key={p.id} className="group hover:bg-surface-50 transition-colors">
                <td className="py-3.5 px-4">
                  <Link href={`/proposals/${p.id}`} className="font-medium text-brand-600 hover:text-brand-700 block">
                    {p.leadName}
                  </Link>
                  {p.leadEmail && (
                    <span className="text-xs text-surface-400">{p.leadEmail}</span>
                  )}
                </td>
                <td className="hidden md:table-cell py-3.5 px-4 text-surface-700">{p.eventTitle}</td>
                <td className="py-3.5 px-4"><ProposalStatusBadge status={p.status} /></td>
                <td className="hidden md:table-cell py-3.5 px-4 text-surface-500">{formatDate(p.createdAt)}</td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1 justify-end">
                    {p.status === "DRAFT" && (
                      <Link
                        href={`/proposals/${p.id}/edit`}
                        className="p-1.5 rounded-md text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title={t("actions.edit")}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    {(p.status === "DRAFT" || p.status === "REJECTED") && (
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        disabled={loadingId === `del-${p.id}`}
                        className="p-1.5 rounded-md text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title={t("proposalActions.delete")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={dlg.open}
        message="Delete this proposal? This cannot be undone."
        onConfirm={() => { setDlg((d) => ({ ...d, open: false })); executeDelete(dlg.id); }}
        onCancel={() => setDlg((d) => ({ ...d, open: false }))}
      />
    </>
  );
}
