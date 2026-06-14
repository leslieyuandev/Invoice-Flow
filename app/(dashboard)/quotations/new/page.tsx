import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { QuotationBuilder } from "@/components/quotation/QuotationBuilder";

export default async function NewQuotationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [clients, existingQuotations, user, templates] = await Promise.all([
    db.client.findMany({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: { name: "asc" },
    }),
    db.quotation.findMany({
      where: { userId: session.user.id },
      select: { quotationNumber: true },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        companyName: true,
        companyEmail: true,
        companyAddress: true,
        companyPhone: true,
        ssmNumber: true,
        logoUrl: true,
        defaultCurrency: true,
        defaultPaymentTerms: true,
        defaultNotes: true,
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
    senderSsmNumber: user?.ssmNumber ?? "",
    senderLogoUrl: user?.logoUrl ?? "",
    defaultCurrency: user?.defaultCurrency ?? "MYR",
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
        mode="create"
      />
    </div>
  );
}
