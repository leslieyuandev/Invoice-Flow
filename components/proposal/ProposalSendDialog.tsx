"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, MessageCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface ProposalSendDialogProps {
  open: boolean;
  onClose: () => void;
  proposalId: string;
  eventTitle: string;
  defaultEmail?: string;
  defaultPhone?: string;
  onSent?: () => void;
}

export function ProposalSendDialog({
  open,
  onClose,
  proposalId,
  eventTitle,
  defaultEmail = "",
  defaultPhone = "",
  onSent,
}: ProposalSendDialogProps) {
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const body: Record<string, string> = { channel };
    const message = fd.get("message") as string;
    if (message) body.message = message;

    if (channel === "email") {
      body.recipientEmail = fd.get("recipientEmail") as string;
    } else {
      body.recipientPhone = fd.get("recipientPhone") as string;
    }

    try {
      const res = await fetch(`/api/proposals/${proposalId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to send proposal");
        return;
      }

      if (channel === "whatsapp" && data.data?.whatsappUrl) {
        window.open(data.data.whatsappUrl, "_blank");
        toast.success("WhatsApp link opened");
      } else {
        toast.success("Proposal sent successfully");
      }

      onSent?.();
      onClose();
    } catch {
      toast.error("Failed to send proposal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={t("proposalSendDialog.title")} description={`Deliver proposal for "${eventTitle}"`}>
        <div className="flex gap-2 my-3">
          {(["email", "whatsapp"] as const).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannel(ch)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors",
                channel === ch
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-surface-200 text-surface-600 hover:bg-surface-50"
              )}
            >
              {ch === "email" ? <Mail className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
              {ch === "email" ? "Email" : "WhatsApp"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {channel === "email" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recipientEmail" required>{t("sendDialog.recipientEmail")}</Label>
              <Input
                id="recipientEmail"
                name="recipientEmail"
                type="email"
                required
                defaultValue={defaultEmail}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recipientPhone" required>{t("sendDialog.whatsappNumber")}</Label>
              <Input
                id="recipientPhone"
                name="recipientPhone"
                type="tel"
                required
                defaultValue={defaultPhone}
                placeholder="+60 12 345 6789"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="message">{t("sendDialog.customMessage")}</Label>
            <textarea
              id="message"
              name="message"
              rows={3}
              placeholder={t("sendDialog.customMessagePlaceholder")}
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>{t("sendDialog.cancel")}</Button>
            <Button type="submit" size="sm" loading={loading}>
              {channel === "email" ? t("sendDialog.sendEmail") : t("sendDialog.openWhatsapp")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
