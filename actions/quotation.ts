"use server";

import { auth } from "@/lib/auth";
import { createQuotationSchema } from "@/lib/validations/quotation";
import {
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  softDeleteQuotation,
  convertQuotationToInvoice,
} from "@/lib/services/quotation.service";
import { revalidatePath } from "next/cache";

export async function createQuotationAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const parsed = createQuotationSchema.safeParse(formData);
  if (!parsed.success) return { error: "Validation failed", details: parsed.error.flatten().fieldErrors };
  try {
    const quotation = await createQuotation(session.user.id, parsed.data);
    revalidatePath("/");
    revalidatePath("/quotations");
    return { data: { id: quotation.id } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create quotation" };
  }
}

export async function updateQuotationAction(quotationId: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const parsed = createQuotationSchema.safeParse(formData);
  if (!parsed.success) return { error: "Validation failed", details: parsed.error.flatten().fieldErrors };
  try {
    await updateQuotation(quotationId, session.user.id, parsed.data);
    revalidatePath("/");
    revalidatePath("/quotations");
    revalidatePath(`/quotations/${quotationId}`);
    return { data: { id: quotationId } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update quotation" };
  }
}

export async function markQuotationSentAction(quotationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await updateQuotationStatus(quotationId, session.user.id, "SENT");
  revalidatePath("/quotations");
  revalidatePath(`/quotations/${quotationId}`);
  return { data: null };
}

export async function markQuotationAcceptedAction(quotationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await updateQuotationStatus(quotationId, session.user.id, "ACCEPTED");
  revalidatePath("/quotations");
  revalidatePath(`/quotations/${quotationId}`);
  return { data: null };
}

export async function markQuotationDeclinedAction(quotationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await updateQuotationStatus(quotationId, session.user.id, "DECLINED");
  revalidatePath("/quotations");
  revalidatePath(`/quotations/${quotationId}`);
  return { data: null };
}

export async function deleteQuotationAction(quotationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const affected = await softDeleteQuotation(quotationId, session.user.id);
  if (affected.count === 0) return { error: "Quotation not found or cannot be deleted" };
  revalidatePath("/");
  revalidatePath("/quotations");
  return { data: null };
}

export async function convertQuotationToInvoiceAction(quotationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  try {
    const invoiceId = await convertQuotationToInvoice(quotationId, session.user.id);
    revalidatePath("/invoices");
    revalidatePath("/quotations");
    revalidatePath(`/quotations/${quotationId}`);
    return { data: { invoiceId } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to convert quotation" };
  }
}
