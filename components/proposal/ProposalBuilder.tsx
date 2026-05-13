"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
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
import { cn } from "@/lib/utils/cn";
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

function StyleSlider({
  label,
  hint,
  value,
  onChange,
  leftLabel,
  rightLabel,
  color,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-surface-900">{label}</p>
          <p className="text-xs text-surface-400">{hint}</p>
        </div>
        <span className="text-sm font-semibold text-surface-700 w-9 text-right">{value}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-surface-400 w-16 shrink-0">{leftLabel}</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`flex-1 h-2 rounded-full appearance-none cursor-pointer accent-${color}`}
          style={{ accentColor: color === "brand" ? "#4f46e5" : "#7c3aed" }}
        />
        <span className="text-xs text-surface-400 w-16 text-right shrink-0">{rightLabel}</span>
      </div>
    </div>
  );
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
      pagesCount: 1,
      addOnsEnabled: false,
      creativity: 50,
      elegance: 50,
    },
  });

  const watchedValues = useWatch({ control: form.control });
  const selectedPkgs = watchedValues.selectedPackages ?? [];
  const addOnsEnabled = watchedValues.addOnsEnabled ?? false;
  const pagesCount = watchedValues.pagesCount ?? 1;
  const creativity = watchedValues.creativity ?? 50;
  const elegance = watchedValues.elegance ?? 50;

  const maxPackages = pagesCount * 6;
  const pkgCountWarning = selectedPkgs.length > maxPackages
    ? `Too many packages (${selectedPkgs.length}/${maxPackages} max). Increase pages or deselect packages.`
    : null;

  const canSend = Boolean(
    watchedValues.leadName &&
    watchedValues.eventCategoryId &&
    selectedPkgs.length > 0 &&
    !pkgCountWarning
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

            {/* Style Settings */}
            <Card>
              <CardHeader><CardTitle>Style</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <Controller
                  control={form.control}
                  name="creativity"
                  render={({ field }) => (
                    <StyleSlider
                      label="Creativity"
                      hint="Bold colors and decorative elements"
                      value={field.value}
                      onChange={field.onChange}
                      leftLabel="Minimal"
                      rightLabel="Vibrant"
                      color="brand"
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="elegance"
                  render={({ field }) => (
                    <StyleSlider
                      label="Elegance"
                      hint="Whitespace and typography refinement"
                      value={field.value}
                      onChange={field.onChange}
                      leftLabel="Compact"
                      rightLabel="Spacious"
                      color="violet"
                    />
                  )}
                />
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
                  <CardTitle>{t("proposalBuilder.packages")}</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-surface-500 font-medium">Pages</label>
                      <Controller
                        control={form.control}
                        name="pagesCount"
                        render={({ field }) => (
                          <select
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="text-sm border border-surface-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-600"
                          >
                            {[1,2,3,4,5,6,7,8,9,10].map(n => (
                              <option key={n} value={n}>{n} page{n > 1 ? "s" : ""}</option>
                            ))}
                          </select>
                        )}
                      />
                    </div>
                    <span className={cn("text-xs font-medium", pkgCountWarning ? "text-red-500" : "text-surface-400")}>
                      {selectedPkgs.length}/{maxPackages} pkgs
                    </span>
                  </div>
                </div>
                {pkgCountWarning && (
                  <p className="text-xs text-red-500 mt-1">{pkgCountWarning}</p>
                )}
              </CardHeader>
              <CardContent>
                <PackageSelectionSection form={form} packages={packages} />
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

            {/* Terms & Cover */}
            <Card>
              <CardHeader><CardTitle>{t("proposalBuilder.terms")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="coverImageUrl">{t("proposalBuilder.coverImage")}</Label>
                  <Input id="coverImageUrl" {...form.register("coverImageUrl")} type="url" placeholder="https://..." />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="termsText">Terms & Contact Info</Label>
                  <textarea
                    id="termsText"
                    {...form.register("termsText")}
                    rows={5}
                    placeholder="Payment terms, contact details, terms & conditions..."
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
          defaultEmail={watchedValues.leadEmail ?? defaultLeadEmail}
          defaultPhone={watchedValues.leadPhone ?? defaultLeadPhone}
          onSent={() => router.push(`/proposals/${savedId}`)}
        />
      )}
    </div>
  );
}
