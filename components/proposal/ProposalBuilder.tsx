"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Send, Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { LeadInfoSection } from "./form/LeadInfoSection";
import { EventCategorySection } from "./form/EventCategorySection";
import { PackageSelectionSection } from "./form/PackageSelectionSection";
import { AddOnSelectionSection } from "./form/AddOnSelectionSection";
import { ProposalPreview } from "./preview/ProposalPreview";
import { ProposalSendDialog } from "./ProposalSendDialog";
import { createProposalAction, updateProposalAction } from "@/actions/proposal";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils/cn";
import { FONT_PAIRS } from "@/lib/constants/fontPairs";
import type { ProposalFormData, CatalogCategoryTree, CatalogPackageData, CatalogAddOnData } from "@/types/proposal";

interface ProposalBuilderProps {
  categoryTree: CatalogCategoryTree[];
  packages: CatalogPackageData[];
  addOns: CatalogAddOnData[];
  senderName: string;
  senderLogoUrl?: string | null;
  senderPhone?: string | null;
  senderEmail?: string | null;
  mode?: "create" | "edit";
  initialData?: ProposalFormData;
  proposalId?: string;
  defaultLeadEmail?: string;
  defaultLeadPhone?: string;
}

const PRESET_COLORS = [
  // Warm reds & pinks
  "#C8151B", "#B71C1C", "#880E4F", "#AD1457",
  // Purples & indigos
  "#6A1B9A", "#4A148C", "#283593", "#1A237E",
  // Blues & teals
  "#0277BD", "#006064", "#00695C", "#004D40",
  // Greens
  "#2E7D32", "#1B5E20", "#558B2F", "#33691E",
  // Warm deep tones
  "#E65100", "#BF360C", "#4E342E", "#3E2723",
  // Dark neutrals
  "#212121", "#263238", "#37474F", "#1C1C2E",
];

