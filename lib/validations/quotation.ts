import { z } from "zod";
import { lineItemSchema } from "./invoice";

const quotationBaseSchema = z.object({
  quotationNumber: z.string().min(1, "Quotation number is required").max(50).transform((v) => v.trim()),
  clientId: z.string().min(1, "Client is required"),
  issueDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  currency: z.string().length(3, "Invalid currency code"),
  senderName: z.string().min(1, "Sender name is required").max(200).transform((v) => v.trim()),
  senderEmail: z.string().email("Invalid sender email").optional().or(z.literal("")),
  senderAddress: z.string().max(500).optional().transform((v) => v?.trim()),
  senderPhone: z.string().max(50).optional().transform((v) => v?.trim()),
  senderSsmNumber: z.string().max(50).optional().transform((v) => v?.trim()),
  senderLogoUrl: z.string().url().optional().or(z.literal("")),
  taxRate: z.number().min(0).max(100),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional().or(z.literal("")).transform(v => (v === "" ? undefined : v)),
  discountValue: z.number().min(0).optional(),
  notes: z.string().max(2000).optional().transform((v) => v?.trim()),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required").max(100),
});

export const createQuotationSchema = quotationBaseSchema.refine(
  (data) => data.expiryDate >= data.issueDate,
  { message: "Expiry date must be on or after issue date", path: ["expiryDate"] }
).refine(
  (data) => {
    if (data.discountType && (data.discountValue === undefined || data.discountValue === null)) return false;
    return true;
  },
  { message: "Discount value is required when discount type is set", path: ["discountValue"] }
);

export const sendQuotationSchema = z.object({
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

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type SendQuotationInput = z.infer<typeof sendQuotationSchema>;
