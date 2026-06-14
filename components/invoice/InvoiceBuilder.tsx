"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch, Controller, type Resolver } from "react-hook-form";
import { useRouter } from "next/navigation";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { Download, Send, Save, Eye, EyeOff } from "lucide-react";
import { addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { CollapsibleCard } from "@/components/invoice/form/CollapsibleCard";
import { SenderSection } from "./form/SenderSection";
import { ClientSection } from "./form/ClientSection";
import { MetadataSection } from "./form/MetadataSection";
import { LineItemsTable } from "./form/LineItemsTable";
import { FinancialSummary } from "./form/FinancialSummary";
import { InvoicePreview } from "./preview/InvoicePreview";
import { SendDialog } from "./SendDialog";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useInvoiceCalculations } from "@/hooks/useInvoiceCalculations";
import { createInvoiceSchema } from "@/lib/validations/invoice";
import { createInvoiceAction, updateInvoiceAction, markAsSentAction } from "@/actions/invoice";
import { generateInvoiceNumber } from "@/lib/utils/date";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { InvoiceFormData } from "@/types";
import type { Client, LineItemTemplate } from "@prisma/client";

export interface UserDefaults {
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  senderPhone: string;
  senderSsmNumber: string;
  senderLogoUrl: string;
  defaultCurrency: string;
  defaultPaymentTerms: number;
  defaultNotes: string;
  defaultTerms: string;
  invoiceNumberPrefix: string;
  showDueDate: boolean;
}

