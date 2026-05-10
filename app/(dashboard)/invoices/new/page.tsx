import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { InvoiceBuilder } from "@/components/invoice/InvoiceBuilder";

export default async function NewInvoicePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [clients, recentInvoices, user, templates] = await Promise.all([
    db.client.findMany({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: { name: "asc" },
    }),
    db.invoice.findMany({
      where: { userId: session.user.id, deletedAt: null },
      select: { invoiceNumber: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        companyName: true,
        companyEmail: true,
        companyAddress: true,
        companyPhone: true,
        logoUrl: true,
        defaultCurrency: true,
        defaultPaymentTerms: true,
        defaultNotes: true,
        defaultTerms: true,
        invoiceNumberPrefix: true,
      },
    }),
    db.lineItemTemplate.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  const userDefaults = {
    senderName: user?.companyName ?? user?.name ?? "",
    senderEmail: user?.companyEmail ?? "",
    senderAddress: user?.companyAddress ?? "",
    senderPhone: user?.companyPhone ?? "",
    senderLogoUrl: user?.logoUrl ?? "",
    defaultCurrency: user?.defaultCurrency ?? "MYR",
    defaultPaymentTerms: user?.defaultPaymentTerms ?? 30,
    defaultNotes: user?.defaultNotes ?? "",
    defaultTerms: user?.defaultTerms ?? "50% booking fees upon confirmation\n\nPlease make your payment to:\nBank: Public Bank\nAccount No.: 3823632829\nHalo Balloon Services",
    invoiceNumberPrefix: user?.invoiceNumberPrefix ?? "INV",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <InvoiceBuilder
        clients={clients}
        existingNumbers={recentInvoices.map((i) => i.invoiceNumber)}
        userDefaults={userDefaults}
        templates={templates}
        mode="create"
      />
    </div>
  );
}
