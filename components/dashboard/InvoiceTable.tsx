"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, CheckCircle, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils/calculations";
import { formatDate } from "@/lib/utils/date";
import { StatusBadge } from "./StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { markAsPaidAction, deleteInvoiceAction } from "@/actions/invoice";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { InvoiceListItem } from "@/types";

interface InvoiceTableProps {
  invoices: InvoiceListItem[];
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleMarkPaid(id: string, num: string) {
    setLoadingId(`paid-${id}`);
    const result = await markAsPaidAction(id);
    setLoadingId(null);
    if ("error" in result && result.error) {
      toast.error(String(result.error));
    } else {
      toast.success(`${num} marked as paid`);
      router.refresh();
    }
  }

  async function handleDelete(id: string, num: string) {
    if (!confirm(`Delete invoice ${num}? This cannot be undone.`)) return;
    setLoadingId(`del-${id}`);
    const result = await deleteInvoiceAction(id);
    setLoadingId(null);
    if (result && "error" in result && result.error) {
      toast.error(String(result.error));
    } else {
      toast.success(`${num} deleted`);
      router.refresh();
    }
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-surface-400" />
        </div>
        <p className="text-sm font-medium text-surface-700">{t("table.empty.title")}</p>
        <p className="text-xs text-surface-500 mt-1">{t("table.empty.subtitle")}</p>
      </div>
    );
  }

  const ActionButtons = ({ invoice }: { invoice: InvoiceListItem }) => (
    <div className="flex items-center gap-1 justify-end">
      {invoice.status !== "CANCELLED" && (
        <Link
          href={`/invoices/${invoice.id}/edit`}
          className="p-1.5 rounded-md text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          title={t("actions.edit")}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Link>
      )}
      {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
        <button
          type="button"
          onClick={() => handleMarkPaid(invoice.id, invoice.invoiceNumber)}
          disabled={loadingId === `paid-${invoice.id}`}
          className="p-1.5 rounded-md text-surface-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
          title={t("actions.markPaid")}
        >
          <CheckCircle className="w-3.5 h-3.5" />
        </button>
      )}
      {(invoice.status === "DRAFT" || invoice.status === "CANCELLED") && (
        <button
          type="button"
          onClick={() => handleDelete(invoice.id, invoice.invoiceNumber)}
          disabled={loadingId === `del-${invoice.id}`}
          className="p-1.5 rounded-md text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          title={t("actions.delete")}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile card list */}
      <div className="md:hidden divide-y divide-surface-100">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
            <Link href={`/invoices/${invoice.id}`} className="flex-1 min-w-0">
              <p className="font-medium text-brand-600 text-sm">{invoice.invoiceNumber}</p>
              <p className="text-sm text-surface-700 mt-0.5 truncate">{invoice.clientName}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge status={invoice.status} />
                <span className="text-xs text-surface-400">{formatDate(invoice.issueDate)}</span>
              </div>
            </Link>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="font-semibold tabular-nums text-surface-900 text-sm">
                {formatCurrency(invoice.total, invoice.currency)}
              </span>
              <ActionButtons invoice={invoice} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100">
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("table.invoice")}</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("table.client")}</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("table.issued")}</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("table.due")}</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("table.status")}</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("table.amount")}</th>
              <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="group hover:bg-surface-50 transition-colors">
                <td className="py-3.5 px-4">
                  <Link href={`/invoices/${invoice.id}`} className="font-medium text-brand-600 hover:text-brand-700">
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td className="py-3.5 px-4 text-surface-700">{invoice.clientName}</td>
                <td className="py-3.5 px-4 text-surface-500">{formatDate(invoice.issueDate)}</td>
                <td className="py-3.5 px-4 text-surface-500">{formatDate(invoice.dueDate)}</td>
                <td className="py-3.5 px-4"><StatusBadge status={invoice.status} /></td>
                <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-surface-900">
                  {formatCurrency(invoice.total, invoice.currency)}
                </td>
                <td className="py-3.5 px-4">
                  <ActionButtons invoice={invoice} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function InvoiceTableSkeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3.5 px-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}
