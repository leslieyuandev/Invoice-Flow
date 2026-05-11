"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(200).transform((v) => v.trim()),
  companyName: z.string().max(200).optional().transform((v) => v?.trim() || undefined),
  companyEmail: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
  companyPhone: z.string().max(50).optional().transform((v) => v?.trim() || undefined),
  companyAddress: z.string().max(500).optional().transform((v) => v?.trim() || undefined),
  defaultCurrency: z.string().length(3).optional(),
  defaultPaymentTerms: z.coerce.number().int().min(1).max(365).optional(),
  defaultNotes: z.string().max(2000).optional().transform((v) => v?.trim() || undefined),
  defaultTerms: z.string().max(2000).optional().transform((v) => v?.trim() || undefined),
  invoiceNumberPrefix: z.string().max(20).optional().transform((v) => v?.trim() || undefined),
  showDueDate: z.boolean().optional(),
});

export async function updateProfileAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = profileSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.flatten().fieldErrors };
  }

  await db.user.update({ where: { id: session.user.id }, data: parsed.data });
  revalidatePath("/settings");
  return { data: null };
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function changePasswordAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = passwordSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.newPassword?.[0] ?? "Validation failed" };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) {
    return { error: "Password change is not available for OAuth accounts" };
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.user.update({ where: { id: session.user.id }, data: { passwordHash } });
  return { data: null };
}
