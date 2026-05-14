import type { Proposal, ProposalItem, ProposalAddOnItem, ProposalStatus } from "@prisma/client";

export type { ProposalStatus };

export type ProposalListItem = Pick<
  Proposal,
  "id" | "leadName" | "leadEmail" | "eventTitle" | "status" | "createdAt" | "sentAt"
>;

export type ProposalWithItems = Proposal & {
  items: ProposalItem[];
  addOns: ProposalAddOnItem[];
};

export interface CatalogCategoryTree {
  id: string;
  name: string;
  slug: string;
  children: CatalogCategoryTree[];
  packageCount: number;
}

export interface CatalogPackageData {
  id: string;
  categoryId: string;
  name: string;
  tagline: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  isBestSeller: boolean;
  features: string[];
}

export interface CatalogAddOnData {
  id: string;
  name: string;
  price: number | null;
  priceLabel: string | null;
  unit: string | null;
  imageUrl: string | null;
}

export interface ProposalPackageFormItem {
  catalogPackageId: string;
  packageName: string;
  tagline: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  imageOverride: string;
  isBestSeller: boolean;
  features: string[];
  sortOrder: number;
}

export interface ProposalAddOnFormItem {
  catalogAddOnId: string;
  addOnName: string;
  price: number | null;
  priceLabel: string | null;
  imageUrl: string | null;
  quantity: number;
  sortOrder: number;
}

export interface ProposalFormData {
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  clientId: string;
  eventTitle: string;
  eventCategoryId: string;
  coverImageUrl: string;
  termsText: string;
  selectedPackages: ProposalPackageFormItem[];
  selectedAddOns: ProposalAddOnFormItem[];
  pagesCount: number;
  addOnsEnabled: boolean;
  creativity: number;
  elegance: number;
}
