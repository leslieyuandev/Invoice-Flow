import { z } from "zod";

/**
 * Product form input. Prices are entered in major currency units (RM) and
 * converted to cents inside the server action. `listPrice` is the DEFAULT
 * selling price — it is editable per line item when the product is used, never
 * permanent.
 */

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((v) => v?.trim() || undefined);

// Accepts "", a number, or null from the form and normalises to number | null.
const optionalMoney = z
  .union([z.number(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v === "" || v == null ? null : Number(v)))
  .refine((v) => v == null || (Number.isFinite(v) && v >= 0), {
    message: "Must be a positive amount",
  });

const optionalQty = z
  .union([z.number(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v === "" || v == null ? null : Number(v)))
  .refine((v) => v == null || (Number.isFinite(v) && v >= 0), {
    message: "Must be a positive number",
  });

const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((v) => v == null || !isNaN(v.getTime()), { message: "Invalid date" });

export const createProductSchema = z
  .object({
    name: z.string().min(1, "Product name is required").max(200).transform((v) => v.trim()),
    sku: optionalText(100),
    category: optionalText(100),
    vendorName: optionalText(200),
    manufacturer: optionalText(200),
    isActive: z.boolean().default(true),

    salesStartDate: optionalDate,
    salesEndDate: optionalDate,

    currency: z.string().min(1).max(8).default("MYR"),
    costPriceRm: optionalMoney,
    listPriceRm: z
      .union([z.number(), z.string()])
      .transform((v) => Number(v))
      .refine((v) => Number.isFinite(v) && v >= 0, { message: "Enter a valid list price" }),
    taxRate: z
      .union([z.number(), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v === "" || v == null ? null : Number(v)))
      .refine((v) => v == null || (Number.isFinite(v) && v >= 0 && v <= 100), {
        message: "Tax rate must be between 0 and 100",
      }),
    taxable: z.boolean().default(true),

    unit: optionalText(50),
    quantityInStock: optionalQty,
    reorderLevel: optionalQty,

    description: z
      .string()
      .max(5000)
      .optional()
      .transform((v) => v?.trim() || undefined),
  })
  .refine(
    (d) => !d.salesStartDate || !d.salesEndDate || d.salesEndDate >= d.salesStartDate,
    { message: "Sales end date must be after the start date", path: ["salesEndDate"] }
  );

export const updateProductSchema = createProductSchema;

export type CreateProductInput = z.input<typeof createProductSchema>;
