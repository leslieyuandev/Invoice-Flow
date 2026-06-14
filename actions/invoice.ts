"use server";

import { auth } from "@/lib/auth";
import { createInvoiceSchema } from "@/lib/validations/invoice";
import {
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  softDeleteInvoice,
  getDashboardMetrics,
} from "@/lib/services/invoice.service";
import { revalidatePath } from "next/cache";

export async function createInvoiceAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = createInvoiceSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.flatten().fieldErrors };
  }

  try {
    const invoice = await createInvoice(session.user.id, parsed.data);
    revalidatePath("/");
    revalidatePath("/invoices");
    return { data: { id: invoice.id } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create invoice" };
  }
}

export async function updateInvoiceAction(invoiceId: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = createInvoiceSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateInvoice(invoiceId, session.user.id, parsed.data);
    revalidatePath("/");
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    return { data: { id: invoiceId } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update invoice" };
  }
}

export async function markAsSentAction(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await updateInvoiceStatus(invoiceId, session.user.id, "SENT");
  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  return { data: null };
}

export async function markAsPaidAction(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await updateInvoiceStatus(invoiceId, session.user.id, "PAID");
  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  return { data: null };
}

export async function deleteInvoiceAction(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const affected = await softDeleteInvoice(invoiceId, session.user.id);
  if (affected.count === 0) {
    return { error: "Invoice not found or cannot be deleted in its current status" };
  }

  revalidatePath("/");
  revalidatePath("/invoices");
  return { data: null };
}

export async function getDashboardMetricsAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return getDashboardMetrics(session.user.id);
}
