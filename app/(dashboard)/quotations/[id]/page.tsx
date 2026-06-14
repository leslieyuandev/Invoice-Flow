import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getQuotationById } from "@/lib/services/quotation.service";
import { centsToDollars, formatCurrency } from "@/lib/utils/calculations";
import { QuotationPreview } from "@/components/quotation/preview/QuotationPreview";
import { QuotationActions } from "@/components/quotation/QuotationActions";
import { QuotationStatusBadge } from "@/components/quotation/QuotationStatusBadge";
import { Button } from "@/components/ui/button";
import type { QuotationFormData, InvoiceFinancials } from "@/types";

type PageProps = { params: Promise<{ id: string }> };

export default async function QuotationDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  // Fetch quotation with invoice relation to check if already converted
  const quotationRaw = await db.quotation.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      client: true,
      invoice: { select: { id: true, invoiceNumber: true } },
    },
  });

  if (!quotationRaw) notFound();

  const previewData: Partial<QuotationFormData> = {
    quotationNumber: quotationRaw.quotationNumber,
    issueDate: quotationRaw.issueDate,
    expiryDate: quotationRaw.expiryDate,
    currency: quotationRaw.currency,
    clientId: quotationRaw.clientId,
    senderName: quotationRaw.senderName,
    senderEmail: quotationRaw.senderEmail ?? "",
    senderAddress: quotationRaw.senderAddress ?? "",
    senderPhone: quotationRaw.senderPhone ?? "",
    senderSsmNumber: quotationRaw.senderSsmNumber ?? "",
    senderLogoUrl: quotationRaw.senderLogoUrl ?? "",
    taxRate: Number(quotationRaw.taxRate),
    discountType: quotationRaw.discountType ?? undefined,
    discountValue: quotationRaw.discountValue ? Number(quotationRaw.discountValue) : undefined,
    notes: quotationRaw.notes ?? "",
    lineItems: quotationRaw.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      notes: item.notes ?? undefined,
      quantity: Number(item.quantity),
      unitPrice: centsToDollars(item.unitPrice),
      amount: centsToDollars(item.amount),
    })),
  };

  const financials: InvoiceFinancials = {
    subtotal: quotationRaw.subtotal,
    taxAmount: quotationRaw.taxAmount,
    discountAmount: quotationRaw.discountAmount ?? 0,
    total: quotationRaw.total,
  };

  const lineItemAmounts = quotationRaw.lineItems.map((item) => item.amount);
  const alreadyConverted = !!(quotationRaw as any).invoice;
  const canEdit = quotationRaw.status === "DRAFT" || quotationRaw.status === "SENT";

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-surface-200 bg-white shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/quotations">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>
          <div className="h-4 w-px bg-surface-200" />
          <h1 className="text-sm font-semibold text-surface-900 truncate">{quotationRaw.quotationNumber}</h1>
          <QuotationStatusBadge status={quotationRaw.status} />
          {(quotationRaw as any).invoice && (
            <Link
              href={`/invoices/${(quotationRaw as any).invoice.id}`}
              className="hidden sm:inline text-xs text-brand-600 hover:text-brand-700 hover:underline whitespace-nowrap"
              title="View converted invoice"
            >
              {(quotationRaw as any).invoice.invoiceNumber}
            </Link>
          )}
          <span className="text-sm text-surface-500 hidden md:block">
            {formatCurrency(quotationRaw.total, quotationRaw.currency)}
          </span>
        </div>
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {canEdit && (
            <Button variant="outline" size="sm" asChild title="Edit">
              <Link href={`/quotations/${quotationRaw.id}/edit`}>
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </Link>
            </Button>
          )}
          <QuotationActions
            quotationId={quotationRaw.id}
            quotationNumber={quotationRaw.quotationNumber}
            status={quotationRaw.status}
            clientEmail={quotationRaw.clientEmail ?? ""}
            clientPhone={quotationRaw.client?.phone ?? undefined}
            alreadyConverted={alreadyConverted}
          />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <QuotationPreview
          data={previewData}
          financials={financials}
          client={quotationRaw.client}
          lineItemAmounts={lineItemAmounts}
          showExpiryDate
        />
      </div>
    </div>
  );
}
