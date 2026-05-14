import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProposalById, getCatalogCategoryTree, getAllPackages, getAddOns } from "@/lib/services/proposal.service";
import { ProposalBuilder } from "@/components/proposal/ProposalBuilder";
import type { ProposalFormData } from "@/types/proposal";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditProposalPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const proposal = await getProposalById(id, session.user.id);
  if (!proposal) notFound();

  if (proposal.status !== "DRAFT") redirect(`/proposals/${id}`);

  const [categoryTree, packages, addOns, user] = await Promise.all([
    getCatalogCategoryTree(),
    getAllPackages(),
    getAddOns(),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, logoUrl: true, companyPhone: true, companyEmail: true },
    }),
  ]);

  const p = proposal as typeof proposal & { bgColor?: string; coverTitle?: string };

  const initialData: ProposalFormData = {
    leadName: proposal.leadName,
    leadEmail: proposal.leadEmail ?? "",
    leadPhone: proposal.leadPhone ?? "",
    clientId: proposal.clientId ?? "",
    eventTitle: proposal.eventTitle,
    eventCategoryId: proposal.eventCategoryId,
    bgColor: p.bgColor ?? "#C8151B",
    coverTitle: p.coverTitle ?? "",
    coverImageUrl: proposal.coverImageUrl ?? "",
    termsText: proposal.termsText ?? "",
    selectedPackages: proposal.items.map((item, idx) => {
      let features: string[] = [];
      try { features = JSON.parse(item.features) as string[]; } catch { features = []; }
      return {
        catalogPackageId: item.id,
        packageName: item.packageName,
        tagline: item.tagline,
        price: item.price,
        originalPrice: item.originalPrice,
        imageUrl: item.imageUrl,
        imageOverride: "",
        isBestSeller: item.isBestSeller,
        features,
        sortOrder: item.sortOrder ?? idx,
      };
    }),
    selectedAddOns: proposal.addOns.map((ao, idx) => ({
      catalogAddOnId: ao.id,
      addOnName: ao.addOnName,
      price: ao.price,
      priceLabel: ao.priceLabel,
      imageUrl: ao.imageUrl,
      sortOrder: ao.sortOrder ?? idx,
    })),
    addOnsEnabled: (proposal as typeof proposal & { addOnsEnabled?: boolean }).addOnsEnabled ?? false,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ProposalBuilder
        categoryTree={categoryTree}
        packages={packages}
        addOns={addOns}
        senderName={user?.name ?? proposal.senderName}
        senderLogoUrl={user?.logoUrl ?? proposal.senderLogoUrl}
        senderPhone={user?.companyPhone ?? proposal.senderPhone}
        senderEmail={user?.companyEmail ?? proposal.senderEmail}
        mode="edit"
        initialData={initialData}
        proposalId={id}
        defaultLeadEmail={proposal.leadEmail ?? ""}
        defaultLeadPhone={proposal.leadPhone ?? ""}
      />
    </div>
  );
}
