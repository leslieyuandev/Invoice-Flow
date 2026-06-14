"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, CheckCircle, FileText, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils/calculations";
import { formatDate } from "@/lib/utils/date";
import { StatusBadge } from "./StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { markAsPaidAction, deleteInvoiceAction } from "@/actions/invoice";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { InvoiceListItem } from "@/types";

interface InvoiceTableProps {
  invoices: InvoiceListItem[];
}

const PAGE_SIZE = 10;

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dlg, setDlg] = useState<{ open: boolean; message: string; action: () => void }>({
    open: false, message: "", action: () => {},
  });
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices
      .filter((inv) => {
        const matchesSearch =
          !q ||
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.clientName.toLowerCase().includes(q);
        const issueMs = new Date(inv.issueDate).getTime();
        const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
        const toMs = dateTo ? new Date(dateTo).getTime() + 86400000 - 1 : null;
        const matchesFrom = fromMs === null || issueMs >= fromMs;
        const matchesTo = toMs === null || issueMs <= toMs;
        return matchesSearch && matchesFrom && matchesTo;
      })
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [invoices, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetPage() {
    setPage(1);
  }

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

  function handleDelete(id: string, num: string) {
    setDlg({
      open: true,
      message: `Delete invoice ${num}? This cannot be undone.`,
      action: async () => {
        setLoadingId(`del-${id}`);
        const result = await deleteInvoiceAction(id);
        setLoadingId(null);
        if (result && "error" in result && result.error) {
          toast.error(String(result.error));
        } else {
          toast.success(`${num} deleted`);
          router.refresh();
        }
      },
    });
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
      <button
        type="button"
        onClick={() => handleDelete(invoice.id, invoice.invoiceNumber)}
        disabled={loadingId === `del-${invoice.id}`}
        className="p-1.5 rounded-md text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        title={t("actions.delete")}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <>
      {/* Search & filters */}
      <div className="px-4 py-3 border-b border-surface-100 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by invoice # or client…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1 flex-1">
            <label className="text-xs text-surface-500 whitespace-nowrap">From</label>
            <div className="relative flex-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); resetPage(); }}
                className="w-full text-xs border border-surface-200 rounded-md px-2 py-1 pr-6 focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
              {dateFrom && (
                <button
                  type="button"
                  onClick={() => { setDateFrom(""); resetPage(); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  aria-label="Clear from date"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-1">
            <label className="text-xs text-surface-500 whitespace-nowrap">To</label>
            <div className="relative flex-1">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); resetPage(); }}
                className="w-full text-xs border border-surface-200 rounded-md px-2 py-1 pr-6 focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
              {dateTo && (
                <button
                  type="button"
                  onClick={() => { setDateTo(""); resetPage(); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  aria-label="Clear to date"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-surface-400" />
          </div>
          <p className="text-sm font-medium text-surface-700">
            {invoices.length === 0 ? t("table.empty.title") : "No invoices match your filters"}
          </p>
          <p className="text-xs text-surface-500 mt-1">
            {invoices.length === 0 ? t("table.empty.subtitle") : "Try adjusting your search or date range."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-surface-100">
            {paged.map((invoice) => (
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
                {paged.map((invoice) => (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
              <p className="text-xs text-surface-500">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-surface-600 px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={dlg.open}
        message={dlg.message}
        onConfirm={() => { setDlg((d) => ({ ...d, open: false })); dlg.action(); }}
        onCancel={() => setDlg((d) => ({ ...d, open: false }))}
      />
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
