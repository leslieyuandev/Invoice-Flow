"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, FileText, Search, ChevronLeft, ChevronRight, X, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/calculations";
import { formatDate } from "@/lib/utils/date";
import { QuotationStatusBadge } from "./QuotationStatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteQuotationAction, convertQuotationToInvoiceAction } from "@/actions/quotation";
import type { QuotationListItem } from "@/types";

interface QuotationTableProps {
  quotations: QuotationListItem[];
}

const PAGE_SIZE = 10;

export function QuotationTable({ quotations }: QuotationTableProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dlg, setDlg] = useState<{ open: boolean; message: string; confirmLabel?: string; action: () => void }>({
    open: false,
    message: "",
    confirmLabel: undefined,
    action: () => {},
  });
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return quotations
      .filter((qt) => {
        const matchesSearch =
          !q ||
          qt.quotationNumber.toLowerCase().includes(q) ||
          qt.clientName.toLowerCase().includes(q);
        const issueMs = new Date(qt.issueDate).getTime();
        const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
        const toMs = dateTo ? new Date(dateTo).getTime() + 86400000 - 1 : null;
        const matchesFrom = fromMs === null || issueMs >= fromMs;
        const matchesTo = toMs === null || issueMs <= toMs;
        return matchesSearch && matchesFrom && matchesTo;
      })
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [quotations, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetPage() {
    setPage(1);
  }

  function handleDelete(id: string, num: string) {
    setDlg({
      open: true,
      message: `Delete quotation ${num}? This cannot be undone.`,
      confirmLabel: "Delete",
      action: async () => {
        setLoadingId(`del-${id}`);
        const result = await deleteQuotationAction(id);
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

  function handleAcceptConvert(id: string, num: string) {
    setDlg({
      open: true,
      message: `Accept ${num} and convert to invoice? The quotation will be marked as Accepted.`,
      confirmLabel: "Accept",
      action: async () => {
        setLoadingId(`accept-${id}`);
        const result = await convertQuotationToInvoiceAction(id) as any;
        setLoadingId(null);
        if (result?.error) {
          toast.error(String(result.error));
        } else {
          toast.success("Invoice created — review and save.");
          router.push(`/invoices/${result.data.invoiceId}/edit`);
        }
      },
    });
  }

  const canEdit = (status: string) => status === "DRAFT" || status === "SENT";

  const ActionButtons = ({ qt }: { qt: QuotationListItem }) => (
    <div className="flex items-center gap-1 justify-end">
      {canEdit(qt.status) && (
        <button
          type="button"
          onClick={() => handleAcceptConvert(qt.id, qt.quotationNumber)}
          disabled={loadingId === `accept-${qt.id}`}
          className="p-1.5 rounded-md text-surface-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
          title="Accept & Convert to Invoice"
        >
          <CheckCircle className="w-3.5 h-3.5" />
        </button>
      )}
      {canEdit(qt.status) && (
        <Link
          href={`/quotations/${qt.id}/edit`}
          className="p-1.5 rounded-md text-surface-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Link>
      )}
      <button
        type="button"
        onClick={() => handleDelete(qt.id, qt.quotationNumber)}
        disabled={loadingId === `del-${qt.id}`}
        className="p-1.5 rounded-md text-surface-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        title="Delete"
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
            placeholder="Search by quotation # or client…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-surface-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                className="w-full text-xs border border-surface-200 rounded-md px-2 py-1 pr-6 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className="w-full text-xs border border-surface-200 rounded-md px-2 py-1 pr-6 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            {quotations.length === 0 ? "No quotations yet" : "No quotations match your filters"}
          </p>
          <p className="text-xs text-surface-500 mt-1">
            {quotations.length === 0 ? "Create your first quotation to get started." : "Try adjusting your search or date range."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-surface-100">
            {paged.map((qt) => (
              <div key={qt.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
                <Link href={`/quotations/${qt.id}`} className="flex-1 min-w-0">
                  <p className="font-medium text-teal-600 text-sm">{qt.quotationNumber}</p>
                  <p className="text-sm text-surface-700 mt-0.5 truncate">{qt.clientName}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <QuotationStatusBadge status={qt.status} />
                    <span className="text-xs text-surface-400">{formatDate(qt.issueDate)}</span>
                  </div>
                </Link>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-semibold tabular-nums text-surface-900 text-sm">
                    {formatCurrency(qt.total, qt.currency)}
                  </span>
                  <ActionButtons qt={qt} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Quotation</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Client</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Issued</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Expiry</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Amount</th>
                  <th className="py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {paged.map((qt) => (
                  <tr key={qt.id} className="group hover:bg-surface-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link href={`/quotations/${qt.id}`} className="font-medium text-teal-600 hover:text-teal-700">
                        {qt.quotationNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-surface-700">{qt.clientName}</td>
                    <td className="py-3.5 px-4 text-surface-500">{formatDate(qt.issueDate)}</td>
                    <td className="py-3.5 px-4 text-surface-500">{formatDate(qt.expiryDate)}</td>
                    <td className="py-3.5 px-4"><QuotationStatusBadge status={qt.status} /></td>
                    <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-surface-900">
                      {formatCurrency(qt.total, qt.currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      <ActionButtons qt={qt} />
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
        confirmLabel={dlg.confirmLabel}
        onConfirm={() => { setDlg((d) => ({ ...d, open: false })); dlg.action(); }}
        onCancel={() => setDlg((d) => ({ ...d, open: false }))}
      />
    </>
  );
}
