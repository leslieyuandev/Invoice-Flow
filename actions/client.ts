"use server";

import { auth } from "@/lib/auth";
import { createClientSchema, updateClientSchema } from "@/lib/validations/client";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createClientAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = createClientSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.flatten().fieldErrors };
  }

  const client = await db.client.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  revalidatePath("/clients");
  revalidatePath("/invoices/new");
  return { data: client };
}

export async function updateClientAction(clientId: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db.client.findFirst({
    where: { id: clientId, userId: session.user.id, deletedAt: null },
  });
  if (!existing) return { error: "Not found" };

  const parsed = updateClientSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.flatten().fieldErrors };
  }

  const client = await db.client.update({ where: { id: clientId }, data: parsed.data });
  revalidatePath("/clients");
  revalidatePath("/invoices/new");
  return { data: client };
}

export async function getClientsAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db.client.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function deleteClientAction(clientId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db.client.findFirst({
    where: { id: clientId, userId: session.user.id, deletedAt: null },
  });
  if (!existing) return { error: "Not found" };

  // Check for active (non-deleted) invoices
  const activeInvoiceCount = await db.invoice.count({
    where: { clientId, deletedAt: null },
  });
  if (activeInvoiceCount > 0) {
    return { error: "Cannot delete a client with existing invoices" };
  }

  await db.client.update({
    where: { id: clientId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/clients");
  revalidatePath("/invoices/new");
  return { data: null };
}
