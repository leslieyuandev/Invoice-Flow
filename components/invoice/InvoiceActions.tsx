"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Send, CheckCircle, Trash2, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAsSentAction, markAsPaidAction, deleteInvoiceAction } from "@/actions/invoice";
import { SendDialog } from "./SendDialog";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { InvoiceStatus } from "@/types";

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  clientEmail: string;
  clientPhone?: string;
}

export function InvoiceActions({ invoiceId, invoiceNumber, status, clientEmail, clientPhone }: InvoiceActionsProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [sentLoading, setSentLoading] = useState(false);
  const [paidLoading, setPaidLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  async function handleDownload() {
    window.open(`/api/invoices/${invoiceId}/pdf`, "_blank");
    if (status === "DRAFT") {
      setSentLoading(true);
      try {
        await markAsSentAction(invoiceId);
        toast.success("Invoice marked as sent");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update status");
      } finally {
        setSentLoading(false);
      }
    }
  }

  async function handleMarkSent() {
    setSentLoading(true);
    try {
      await markAsSentAction(invoiceId);
      toast.success("Invoice marked as sent");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSentLoading(false);
    }
  }

  async function handleMarkPaid() {
    setPaidLoading(true);
    const result = await markAsPaidAction(invoiceId);
    setPaidLoading(false);
    if ("error" in result && result.error) {
      toast.error(String(result.error));
      return;
    }
    toast.success("Invoice marked as paid");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete invoice ${invoiceNumber}? This cannot be undone.`)) return;
    setDeleteLoading(true);
    const result = await deleteInvoiceAction(invoiceId);
    if (result && "error" in result && result.error) {
      toast.error(String(result.error));
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleDownload} loading={sentLoading}>
        <Download className="w-4 h-4" />
        {t("actions.downloadPdf")}
      </Button>

      {status !== "PAID" && status !== "CANCELLED" && (
        <Button variant="outline" size="sm" onClick={() => setSendOpen(true)}>
          <Send className="w-4 h-4" />
          {t("actions.send")}
        </Button>
      )}

      {status === "DRAFT" && (
        <Button size="sm" variant="outline" onClick={handleMarkSent} loading={sentLoading}>
          <SendHorizonal className="w-4 h-4" />
          {t("actions.markAsSent")}
        </Button>
      )}

      {(status === "SENT" || status === "VIEWED" || status === "OVERDUE") && (
        <Button size="sm" onClick={handleMarkPaid} loading={paidLoading}>
          <CheckCircle className="w-4 h-4" />
          {t("actions.markPaid")}
        </Button>
      )}

      {(status === "DRAFT" || status === "CANCELLED") && (
        <Button variant="destructive" size="sm" onClick={handleDelete} loading={deleteLoading}>
          <Trash2 className="w-4 h-4" />
          {t("actions.delete")}
        </Button>
      )}

      <SendDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        defaultEmail={clientEmail}
        defaultPhone={clientPhone}
        onSent={() => router.refresh()}
      />
    </>
  );
}
