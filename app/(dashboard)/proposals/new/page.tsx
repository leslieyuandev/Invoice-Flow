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
        proposalLogoUrl: true,
        companyPhone: true,
        companyEmail: true,
        proposalDefaultTerms: true,
      },
    }),
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ProposalBuilder
        categoryTree={categoryTree}
        packages={packages}
        addOns={addOns}
        senderName={user?.name ?? ""}
        senderLogoUrl={user?.proposalLogoUrl ?? user?.logoUrl ?? null}
        senderPhone={user?.companyPhone ?? null}
        senderEmail={user?.companyEmail ?? null}
        mode="create"
        initialData={{
          leadName: "",
          leadEmail: "",
          leadPhone: "",
          clientId: "",
          eventTitle: "",
          eventCategoryId: "",
          bgColor: "#C8151B",
          fontPair: "tenor-clear",
          coverImageUrl: "",
          termsText: user?.proposalDefaultTerms ?? "",
          selectedPackages: [],
          selectedAddOns: [],
          addOnsEnabled: false,
          compact: false,
        }}
      />
    </div>
  );
}
