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
import { SenderSection } from "@/components/invoice/form/SenderSection";
import { ClientSection } from "@/components/invoice/form/ClientSection";
import { LineItemsTable } from "@/components/invoice/form/LineItemsTable";
import { FinancialSummary } from "@/components/invoice/form/FinancialSummary";
import { QuotationPreview } from "./preview/QuotationPreview";
import { SendDialog } from "@/components/invoice/SendDialog";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInvoiceCalculations } from "@/hooks/useInvoiceCalculations";
import { createQuotationSchema } from "@/lib/validations/quotation";
import { createQuotationAction, updateQuotationAction } from "@/actions/quotation";
import { generateInvoiceNumber } from "@/lib/utils/date";
import { SUPPORTED_CURRENCIES } from "@/lib/utils/currency";
import type { QuotationFormData, InvoiceFormData } from "@/types";
import type { Client, LineItemTemplate } from "@prisma/client";
import type { UseFormReturn } from "react-hook-form";

export interface QuotationUserDefaults {
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  senderPhone: string;
  senderSsmNumber: string;
  senderLogoUrl: string;
  defaultCurrency: string;
  defaultExpiryDays: number;
  defaultNotes: string;
}

interface QuotationBuilderProps {
  clients: Client[];
  existingNumbers?: string[];
  userDefaults?: QuotationUserDefaults;
  templates?: LineItemTemplate[];
  mode?: "create" | "edit";
  initialData?: QuotationFormData;
  quotationId?: string;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ensureHtml(text: string | null | undefined): string {
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return "<p>" + text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>") + "</p>";
}

export function QuotationBuilder({
  clients,
  existingNumbers = [],
  userDefaults,
  templates = [],
  mode = "create",
  initialData,
  quotationId,
}: QuotationBuilderProps) {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [savedQuotationId, setSavedQuotationId] = useState<string | null>(quotationId ?? null);
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
    defaultExpiryDays: 30,
    defaultNotes: "",
  };

  const issueDate = new Date();

  const form = useForm<QuotationFormData, unknown, QuotationFormData>({
    resolver: standardSchemaResolver(createQuotationSchema) as Resolver<QuotationFormData, unknown, QuotationFormData>,
    defaultValues: initialData
      ? {
          ...initialData,
          notes: ensureHtml(initialData.notes),
        }
      : {
          quotationNumber: generateInvoiceNumber("QT", existingNumbers),
          issueDate: toDateStr(issueDate) as unknown as Date,
          expiryDate: toDateStr(addDays(issueDate, defaults.defaultExpiryDays)) as unknown as Date,
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
        },
    mode: "onChange",
  });

  // useInvoiceCalculations works with any form that has lineItems/taxRate/discountType/discountValue
  const { financials, lineItemAmounts } = useInvoiceCalculations(
    form.control as unknown as UseFormReturn<InvoiceFormData>["control"]
  );
  const watchedValues = useWatch({ control: form.control });
  const currency = watchedValues.currency ?? defaults.defaultCurrency;
  const selectedClient = clients.find((c) => c.id === watchedValues.clientId);

  // Auto-update expiryDate when issueDate changes
  const watchedIssueDate = form.watch("issueDate");
  useEffect(() => {
    let parsed: Date;
    if (watchedIssueDate instanceof Date) {
      parsed = watchedIssueDate;
    } else {
      const parts = String(watchedIssueDate).split("-").map(Number);
      parsed = new Date(parts[0], parts[1] - 1, parts[2]);
    }
    if (!isNaN(parsed.getTime())) {
      form.setValue(
        "expiryDate",
        toDateStr(addDays(parsed, defaults.defaultExpiryDays)) as unknown as Date,
        { shouldValidate: false }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedIssueDate]);

  async function saveQuotation(data: QuotationFormData): Promise<string | null> {
    try {
      let result: { data?: { id: string }; error?: string } | undefined;
      if (mode === "edit" && quotationId) {
        result = await updateQuotationAction(quotationId, data);
      } else {
        result = await createQuotationAction(data);
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
      setSavedQuotationId(id);
      return id;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save quotation — please try again.", {
        duration: 5000,
      });
      return null;
    }
  }

  async function onSubmit(data: QuotationFormData) {
    const id = await saveQuotation(data);
    if (id) {
      toast.success(mode === "edit" ? "Quotation updated!" : "Quotation saved!", { duration: 3000 });
      router.push(`/quotations/${id}`);
    }
  }

  async function handleDownloadPdf() {
    setDownloadLoading(true);
    try {
      const valid = await form.trigger();
      if (!valid) {
        toast.error("Please fill in all required fields.");
        return;
      }
      const data = form.getValues();
      const id = await saveQuotation(data);
      if (!id) return;
      window.open(`/api/quotations/${id}/pdf`, "_blank");
      router.push(`/quotations/${id}`);
    } finally {
      setDownloadLoading(false);
    }
  }

  async function handleSend() {
    setSendLoading(true);
    try {
      const valid = await form.trigger();
      if (!valid) {
        toast.error("Please fill in all required fields.");
        return;
      }
      const data = form.getValues();
      const id = await saveQuotation(data);
      if (!id) return;
      setSendDialogOpen(true);
    } finally {
      setSendLoading(false);
    }
  }

  const title = mode === "edit" ? "Edit Quotation" : "New Quotation";
  const errors = form.formState.errors;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-surface-200 bg-white shrink-0 gap-2">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-surface-900 truncate">{title}</h1>
          <p className="text-xs text-surface-500 hidden sm:block">Live preview updates as you type</p>
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
            <span className="hidden lg:inline">{showPreview ? "Hide preview" : "Show preview"}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            loading={downloadLoading}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download PDF</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSend}
            loading={sendLoading}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
          <Button
            type="submit"
            form="quotation-form"
            loading={form.formState.isSubmitting}
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{mode === "edit" ? "Update" : "Save"}</span>
          </Button>
        </div>
      </div>

