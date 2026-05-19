import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getInvoiceById } from "@/lib/services/invoice.service";
import { centsToDollars } from "@/lib/utils/calculations";
import { InvoiceBuilder } from "@/components/invoice/InvoiceBuilder";
import type { InvoiceFormData } from "@/types";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditInvoicePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const invoice = await getInvoiceById(id, session.user.id);
  if (!invoice) notFound();

  // Cancelled invoices cannot be edited
  if (invoice.status === "CANCELLED") redirect(`/invoices/${id}`);

  const [clients, templates, user, existingInvoices] = await Promise.all([
    db.client.findMany({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: { name: "asc" },
    }),
    db.lineItemTemplate.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        defaultPaymentTerms: true,
        defaultNotes: true,
        defaultTerms: true,
        showDueDate: true,
      },
    }),
    db.invoice.findMany({
      where: { userId: session.user.id, deletedAt: null, id: { not: id } },
      select: { invoiceNumber: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const initialData: InvoiceFormData = {
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

  // userDefaults sourced from the invoice snapshot to preserve sender info
  const userDefaults = {
    senderName: invoice.senderName,
    senderEmail: invoice.senderEmail ?? "",
    senderAddress: invoice.senderAddress ?? "",
    senderPhone: invoice.senderPhone ?? "",
    senderSsmNumber: (invoice as any).senderSsmNumber ?? "",
    senderLogoUrl: invoice.senderLogoUrl ?? "",
    defaultCurrency: invoice.currency,
    defaultPaymentTerms: user?.defaultPaymentTerms ?? 30,
    defaultNotes: user?.defaultNotes ?? "",
    defaultTerms: user?.defaultTerms ?? "",
    invoiceNumberPrefix: "INV",
    showDueDate: user?.showDueDate ?? true,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <InvoiceBuilder
        clients={clients}
        existingNumbers={existingInvoices.map((i) => i.invoiceNumber)}
        userDefaults={userDefaults}
        templates={templates}
        mode="edit"
        initialData={initialData}
        invoiceId={id}
      />
    </div>
  );
}
