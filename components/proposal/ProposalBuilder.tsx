"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Send, Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LeadInfoSection } from "./form/LeadInfoSection";
import { EventCategorySection } from "./form/EventCategorySection";
import { PackageSelectionSection } from "./form/PackageSelectionSection";
import { AddOnSelectionSection } from "./form/AddOnSelectionSection";
import { ProposalPreview } from "./preview/ProposalPreview";
import { ProposalSendDialog } from "./ProposalSendDialog";
import { createProposalAction, updateProposalAction } from "@/actions/proposal";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { ProposalFormData, CatalogCategoryTree, CatalogPackageData, CatalogAddOnData } from "@/types/proposal";

interface ProposalBuilderProps {
  categoryTree: CatalogCategoryTree[];
  packages: CatalogPackageData[];
  addOns: CatalogAddOnData[];
  senderName: string;
  mode?: "create" | "edit";
  initialData?: ProposalFormData;
  proposalId?: string;
  defaultLeadEmail?: string;
  defaultLeadPhone?: string;
}

export function ProposalBuilder({
  categoryTree,
  packages,
  addOns,
  senderName,
  mode = "create",
  initialData,
  proposalId,
  defaultLeadEmail = "",
  defaultLeadPhone = "",
}: ProposalBuilderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [showPreview, setShowPreview] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(proposalId ?? null);

  const form = useForm<ProposalFormData>({
    defaultValues: initialData ?? {
      leadName: "",
      leadEmail: "",
      leadPhone: "",
      clientId: "",
      eventTitle: "",
      eventCategoryId: "",
      coverImageUrl: "",
      termsText: "",
      selectedPackages: [],
      selectedAddOns: [],
    },
  });

  const watchedValues = useWatch({ control: form.control });
  const leadEmail = watchedValues.leadEmail ?? "";
  const leadPhone = watchedValues.leadPhone ?? "";

  const canSend = Boolean(
    watchedValues.leadName &&
    watchedValues.eventCategoryId &&
    (watchedValues.selectedPackages?.length ?? 0) > 0
  );

  async function saveProposal(data: ProposalFormData): Promise<string | null> {
    let result: { data?: { id: string }; error?: string } | undefined;
    if (mode === "edit" && proposalId) {
      result = await updateProposalAction(proposalId, data);
    } else {
      result = await createProposalAction(data);
    }
    if (!result || ("error" in result && result.error)) {
      toast.error(result?.error ?? "Failed to save proposal");
      return null;
    }
    const id = result.data!.id;
    setSavedId(id);
    return id;
  }

  async function onSubmit(data: ProposalFormData) {
    const id = await saveProposal(data);
    if (id) router.push(`/proposals/${id}`);
  }

  async function handleDownloadPdf() {
    const valid = await form.trigger();
    if (!valid) { toast.error("Please fix the form errors first."); return; }
    const data = form.getValues();
    const id = await saveProposal(data);
    if (!id) return;
    window.open(`/api/proposals/${id}/pdf`, "_blank");
    router.push(`/proposals/${id}`);
  }

  async function handleSend() {
    const valid = await form.trigger();
    if (!valid) { toast.error("Please fix the form errors first."); return; }
    const data = form.getValues();
    const id = await saveProposal(data);
    if (!id) return;
    setSendOpen(true);
  }

  const title = mode === "edit" ? t("proposalBuilder.editProposal") : t("proposalBuilder.newProposal");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-surface-200 bg-white shrink-0 gap-2">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-surface-900 truncate">{title}</h1>
          <p className="text-xs text-surface-500 hidden sm:block">{t("proposalBuilder.preview.subtitle")}</p>
        </div>
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden md:flex"
            onClick={() => setShowPreview((s) => !s)}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleDownloadPdf} disabled={!canSend}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t("proposalBuilder.downloadPdf")}</span>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleSend} disabled={!canSend}>
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{t("proposalBuilder.send")}</span>
          </Button>
          <Button
            type="submit"
            form="proposal-form"
            loading={form.formState.isSubmitting}
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{t("proposalBuilder.save")}</span>
          </Button>
        </div>
      </div>

      {/* Split pane */}
      <div className={`flex flex-1 overflow-hidden ${showPreview ? "divide-x divide-surface-200" : ""}`}>
        {/* Form */}
        <div className={`overflow-y-auto ${showPreview ? "w-full md:w-1/2" : "w-full max-w-3xl mx-auto"}`}>
          <form
            id="proposal-form"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="p-4 md:p-6 space-y-6 pb-28 md:pb-10"
          >
            <Card>
              <CardHeader><CardTitle>{t("proposalBuilder.leadInfo")}</CardTitle></CardHeader>
              <CardContent><LeadInfoSection form={form} /></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t("proposalBuilder.eventDetails")}</CardTitle></CardHeader>
              <CardContent>
                <EventCategorySection form={form} categoryTree={categoryTree} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t("proposalBuilder.packages")}</CardTitle></CardHeader>
              <CardContent>
                <PackageSelectionSection form={form} packages={packages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t("proposalBuilder.addOns")}</CardTitle></CardHeader>
              <CardContent>
                <AddOnSelectionSection form={form} addOns={addOns} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t("proposalBuilder.terms")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="coverImageUrl">{t("proposalBuilder.coverImage")}</Label>
                  <Input
                    id="coverImageUrl"
                    {...form.register("coverImageUrl")}
                    type="url"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="termsText">{t("proposalBuilder.terms")}</Label>
                  <textarea
                    id="termsText"
                    {...form.register("termsText")}
                    rows={5}
                    placeholder="Terms & conditions, payment info, contact details..."
                    className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="hidden md:block md:w-1/2 overflow-hidden bg-surface-100">
            <ProposalPreview
              data={watchedValues as Partial<ProposalFormData>}
              senderName={senderName}
            />
          </div>
        )}
      </div>

      {savedId && (
        <ProposalSendDialog
          open={sendOpen}
          onClose={() => setSendOpen(false)}
          proposalId={savedId}
          eventTitle={watchedValues.eventTitle ?? ""}
          defaultEmail={leadEmail}
          defaultPhone={leadPhone}
          onSent={() => router.push(`/proposals/${savedId}`)}
        />
      )}
    </div>
  );
}
