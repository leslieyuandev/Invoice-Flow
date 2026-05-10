"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100).transform((v) => v.trim()),
  lastName: z.string().min(1, "Last name is required").max(100).transform((v) => v.trim()),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().transform((v) => v?.trim() || undefined),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function registerAction(formData: unknown) {
  const parsed = registerSchema.safeParse(formData);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const firstError =
      flat.formErrors[0] ??
      Object.values(flat.fieldErrors).flat()[0] ??
      "Validation failed";
    return { error: firstError };
  }

  const { firstName, lastName, email, phone, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.create({
    data: { name: `${firstName} ${lastName}`, email, phone, passwordHash },
  });

  return { data: null };
}
