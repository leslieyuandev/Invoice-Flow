import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getInvoiceById } from "@/lib/services/invoice.service";
import { centsToDollars, formatCurrency } from "@/lib/utils/calculations";
import { InvoicePreview } from "@/components/invoice/preview/InvoicePreview";
import { InvoiceActions } from "@/components/invoice/InvoiceActions";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { getServerT } from "@/lib/i18n/server";
import type { InvoiceFormData, InvoiceFinancials } from "@/types";

type PageProps = { params: Promise<{ id: string }> };

export default async function InvoiceDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const [invoice, userSettings] = await Promise.all([
    getInvoiceById(id, session.user.id),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { showDueDate: true },
    }),
  ]);
  if (!invoice) notFound();

  const t = await getServerT();
  const showDueDate = userSettings?.showDueDate ?? true;

  // Convert DB cents → form-compatible dollars for InvoicePreview
  const previewData: Partial<InvoiceFormData> = {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    clientId: invoice.clientId,
    senderName: invoice.senderName,
    senderEmail: invoice.senderEmail ?? "",
    senderAddress: invoice.senderAddress ?? "",
    senderPhone: invoice.senderPhone ?? "",
    senderSsmNumber: (invoice as any).senderSsmNumber ?? "",
    senderLogoUrl: invoice.senderLogoUrl ?? "",
    taxRate: Number(invoice.taxRate),
    discountType: invoice.discountType ?? undefined,
    discountValue: invoice.discountValue ? Number(invoice.discountValue) : undefined,
    notes: invoice.notes ?? "",
    terms: invoice.terms ?? "",
    lineItems: invoice.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      notes: item.notes ?? undefined,
      quantity: Number(item.quantity),
      unitPrice: centsToDollars(item.unitPrice),
      amount: centsToDollars(item.amount),
    })),
  };

  const financials: InvoiceFinancials = {
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    discountAmount: invoice.discountAmount ?? 0,
    total: invoice.total,
  };

  const lineItemAmounts = invoice.lineItems.map((item) => item.amount);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-surface-200 bg-white shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t("actions.back")}</span>
            </Link>
          </Button>
          <div className="h-4 w-px bg-surface-200" />
          <h1 className="text-sm font-semibold text-surface-900 truncate">{invoice.invoiceNumber}</h1>
          <StatusBadge status={invoice.status} />
          {invoice.quotation && (
            <Link
              href={`/quotations/${invoice.quotation.id}`}
              className="hidden sm:inline text-xs text-teal-600 hover:text-teal-700 hover:underline whitespace-nowrap"
              title="View source quotation"
            >
              {invoice.quotation.quotationNumber}
            </Link>
          )}
          <span className="text-sm text-surface-500 hidden md:block">
            {formatCurrency(invoice.total, invoice.currency)}
          </span>
        </div>
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {invoice.status !== "CANCELLED" && (
            <Button variant="outline" size="sm" asChild title={t("actions.edit")}>
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">{t("actions.edit")}</span>
              </Link>
            </Button>
          )}
          <InvoiceActions
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoiceNumber}
            status={invoice.status}
            clientEmail={invoice.clientEmail ?? ""}
            clientPhone={invoice.client?.phone ?? undefined}
          />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <InvoicePreview
          data={previewData}
          financials={financials}
          client={invoice.client}
          lineItemAmounts={lineItemAmounts}
          showDueDate={showDueDate}
        />
      </div>
    </div>
  );
}
