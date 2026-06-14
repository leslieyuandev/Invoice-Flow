import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TopBar } from "@/components/layout/TopBar";
import { ProfileForm } from "@/components/settings/ProfileForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, templates] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        companyName: true,
        companyEmail: true,
        companyPhone: true,
        companyAddress: true,
        ssmNumber: true,
        defaultCurrency: true,
        defaultPaymentTerms: true,
        defaultNotes: true,
        defaultTerms: true,
        invoiceNumberPrefix: true,
        logoUrl: true,
        proposalLogoUrl: true,
        watermarkUrl: true,
        proposalDefaultTerms: true,
        passwordHash: true,
        showDueDate: true,
      },
    }),
    db.lineItemTemplate.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="Settings" subtitle="Manage your profile and preferences" />
      <div className="p-6 max-w-2xl">
        <ProfileForm
          user={{
            name: user.name ?? "",
            email: user.email,
            companyName: user.companyName ?? "",
            companyEmail: user.companyEmail ?? "",
            companyPhone: user.companyPhone ?? "",
            companyAddress: user.companyAddress ?? "",
            ssmNumber: user.ssmNumber ?? "",
            defaultCurrency: user.defaultCurrency,
            defaultPaymentTerms: user.defaultPaymentTerms ?? 30,
            defaultNotes: user.defaultNotes ?? "",
            defaultTerms: user.defaultTerms ?? "50% booking fees upon confirmation\n\nPlease make your payment to:\nBank: Public Bank\nAccount No.: 3823632829\nHalo Balloon Services",
            invoiceNumberPrefix: user.invoiceNumberPrefix ?? "INV",
            logoUrl: user.logoUrl ?? "",
            proposalLogoUrl: user.proposalLogoUrl ?? "",
            watermarkUrl: user.watermarkUrl ?? "",
            proposalDefaultTerms: user.proposalDefaultTerms ?? "",
            hasPassword: !!user.passwordHash,
            showDueDate: user.showDueDate ?? true,
          }}
          templates={templates}
        />
      </div>
    </div>
  );
}
