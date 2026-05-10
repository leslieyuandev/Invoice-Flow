import { z } from "zod";

// Zod v4: error messages use `error` (not `invalid_type_error` / `required_error`)
// Shorthand: pass a plain string → becomes the default error for that type

export const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description too long")
    .transform((v) => v.trim()),
  quantity: z
    .number({ error: "Quantity must be a number" })
    .positive("Quantity must be greater than 0")
    .max(99999, "Quantity too large"),
  unitPrice: z
    .number({ error: "Unit price must be a number" })
    .min(0, "Unit price cannot be negative")
    .max(99999999, "Unit price too large"),
  amount: z.number(),
});

export const createInvoiceSchema = z.object({
  invoiceNumber: z
    .string()
    .min(1, "Invoice number is required")
    .max(50)
    .transform((v) => v.trim()),
  clientId: z.string().min(1, "Client is required"),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  currency: z.string().length(3, "Invalid currency code"),
  senderName: z.string().min(1, "Sender name is required").max(200).transform((v) => v.trim()),
  senderEmail: z.string().email("Invalid sender email").optional().or(z.literal("")),
  senderAddress: z.string().max(500).optional().transform((v) => v?.trim()),
  senderPhone: z.string().max(50).optional().transform((v) => v?.trim()),
  senderLogoUrl: z.string().url().optional().or(z.literal("")),
  taxRate: z.number().min(0).max(100),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.number().min(0).optional(),
  notes: z.string().max(2000).optional().transform((v) => v?.trim()),
  terms: z.string().max(2000).optional().transform((v) => v?.trim()),
  lineItems: z
    .array(lineItemSchema)
    .min(1, "At least one line item is required")
    .max(100, "Too many line items"),
}).refine(
  (data) => data.dueDate >= data.issueDate,
  { message: "Due date must be on or after issue date", path: ["dueDate"] }
).refine(
  (data) => {
    if (data.discountType && (data.discountValue === undefined || data.discountValue === null)) {
      return false;
    }
    return true;
  },
  { message: "Discount value is required when discount type is set", path: ["discountValue"] }
);

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  status: z.enum(["DRAFT", "SENT", "VIEWED", "PAID", "OVERDUE", "CANCELLED"]).optional(),
});

export const sendInvoiceSchema = z.object({
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

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type SendInvoiceInput = z.infer<typeof sendInvoiceSchema>;
