"use server";

import { auth } from "@/lib/auth";
import { createInvoiceSchema, updateInvoiceSchema } from "@/lib/validations/invoice";
import { createInvoice, updateInvoiceStatus, getDashboardMetrics } from "@/lib/services/invoice.service";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createInvoiceAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = createInvoiceSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.flatten().fieldErrors };
  }

  const invoice = await createInvoice(session.user.id, parsed.data);
  revalidatePath("/");
  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

export async function saveDraftAction(invoiceId: string | null, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = updateInvoiceSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.flatten().fieldErrors };
  }

  if (!invoiceId) {
    const createParsed = createInvoiceSchema.safeParse({ ...parsed.data, status: "DRAFT" });
    if (!createParsed.success) {
      return { error: "Validation failed", details: createParsed.error.flatten().fieldErrors };
    }
    const invoice = await createInvoice(session.user.id, createParsed.data);
    revalidatePath("/invoices");
    return { data: { id: invoice.id } };
  }

  const existing = await db.invoice.findFirst({ where: { id: invoiceId, userId: session.user.id } });
  if (!existing) return { error: "Not found" };

  await db.invoice.update({ where: { id: invoiceId }, data: { status: "DRAFT" } });
  revalidatePath(`/invoices/${invoiceId}`);
  return { data: { id: invoiceId } };
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

  const invoice = await db.invoice.findFirst({ where: { id: invoiceId, userId: session.user.id } });
  if (!invoice) return { error: "Not found" };
  if (!["DRAFT", "CANCELLED"].includes(invoice.status)) {
    return { error: "Only draft or cancelled invoices can be deleted" };
  }

  await db.invoice.delete({ where: { id: invoiceId } });
  revalidatePath("/");
  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function getDashboardMetricsAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return getDashboardMetrics(session.user.id);
}
