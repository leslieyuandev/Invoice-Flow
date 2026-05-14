import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCatalogCategoryTree, getAllPackages, getAddOns } from "@/lib/services/proposal.service";
import { ProposalBuilder } from "@/components/proposal/ProposalBuilder";

export default async function NewProposalPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [categoryTree, packages, addOns, user] = await Promise.all([
    getCatalogCategoryTree(),
    getAllPackages(),
    getAddOns(),
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        logoUrl: true,
        companyPhone: true,
        companyEmail: true,
        defaultTerms: true,
      },
    }),
  ]);

  const contactLines = [
    user?.companyPhone && `📞 ${user.companyPhone}`,
    user?.companyEmail && `✉ ${user.companyEmail}`,
  ].filter(Boolean).join("\n");

  const initialTermsText = [
    user?.defaultTerms ?? "",
    contactLines,
  ].filter(Boolean).join("\n\n");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ProposalBuilder
        categoryTree={categoryTree}
        packages={packages}
        addOns={addOns}
        senderName={user?.name ?? ""}
        senderLogoUrl={user?.logoUrl ?? null}
        mode="create"
        initialData={{
          leadName: "",
          leadEmail: "",
          leadPhone: "",
          clientId: "",
          eventTitle: "",
          eventCategoryId: "",
          coverImageUrl: "",
          termsText: initialTermsText,
          selectedPackages: [],
          selectedAddOns: [],
          pagesCount: 1,
          addOnsEnabled: false,
          creativity: 50,
          elegance: 50,
        }}
      />
    </div>
  );
}
