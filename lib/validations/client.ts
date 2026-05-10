import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(200).transform((v) => v.trim()),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(50).optional().transform((v) => v?.trim() || undefined),
  company: z.string().max(200).optional().transform((v) => v?.trim() || undefined),
  addressLine1: z.string().max(200).optional().transform((v) => v?.trim() || undefined),
  addressLine2: z.string().max(200).optional().transform((v) => v?.trim() || undefined),
  city: z.string().max(100).optional().transform((v) => v?.trim() || undefined),
  state: z.string().max(100).optional().transform((v) => v?.trim() || undefined),
  postalCode: z.string().max(20).optional().transform((v) => v?.trim() || undefined),
  country: z.string().max(100).optional().transform((v) => v?.trim() || undefined),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
