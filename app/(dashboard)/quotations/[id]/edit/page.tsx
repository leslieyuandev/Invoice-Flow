import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getQuotationById } from "@/lib/services/quotation.service";
import { centsToDollars } from "@/lib/utils/calculations";
import { QuotationBuilder } from "@/components/quotation/QuotationBuilder";
import type { QuotationFormData } from "@/types";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditQuotationPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const quotation = await getQuotationById(id, session.user.id);
  if (!quotation) notFound();

  // Accepted/Declined quotations cannot be edited
  if (quotation.status === "ACCEPTED" || quotation.status === "DECLINED" || quotation.status === "EXPIRED") {
    redirect(`/quotations/${id}`);
  }

  const [clients, templates, user, existingQuotations] = await Promise.all([
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
        companyPhone: true,
        ssmNumber: true,
        defaultPaymentTerms: true,
        defaultNotes: true,
      },
    }),
    db.quotation.findMany({
      where: { userId: session.user.id, deletedAt: null, id: { not: id } },
      select: { quotationNumber: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const initialData: QuotationFormData = {
    quotationNumber: quotation.quotationNumber,
    issueDate: quotation.issueDate,
    expiryDate: quotation.expiryDate,
    currency: quotation.currency,
    clientId: quotation.clientId,
    senderName: quotation.senderName,
    senderEmail: quotation.senderEmail ?? "",
    senderAddress: quotation.senderAddress ?? "",
    senderPhone: quotation.senderPhone ?? user?.companyPhone ?? "",
    senderSsmNumber: quotation.senderSsmNumber ?? user?.ssmNumber ?? "",
    senderLogoUrl: quotation.senderLogoUrl ?? "",
    taxRate: Number(quotation.taxRate),
    discountType: quotation.discountType ?? undefined,
    discountValue: quotation.discountValue ? Number(quotation.discountValue) : undefined,
    notes: quotation.notes ?? "",
    lineItems: quotation.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      notes: item.notes ?? undefined,
      quantity: Number(item.quantity),
      unitPrice: centsToDollars(item.unitPrice),
      amount: centsToDollars(item.amount),
    })),
  };

  const userDefaults = {
    senderName: quotation.senderName,
    senderEmail: quotation.senderEmail ?? "",
    senderAddress: quotation.senderAddress ?? "",
    senderPhone: quotation.senderPhone ?? user?.companyPhone ?? "",
    senderSsmNumber: quotation.senderSsmNumber ?? user?.ssmNumber ?? "",
    senderLogoUrl: quotation.senderLogoUrl ?? "",
    defaultCurrency: quotation.currency,
    defaultExpiryDays: user?.defaultPaymentTerms ?? 30,
    defaultNotes: user?.defaultNotes ?? "",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <QuotationBuilder
        clients={clients}
        existingNumbers={existingQuotations.map((q) => q.quotationNumber)}
        userDefaults={userDefaults}
        templates={templates}
        mode="edit"
        initialData={initialData}
        quotationId={id}
      />
    </div>
  );
}