      {/* Split pane */}
      <div className={`flex flex-1 overflow-hidden ${showPreview ? "divide-x divide-surface-200" : ""}`}>
        {/* Form */}
        <div className={`overflow-y-auto ${showPreview ? "w-full md:w-1/2" : "w-full max-w-3xl mx-auto"}`}>
          <form
            id="quotation-form"
            onSubmit={form.handleSubmit(onSubmit, () => toast.error("Please fill in all required fields."))}
            noValidate
            className="p-4 md:p-6 space-y-6 pb-28 md:pb-10"
          >
            {/* Quotation Details */}
            <CollapsibleCard title="Quotation Details" defaultOpen>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label required>Quotation Number</Label>
                  <Input
                    {...form.register("quotationNumber")}
                    placeholder="QT-2026-0001"
                    error={errors.quotationNumber?.message}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label required>Currency</Label>
                  <select
                    {...form.register("currency")}
                    className="flex h-9 w-full rounded-md border border-surface-200 bg-white px-3 py-1 text-sm text-surface-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
                  <Label required>Issue Date</Label>
                  <Input
                    type="date"
                    {...form.register("issueDate")}
                    error={errors.issueDate?.message}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
                  <Label required>Expiry Date</Label>
                  <Input
                    type="date"
                    {...form.register("expiryDate")}
                    error={errors.expiryDate?.message}
                  />
                  <p className="text-xs text-surface-400">
                    Valid for {defaults.defaultExpiryDays} days by default
                  </p>
                </div>
              </div>
            </CollapsibleCard>

            <CollapsibleCard title="From" defaultOpen={false}>
              <SenderSection form={form as unknown as UseFormReturn<InvoiceFormData>} />
            </CollapsibleCard>

            <CollapsibleCard title="Bill To" defaultOpen>
              <ClientSection
                form={form as unknown as UseFormReturn<InvoiceFormData>}
                clients={clients}
              />
            </CollapsibleCard>

            <CollapsibleCard title="Line Items" defaultOpen>
              <LineItemsTable
                form={form as unknown as UseFormReturn<InvoiceFormData>}
                lineItemAmounts={lineItemAmounts}
                currency={currency}
                templates={templates}
              />
            </CollapsibleCard>

            <CollapsibleCard title="Totals" defaultOpen>
              <FinancialSummary
                form={form as unknown as UseFormReturn<InvoiceFormData>}
                financials={financials}
                currency={currency}
              />
            </CollapsibleCard>

            <CollapsibleCard title="Notes" defaultOpen={false}>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-surface-700">Notes</label>
                <Controller
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Any additional notes for the client…"
                      minHeight="80px"
                    />
                  )}
                />
              </div>
            </CollapsibleCard>
          </form>
        </div>

        {/* Preview — hidden on mobile */}
        {showPreview && (
          <div className="hidden md:block md:w-1/2 overflow-hidden bg-surface-100">
            <QuotationPreview
              data={watchedValues as Partial<QuotationFormData>}
              financials={financials}
              client={selectedClient}
              lineItemAmounts={lineItemAmounts}
              showExpiryDate
            />
          </div>
        )}
      </div>

      {savedQuotationId && (
        <SendDialog
          open={sendDialogOpen}
          onClose={() => setSendDialogOpen(false)}
          invoiceId={savedQuotationId}
          invoiceNumber={watchedValues.quotationNumber ?? ""}
          defaultEmail={selectedClient?.email ?? ""}
          defaultPhone={selectedClient?.phone ?? ""}
          onSent={() => router.push(`/quotations/${savedQuotationId}`)}
          sendApiPath={`/api/quotations/${savedQuotationId}/send`}
        />
      )}
    </div>
  );
}
