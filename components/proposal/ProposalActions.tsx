"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Send, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  markProposalAcceptedAction,
  markProposalRejectedAction,
  deleteProposalAction,
} from "@/actions/proposal";
import { ProposalSendDialog } from "./ProposalSendDialog";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { ProposalStatus } from "@/types/proposal";

interface ProposalActionsProps {
  proposalId: string;
  eventTitle: string;
  status: ProposalStatus;
  leadEmail?: string;
  leadPhone?: string;
}

export function ProposalActions({
  proposalId,
  eventTitle,
  status,
  leadEmail = "",
  leadPhone = "",
}: ProposalActionsProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [sendOpen, setSendOpen] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleAccept() {
    setAcceptLoading(true);
    const result = await markProposalAcceptedAction(proposalId);
    setAcceptLoading(false);
    if (result && "error" in result && result.error) {
      toast.error(String(result.error));
      return;
    }
    toast.success("Proposal marked as accepted");
    router.refresh();
  }

  async function handleReject() {
    setRejectLoading(true);
    const result = await markProposalRejectedAction(proposalId);
    setRejectLoading(false);
    if (result && "error" in result && result.error) {
      toast.error(String(result.error));
      return;
    }
    toast.success("Proposal marked as rejected");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete this proposal? This cannot be undone.`)) return;
    setDeleteLoading(true);
    const result = await deleteProposalAction(proposalId);
    if (result && "error" in result && result.error) {
      toast.error(String(result.error));
      setDeleteLoading(false);
      return;
    }
    router.push("/proposals");
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(`/api/proposals/${proposalId}/pdf`, "_blank")}
      >
        <Download className="w-4 h-4" />
        {t("actions.downloadPdf")}
      </Button>

      {(status === "DRAFT" || status === "SENT") && (
        <Button variant="outline" size="sm" onClick={() => setSendOpen(true)}>
          <Send className="w-4 h-4" />
          {t("actions.send")}
        </Button>
      )}

      {status === "SENT" && (
        <>
          <Button size="sm" onClick={handleAccept} loading={acceptLoading}>
            <CheckCircle className="w-4 h-4" />
            {t("proposalActions.markAccepted")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReject} loading={rejectLoading}>
            <XCircle className="w-4 h-4" />
            {t("proposalActions.markRejected")}
          </Button>
        </>
      )}

      {(status === "DRAFT" || status === "REJECTED") && (
        <Button variant="destructive" size="sm" onClick={handleDelete} loading={deleteLoading}>
          <Trash2 className="w-4 h-4" />
          {t("proposalActions.delete")}
        </Button>
      )}

      <ProposalSendDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        proposalId={proposalId}
        eventTitle={eventTitle}
        defaultEmail={leadEmail}
        defaultPhone={leadPhone}
        onSent={() => router.refresh()}
      />
    </>
  );
}
