import { db } from "@/lib/db";
import type {
  CatalogCategoryTree,
  CatalogPackageData,
  CatalogAddOnData,
  ProposalListItem,
  ProposalWithItems,
} from "@/types/proposal";
import type { CreateProposalInput } from "@/lib/validations/proposal";

export async function getCatalogCategoryTree(): Promise<CatalogCategoryTree[]> {
  const [all, pkgCounts] = await Promise.all([
    db.eventCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.catalogPackage.groupBy({ by: ["categoryId"], where: { isActive: true }, _count: true }),
  ]);

  const countMap = new Map<string, number>();
  for (const p of pkgCounts) countMap.set(p.categoryId, p._count);

  const map = new Map<string, CatalogCategoryTree>();
  for (const c of all) {
    map.set(c.id, { id: c.id, name: c.name, slug: c.slug, children: [], packageCount: countMap.get(c.id) ?? 0 });
  }

  const roots: CatalogCategoryTree[] = [];
  for (const c of all) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Propagate counts up: a parent has packages if any descendant does
  function propagate(node: CatalogCategoryTree): number {
    const childTotal = node.children.reduce((sum, ch) => sum + propagate(ch), 0);
    node.packageCount = node.packageCount + childTotal;
    return node.packageCount;
  }
  for (const r of roots) propagate(r);

  return roots;
}

export async function getAllPackages(): Promise<CatalogPackageData[]> {
  const packages = await db.catalogPackage.findMany({
    where: { isActive: true },
    include: { features: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return packages.map((p) => ({
    id: p.id,
    categoryId: p.categoryId,
    name: p.name,
    tagline: p.tagline,
    price: p.price,
    originalPrice: p.originalPrice,
    imageUrl: p.imageUrl,
    isBestSeller: p.isBestSeller,
    features: p.features.map((f) => f.text),
  }));
}

export async function getAddOns(): Promise<CatalogAddOnData[]> {
  const addOns = await db.catalogAddOn.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return addOns.map((a) => ({
    id: a.id,
    name: a.name,
    price: a.price,
    priceLabel: a.priceLabel,
    unit: (a as { unit?: string | null }).unit ?? null,
    imageUrl: a.imageUrl,
  }));
}

export async function getProposalsByUser(userId: string): Promise<ProposalListItem[]> {
  return db.proposal.findMany({
    where: { userId, deletedAt: null },
    select: {
      id: true,
      leadName: true,
      leadEmail: true,
      eventTitle: true,
      status: true,
      createdAt: true,
      sentAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProposalById(
  proposalId: string,
  userId: string
): Promise<ProposalWithItems | null> {
  return db.proposal.findFirst({
    where: { id: proposalId, userId, deletedAt: null },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      addOns: { orderBy: { sortOrder: "asc" } },
    },
  });
}

interface SenderSnapshot {
  senderName: string;
  senderEmail: string | null;
  senderLogoUrl: string | null;
  senderPhone: string | null;
}

export async function createProposal(
  userId: string,
  input: CreateProposalInput,
  sender: SenderSnapshot
): Promise<{ id: string }> {
  const proposal = await db.proposal.create({
    data: {
      userId,
      leadName: input.leadName,
      leadEmail: input.leadEmail || null,
      leadPhone: input.leadPhone || null,
      clientId: input.clientId || null,
      senderName: sender.senderName,
      senderEmail: sender.senderEmail,
      senderLogoUrl: sender.senderLogoUrl,
      senderPhone: sender.senderPhone,
      eventTitle: input.eventTitle,
      eventCategoryId: input.eventCategoryId,
      bgColor: input.bgColor || "#C8151B",
      coverTitle: input.coverTitle || null,
      coverImageUrl: input.coverImageUrl || null,
      termsText: input.termsText || null,
      addOnsEnabled: input.addOnsEnabled ?? false,
      compact: input.compact ?? false,
      items: {
        create: input.selectedPackages.map((pkg, idx) => ({
          sortOrder: pkg.sortOrder ?? idx,
          packageName: pkg.packageName,
          tagline: pkg.tagline,
          price: pkg.price,
          originalPrice: pkg.originalPrice,
          imageUrl: pkg.imageOverride || pkg.imageUrl || null,
          isBestSeller: pkg.isBestSeller,
          features: JSON.stringify(pkg.features),
        })),
      },
      addOns: {
        create: input.selectedAddOns.map((ao, idx) => ({
          sortOrder: ao.sortOrder ?? idx,
          addOnName: ao.addOnName,
          price: ao.price,
          priceLabel: ao.priceLabel,
          imageUrl: ao.imageUrl,
        })),
      },
    },
    select: { id: true },
  });

  return proposal;
}

export async function updateProposal(
  proposalId: string,
  userId: string,
  input: CreateProposalInput
): Promise<{ id: string }> {
  const existing = await db.proposal.findFirst({
    where: { id: proposalId, userId, deletedAt: null },
  });
  if (!existing) throw new Error("Proposal not found");
  if (existing.status !== "DRAFT") throw new Error("Only draft proposals can be edited");

  await db.$transaction([
    db.proposalItem.deleteMany({ where: { proposalId } }),
    db.proposalAddOnItem.deleteMany({ where: { proposalId } }),
    db.proposal.update({
      where: { id: proposalId },
      data: {
        leadName: input.leadName,
        leadEmail: input.leadEmail || null,
        leadPhone: input.leadPhone || null,
        clientId: input.clientId || null,
        eventTitle: input.eventTitle,
        eventCategoryId: input.eventCategoryId,
        bgColor: input.bgColor || "#C8151B",
        coverTitle: input.coverTitle || null,
        coverImageUrl: input.coverImageUrl || null,
        termsText: input.termsText || null,
        addOnsEnabled: input.addOnsEnabled ?? false,
        compact: input.compact ?? false,
        items: {
          create: input.selectedPackages.map((pkg, idx) => ({
            sortOrder: pkg.sortOrder ?? idx,
            packageName: pkg.packageName,
            tagline: pkg.tagline,
            price: pkg.price,
            originalPrice: pkg.originalPrice,
            imageUrl: pkg.imageOverride || pkg.imageUrl || null,
            isBestSeller: pkg.isBestSeller,
            features: JSON.stringify(pkg.features),
          })),
        },
        addOns: {
          create: input.selectedAddOns.map((ao, idx) => ({
            sortOrder: ao.sortOrder ?? idx,
            addOnName: ao.addOnName,
            price: ao.price,
            priceLabel: ao.priceLabel,
            imageUrl: ao.imageUrl,
          })),
        },
      },
    }),
  ]);

  return { id: proposalId };
}

export async function updateProposalStatus(
  proposalId: string,
  userId: string,
  status: "SENT" | "ACCEPTED" | "REJECTED"
) {
  const data: Record<string, unknown> = { status };
  if (status === "SENT") data.sentAt = new Date();

  return db.proposal.updateMany({
    where: { id: proposalId, userId, deletedAt: null },
    data,
  });
}

export async function softDeleteProposal(
  proposalId: string,
  userId: string
) {
  return db.proposal.updateMany({
    where: { id: proposalId, userId, status: { in: ["DRAFT", "REJECTED"] }, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}