export function ProposalBuilder({
  categoryTree,
  packages,
  addOns,
  senderName,
  senderLogoUrl,
  senderPhone,
  senderEmail,
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
      bgColor: "#C8151B",
      fontPair: "tenor-clear",
      coverImageUrl: "",
      termsText: "",
      selectedPackages: [],
      selectedAddOns: [],
      addOnsEnabled: false,
      compact: false,
    },
  });

  const watchedValues = useWatch({ control: form.control });
  const selectedPkgs = watchedValues.selectedPackages ?? [];
  const addOnsEnabled = watchedValues.addOnsEnabled ?? false;
  const compact = watchedValues.compact ?? false;

  const canSend = Boolean(
    watchedValues.leadName &&
    watchedValues.eventCategoryId &&
    selectedPkgs.length > 0
  );

  async function saveProposal(data: ProposalFormData): Promise<string | null> {
    if (!data.addOnsEnabled) data = { ...data, selectedAddOns: [] };
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
          <Button type="button" variant="ghost" size="sm" className="hidden md:flex" onClick={() => setShowPreview((s) => !s)}>
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
          <Button type="submit" form="proposal-form" loading={form.formState.isSubmitting}>
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{t("proposalBuilder.save")}</span>
          </Button>
        </div>
      </div>

      {/* Split pane */}
      <div className={`flex flex-1 overflow-hidden ${showPreview ? "divide-x divide-surface-200" : ""}`}>
        {/* Form */}
        <div className={`overflow-y-auto ${showPreview ? "w-full md:w-1/2" : "w-full max-w-3xl mx-auto"}`}>
          <form id="proposal-form" onSubmit={form.handleSubmit(onSubmit)} noValidate className="p-4 md:p-6 space-y-6 pb-28 md:pb-10">

            {/* Style — background color + font */}
            <Card>
              <CardHeader><CardTitle>Style</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {/* Background color */}
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <p className="text-xs text-surface-400 -mt-1">Applied to all slides</p>
                  <Controller
                    control={form.control}
                    name="bgColor"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={field.value || "#C8151B"}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-9 h-9 rounded cursor-pointer border border-surface-200 p-0.5"
                          />
                          <input
                            type="text"
                            value={field.value || "#C8151B"}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="#C8151B"
                            className="w-28 font-mono text-sm border border-surface-200 rounded px-2 py-1.5 text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-600"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => field.onChange(c)}
                              title={c}
                              className={cn(
                                "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                                field.value === c ? "border-surface-900 scale-110" : "border-white shadow"
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  />
                </div>

                {/* Font style */}
                <div className="space-y-2">
                  <Label>Font Style</Label>
                  <p className="text-xs text-surface-400 -mt-1">Applied to headings and body text</p>
                  <Controller
                    control={form.control}
                    name="fontPair"
                    render={({ field }) => (
                      <div className="grid grid-cols-1 gap-2">
                        {FONT_PAIRS.map((fp) => (
                          <button
                            key={fp.id}
                            type="button"
                            onClick={() => field.onChange(fp.id)}
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors",
                              field.value === fp.id
                                ? "border-brand-500 bg-brand-50 text-brand-700"
                                : "border-surface-200 bg-white hover:border-brand-300 text-surface-700"
                            )}
                          >
                            <div>
                              <p className="text-sm font-semibold">{fp.label}</p>
                              <p className="text-xs text-surface-400">{fp.description}</p>
                            </div>
                            {field.value === fp.id && (
                              <span className="text-xs font-medium text-brand-600">✓ Selected</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lead Info */}
            <Card>
              <CardHeader><CardTitle>{t("proposalBuilder.leadInfo")}</CardTitle></CardHeader>
              <CardContent><LeadInfoSection form={form} /></CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader><CardTitle>{t("proposalBuilder.eventDetails")}</CardTitle></CardHeader>
              <CardContent><EventCategorySection form={form} categoryTree={categoryTree} /></CardContent>
            </Card>

            {/* Packages */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("proposalBuilder.packages")}</CardTitle>
                    {compact && (
                      <p className="text-xs text-surface-400 mt-0.5">Compact: up to 6 packages per page</p>
                    )}
                  </div>
                  <Controller
                    control={form.control}
                    name="compact"
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-surface-500">Compact</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={field.value}
                          onClick={() => field.onChange(!field.value)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                            field.value ? "bg-brand-600" : "bg-surface-300"
                          )}
                        >
                          <span className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                            field.value ? "translate-x-6" : "translate-x-1"
                          )} />
                        </button>
                      </div>
                    )}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <PackageSelectionSection form={form} packages={packages} categoryTree={categoryTree} />
              </CardContent>
            </Card>

            {/* Add-Ons (toggle-gated) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("proposalBuilder.addOns")}</CardTitle>
                    {!addOnsEnabled && (
                      <p className="text-xs text-surface-400 mt-0.5">Enable to include an add-ons page in the proposal</p>
                    )}
                  </div>
                  <Controller
                    control={form.control}
                    name="addOnsEnabled"
                    render={({ field }) => (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={field.value}
                        onClick={() => field.onChange(!field.value)}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                          field.value ? "bg-brand-600" : "bg-surface-300"
                        )}
                      >
                        <span className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                          field.value ? "translate-x-6" : "translate-x-1"
                        )} />
                      </button>
                    )}
                  />
                </div>
              </CardHeader>
              {addOnsEnabled && (
                <CardContent>
                  <AddOnSelectionSection form={form} addOns={addOns} />
                </CardContent>
              )}
            </Card>

            {/* Cover & Terms */}
            <Card>
              <CardHeader><CardTitle>Cover & Contact Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  control={form.control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <ImageUploadField
                      label="Cover Photo (displays above the event title)"
                      value={field.value || null}
                      onChange={(url) => field.onChange(url ?? "")}
                      previewHeight="h-40"
                    />
                  )}
                />
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="termsText">Payment Terms & Contact Info</Label>
                  <p className="text-xs text-surface-400">Appears on the last page — include payment schedule, bank details, and remarks. Supports headings, bullets, and colors.</p>
                  <Controller
                    control={form.control}
                    name="termsText"
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder={"HOW TO ORDER?\n• Choose a Package\n• Pick your Balloon Color\n• Whatsapp Us to Proceed with Booking"}
                        minHeight="180px"
                      />
                    )}
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
              senderLogoUrl={senderLogoUrl}
              senderPhone={senderPhone}
              senderEmail={senderEmail}
              compact={compact}
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
          defaultEmail={watchedValues.leadEmail ?? defaultLeadEmail}
          defaultPhone={watchedValues.leadPhone ?? defaultLeadPhone}
          onSent={() => router.push(`/proposals/${savedId}`)}
        />
      )}
    </div>
  );
}
