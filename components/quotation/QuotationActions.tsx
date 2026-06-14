"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Send, CheckCircle, XCircle, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SendDialog } from "@/components/invoice/SendDialog";
import {
  markQuotationDeclinedAction,
  deleteQuotationAction,
  convertQuotationToInvoiceAction,
} from "@/actions/quotation";
import type { QuotationStatus } from "@/types";

interface QuotationActionsProps {
  quotationId: string;
  quotationNumber: string;
  status: QuotationStatus;
  clientEmail: string;
  clientPhone?: string;
  alreadyConverted?: boolean;
}

export function QuotationActions({
  quotationId,
  quotationNumber,
  status,
  clientEmail,
  clientPhone,
  alreadyConverted,
}: QuotationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [confirmDlg, setConfirmDlg] = useState<{
    open: boolean;
    message: string;
    confirmLabel?: string;
    action: () => void;
  }>({ open: false, message: "", confirmLabel: undefined, action: () => {} });

  function confirm(message: string, action: () => void, confirmLabel?: string) {
    setConfirmDlg({ open: true, message, confirmLabel, action });
  }

  async function run(key: string, fn: () => Promise<unknown>) {
    setLoading(key);
    try {
      const result = await fn() as any;
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleAcceptConvert() {
    confirm(
      `Accept ${quotationNumber} and convert to invoice? The quotation will be marked as Accepted.`,
      async () => {
        setLoading("convert");
        const result = await convertQuotationToInvoiceAction(quotationId) as any;
        setLoading(null);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Invoice created — review and save.");
        router.push(`/invoices/${result.data.invoiceId}/edit`);
      },
      "Accept"
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(`/api/quotations/${quotationId}/pdf`, "_blank")}
        title="Download PDF"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Download PDF</span>
      </Button>

      {status !== "DECLINED" && status !== "EXPIRED" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSendOpen(true)}
          title="Send"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      )}

      {(status === "DRAFT" || status === "SENT") && (
        <Button
          size="sm"
          loading={loading === "convert"}
          onClick={handleAcceptConvert}
          title="Accept & Convert to Invoice"
        >
          <CheckCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Accept</span>
        </Button>
      )}

      {(status === "DRAFT" || status === "SENT") && (
        <Button
          size="sm"
          variant="outline"
          loading={loading === "decline"}
          onClick={() =>
            confirm(
              `Mark ${quotationNumber} as Declined?`,
              () => run("decline", () => markQuotationDeclinedAction(quotationId))
            )
          }
          title="Mark Declined"
        >
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="hidden sm:inline">Declined</span>
        </Button>
      )}

      {!alreadyConverted && status === "ACCEPTED" && (
        <Button
          size="sm"
          loading={loading === "convert"}
          onClick={handleAcceptConvert}
          title="Convert to Invoice"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Convert to Invoice</span>
        </Button>
      )}

      <Button
        variant="destructive"
        size="sm"
        loading={loading === "delete"}
        onClick={() =>
          confirm(
            `Delete quotation ${quotationNumber}? This cannot be undone.`,
            () =>
              run("delete", async () => {
                const r = await deleteQuotationAction(quotationId) as any;
                if (!r?.error) router.push("/quotations");
                return r;
              })
          )
        }
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
        <span className="hidden sm:inline">Delete</span>
      </Button>

      <SendDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        invoiceId={quotationId}
        invoiceNumber={quotationNumber}
        defaultEmail={clientEmail}
        defaultPhone={clientPhone}
        onSent={() => { router.refresh(); }}
        sendApiPath={`/api/quotations/${quotationId}/send`}
      />

      <ConfirmDialog
        open={confirmDlg.open}
        message={confirmDlg.message}
        confirmLabel={confirmDlg.confirmLabel}
        onConfirm={() => {
          setConfirmDlg((d) => ({ ...d, open: false }));
          confirmDlg.action();
        }}
        onCancel={() => setConfirmDlg((d) => ({ ...d, open: false }))}
      />
    </>
  );
}