interface InvoiceBuilderProps {
  clients: Client[];
  existingNumbers?: string[];
  userDefaults?: UserDefaults;
  templates?: LineItemTemplate[];
  mode?: "create" | "edit";
  initialData?: InvoiceFormData;
  invoiceId?: string;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ensureHtml(text: string | null | undefined): string {
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return "<p>" + text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>") + "</p>";
}

export function InvoiceBuilder({
  clients,
  existingNumbers = [],
  userDefaults,
  templates = [],
  mode = "create",
  initialData,
  invoiceId,
}: InvoiceBuilderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [showPreview, setShowPreview] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(invoiceId ?? null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  const defaults = userDefaults ?? {
    senderName: "",
    senderEmail: "",
    senderAddress: "",
    senderPhone: "",
    senderSsmNumber: "",
    senderLogoUrl: "",
    defaultCurrency: "MYR",
    defaultPaymentTerms: 30,
    defaultNotes: "",
    defaultTerms: "50% booking fees upon confirmation\n\nPlease make your payment to:\nBank: Public Bank\nAccount No.: 3823632829\nHalo Balloon Services",
    invoiceNumberPrefix: "INV",
    showDueDate: true,
  };

  const issueDate = new Date();

  const form = useForm<InvoiceFormData, unknown, InvoiceFormData>({
    resolver: standardSchemaResolver(createInvoiceSchema) as Resolver<InvoiceFormData, unknown, InvoiceFormData>,
    defaultValues: initialData ? {
      ...initialData,
      notes: ensureHtml(initialData.notes),
      terms: ensureHtml(initialData.terms),
    } : {
      invoiceNumber: generateInvoiceNumber(defaults.invoiceNumberPrefix, existingNumbers),
      issueDate: toDateStr(issueDate) as unknown as Date,
      dueDate: toDateStr(addDays(issueDate, defaults.defaultPaymentTerms)) as unknown as Date,
      currency: defaults.defaultCurrency,
      clientId: "",
      senderName: defaults.senderName,
      senderEmail: defaults.senderEmail,
      senderAddress: defaults.senderAddress,
      senderPhone: defaults.senderPhone,
      senderSsmNumber: defaults.senderSsmNumber,
      senderLogoUrl: defaults.senderLogoUrl,
      taxRate: 0,
      lineItems: [],
      notes: ensureHtml(defaults.defaultNotes),
      terms: ensureHtml(defaults.defaultTerms),
    },
    mode: "onChange",
  });

  const { financials, lineItemAmounts } = useInvoiceCalculations(form.control);
  const watchedValues = useWatch({ control: form.control });
  const currency = watchedValues.currency ?? defaults.defaultCurrency;
  const selectedClient = clients.find((c) => c.id === watchedValues.clientId);

  const watchedIssueDate = form.watch("issueDate");
  useEffect(() => {
    let parsed: Date;
    if (watchedIssueDate instanceof Date) {
      parsed = watchedIssueDate;
    } else {
      const parts = String(watchedIssueDate).split("-").map(Number);
      parsed = new Date(parts[0], parts[1] - 1, parts[2]); // local timezone, avoid UTC shift
    }
    if (!isNaN(parsed.getTime())) {
      form.setValue("dueDate", toDateStr(addDays(parsed, defaults.defaultPaymentTerms)) as unknown as Date, { shouldValidate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedIssueDate]);


  async function saveInvoice(data: InvoiceFormData): Promise<string | null> {
    try {
      let result: { data?: { id: string }; error?: string } | undefined;
      if (mode === "edit" && invoiceId) {
        result = await updateInvoiceAction(invoiceId, data);
      } else {
        result = await createInvoiceAction(data);
      }
      if (!result) {
        toast.error("No response from server — please try again.");
        return null;
      }
      if ("error" in result && result.error) {
        toast.error(result.error, { duration: 5000 });
        return null;
      }
      const id = result.data!.id;
      setSavedInvoiceId(id);
      return id;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save invoice — please try again.", { duration: 5000 });
      return null;
    }
  }

  async function onSubmit(data: InvoiceFormData) {
    const id = await saveInvoice(data);
    if (id) {
      toast.success(mode === "edit" ? "Invoice updated!" : "Invoice saved!", { duration: 3000 });
      router.push(`/invoices/${id}`);
    }
  }

  async function handleDownloadPdf() {
    setDownloadLoading(true);
    try {
      const valid = await form.trigger();
      if (!valid) { toast.error("Please fill in all required fields."); return; }
      const data = form.getValues();
      const id = await saveInvoice(data);
      if (!id) return;
      window.open(`/api/invoices/${id}/pdf`, "_blank");
      await markAsSentAction(id);
      router.push(`/invoices/${id}`);
    } finally {
      setDownloadLoading(false);
    }
  }

  async function handleSend() {
    setSendLoading(true);
    try {
      const valid = await form.trigger();
      if (!valid) { toast.error("Please fill in all required fields."); return; }
      const data = form.getValues();
      const id = await saveInvoice(data);
      if (!id) return;
      setSendDialogOpen(true);
    } finally {
      setSendLoading(false);
    }
  }

  const title = mode === "edit" ? t("builder.editInvoice") : t("builder.newInvoice");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-surface-200 bg-white shrink-0 gap-2">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-surface-900 truncate">{title}</h1>
          <p className="text-xs text-surface-500 hidden sm:block">{t("builder.preview.subtitle")}</p>
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
            <span className="hidden lg:inline">{showPreview ? t("builder.hidePreview") : t("builder.showPreview")}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            loading={downloadLoading}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t("builder.downloadPdf")}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSend}
            loading={sendLoading}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{t("builder.send")}</span>
          </Button>
          <Button
            type="submit"
            form="invoice-form"
            loading={form.formState.isSubmitting}
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{mode === "edit" ? t("builder.update") : t("builder.save")}</span>
          </Button>
        </div>
      </div>

      {/* Split pane */}
      <div className={`flex flex-1 overflow-hidden ${showPreview ? "divide-x divide-surface-200" : ""}`}>
        {/* Form — full width on mobile, half on desktop when preview shown */}
        <div className={`overflow-y-auto ${showPreview ? "w-full md:w-1/2" : "w-full max-w-3xl mx-auto"}`}>
          <form
            id="invoice-form"
            onSubmit={form.handleSubmit(onSubmit, () => toast.error("Please fill in all required fields."))}
            noValidate
            className="p-4 md:p-6 space-y-6 pb-28 md:pb-10"
          >
            <CollapsibleCard title={t("builder.invoiceDetails")} defaultOpen>
              <MetadataSection form={form} defaultPaymentTerms={defaults.defaultPaymentTerms} showDueDate={defaults.showDueDate} />
            </CollapsibleCard>

            <CollapsibleCard title={t("builder.from")} defaultOpen={false}>
              <SenderSection form={form} />
            </CollapsibleCard>

            <CollapsibleCard title={t("builder.billTo")} defaultOpen>
              <ClientSection form={form} clients={clients} />
            </CollapsibleCard>

            <CollapsibleCard title={t("builder.lineItems")} defaultOpen>
              <LineItemsTable
                form={form}
                lineItemAmounts={lineItemAmounts}
                currency={currency}
                templates={templates}
              />
            </CollapsibleCard>

            <CollapsibleCard title={t("builder.totals")} defaultOpen>
              <FinancialSummary form={form} financials={financials} currency={currency} />
            </CollapsibleCard>

            <CollapsibleCard title={t("builder.notesTerms")} defaultOpen={false}>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-surface-700">{t("builder.notes")}</label>
                  <Controller
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder={t("builder.notesPlaceholder")}
                        minHeight="80px"
                      />
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-surface-700">{t("builder.paymentTerms")}</label>
                  <Controller
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder={t("builder.paymentTermsPlaceholder")}
                        minHeight="100px"
                      />
                    )}
                  />
                </div>
              </div>
            </CollapsibleCard>
          </form>
        </div>

        {/* Preview — hidden on mobile */}
        {showPreview && (
          <div className="hidden md:block md:w-1/2 overflow-hidden bg-surface-100">
            <InvoicePreview
              data={watchedValues as Partial<InvoiceFormData>}
              financials={financials}
              client={selectedClient}
              lineItemAmounts={lineItemAmounts}
              showDueDate={defaults.showDueDate}
            />
          </div>
        )}
      </div>

      {savedInvoiceId && (
        <SendDialog
          open={sendDialogOpen}
          onClose={() => setSendDialogOpen(false)}
          invoiceId={savedInvoiceId}
          invoiceNumber={watchedValues.invoiceNumber ?? ""}
          defaultEmail={selectedClient?.email ?? ""}
          defaultPhone={selectedClient?.phone ?? ""}
          onSent={() => router.push(`/invoices/${savedInvoiceId}`)}
        />
      )}
    </div>
  );
}
