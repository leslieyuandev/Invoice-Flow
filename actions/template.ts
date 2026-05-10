"use server";

import { auth } from "@/lib/auth";
import { createTemplate, deleteTemplate, getTemplatesByUser } from "@/lib/services/template.service";
import { dollarsToCents } from "@/lib/utils/calculations";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200).transform((v) => v.trim()),
  description: z.string().max(500).optional().transform((v) => v?.trim() ?? ""),
  unitPrice: z.coerce.number().min(0, "Price must be 0 or greater"),
});

export async function createTemplateAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = templateSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Validation failed";
    return { error: firstError };
  }

  const template = await createTemplate(session.user.id, {
    name: parsed.data.name,
    description: parsed.data.description ?? "",
    unitPrice: dollarsToCents(parsed.data.unitPrice),
  });

  revalidatePath("/settings");
  return { data: template };
}

export async function deleteTemplateAction(templateId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await deleteTemplate(templateId, session.user.id);
  revalidatePath("/settings");
  return { data: null };
}

export async function getTemplatesAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return getTemplatesByUser(session.user.id);
}
