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

  revalidatePath("/invoices/new");
  return { data: client };
}

export async function updateClientAction(clientId: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db.client.findFirst({ where: { id: clientId, userId: session.user.id } });
  if (!existing) return { error: "Not found" };

  const parsed = updateClientSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.flatten().fieldErrors };
  }

  const client = await db.client.update({ where: { id: clientId }, data: parsed.data });
  revalidatePath("/invoices/new");
  return { data: client };
}

export async function getClientsAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db.client.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });
}

export async function deleteClientAction(clientId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db.client.findFirst({
    where: { id: clientId, userId: session.user.id },
    include: { _count: { select: { invoices: true } } },
  });

  if (!existing) return { error: "Not found" };
  if (existing._count.invoices > 0) {
    return { error: "Cannot delete a client with existing invoices" };
  }

  await db.client.delete({ where: { id: clientId } });
  revalidatePath("/invoices/new");
  return { data: null };
}
