import { z } from "zod";

const proposalPackageSchema = z.object({
  catalogPackageId: z.string().min(1),
  packageName: z.string().min(1).max(200),
  tagline: z.string().max(300).nullable(),
  price: z.number().int().min(0),
  originalPrice: z.number().int().min(0).nullable(),
  imageUrl: z.string().nullable(),
  imageOverride: z.string().max(1000),
  isBestSeller: z.boolean(),
  features: z.array(z.string()),
  sortOrder: z.number().int().min(0),
});

const proposalAddOnSchema = z.object({
  catalogAddOnId: z.string().min(1),
  addOnName: z.string().min(1).max(200),
  price: z.number().int().min(0).nullable(),
  priceLabel: z.string().max(100).nullable(),
  imageUrl: z.string().nullable(),
  quantity: z.number().int().min(1).max(999),
  sortOrder: z.number().int().min(0),
});

export const createProposalSchema = z.object({
  leadName: z.string().min(1, "Lead name is required").max(200).transform((v) => v.trim()),
  leadEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  leadPhone: z.string().max(50).optional().transform((v) => v?.trim()),
  clientId: z.string().optional().or(z.literal("")),
  eventTitle: z.string().min(1, "Event title is required").max(300).transform((v) => v.trim()),
  eventCategoryId: z.string().min(1, "Event category is required"),
  coverImageUrl: z.string().max(1000).optional().or(z.literal("")),
  termsText: z.string().max(5000).optional().transform((v) => v?.trim()),
  selectedPackages: z
    .array(proposalPackageSchema)
    .min(1, "Select at least one package"),
  selectedAddOns: z.array(proposalAddOnSchema),
});

export const updateProposalSchema = createProposalSchema;

export const sendProposalSchema = z.object({
  channel: z.enum(["email", "whatsapp"]),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().min(7).max(20).optional(),
  message: z.string().max(500).optional(),
}).refine(
  (data) => {
    if (data.channel === "email" && !data.recipientEmail) return false;
    if (data.channel === "whatsapp" && !data.recipientPhone) return false;
    return true;
  },
  { message: "Recipient contact is required for the selected channel" }
);

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
export type SendProposalInput = z.infer<typeof sendProposalSchema>;
