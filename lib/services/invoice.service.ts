import { db } from "@/lib/db";
import { calculateInvoiceFinancials, dollarsToCents } from "@/lib/utils/calculations";
import type { CreateInvoiceInput } from "@/lib/validations/invoice";
import type { InvoiceWithRelations, InvoiceListItem, DashboardMetrics } from "@/types";

export async function getInvoicesByUser(userId: string): Promise<InvoiceListItem[]> {
  return db.invoice.findMany({
    where: { userId, deletedAt: null },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      total: true,
      currency: true,
      issueDate: true,
      dueDate: true,
      clientName: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoiceById(
  invoiceId: string,
  userId: string
): Promise<InvoiceWithRelations | null> {
  return db.invoice.findFirst({
    where: { id: invoiceId, userId, deletedAt: null },
    include: { lineItems: { orderBy: { sortOrder: "asc" } }, client: true },
  });
}

export async function createInvoice(userId: string, input: CreateInvoiceInput) {
  const client = await db.client.findFirst({ where: { id: input.clientId, userId, deletedAt: null } });
  if (!client) throw new Error("Client not found");

  const financials = calculateInvoiceFinancials(
    input.lineItems,
    input.taxRate,
    input.discountType,
    input.discountValue
  );

  return db.invoice.create({
    data: {
      userId,
      clientId: input.clientId,
      invoiceNumber: input.invoiceNumber,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      currency: input.currency,
      senderName: input.senderName,
      senderEmail: input.senderEmail || null,
      senderAddress: input.senderAddress || null,
      senderPhone: input.senderPhone || null,
      senderSsmNumber: input.senderSsmNumber || null,
      senderLogoUrl: input.senderLogoUrl || null,
      clientName: client.name,
      clientEmail: client.email,
      clientAddress: [client.addressLine1, client.city, client.country].filter(Boolean).join(", "),
      clientCompany: client.company || null,
      subtotal: financials.subtotal,
      taxRate: input.taxRate,
      taxAmount: financials.taxAmount,
      discountType: input.discountType ?? null,
      discountValue: input.discountValue ?? null,
      discountAmount: financials.discountAmount,
      total: financials.total,
      notes: input.notes || null,
      terms: input.terms || null,
      lineItems: {
        create: input.lineItems.map((item, idx) => ({
          sortOrder: idx,
          description: item.description,
          notes: item.notes || null,
          quantity: item.quantity,
          unitPrice: dollarsToCents(item.unitPrice),
          amount: dollarsToCents(item.quantity * item.unitPrice),
        })),
      },
    },
    include: { lineItems: true, client: true },
  });
}

export async function updateInvoice(invoiceId: string, userId: string, input: CreateInvoiceInput) {
  const existing = await db.invoice.findFirst({
    where: { id: invoiceId, userId, deletedAt: null },
  });
  if (!existing) throw new Error("Invoice not found");

  const client = await db.client.findFirst({ where: { id: input.clientId, userId, deletedAt: null } });
  if (!client) throw new Error("Client not found");

  const financials = calculateInvoiceFinancials(
    input.lineItems,
    input.taxRate,
    input.discountType,
    input.discountValue
  );

  // Delete old line items and recreate
  await db.lineItem.deleteMany({ where: { invoiceId } });

  return db.invoice.update({
    where: { id: invoiceId },
    data: {
      clientId: input.clientId,
      invoiceNumber: input.invoiceNumber,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      currency: input.currency,
      senderName: input.senderName,
      senderEmail: input.senderEmail || null,
      senderAddress: input.senderAddress || null,
      senderPhone: input.senderPhone || null,
      senderSsmNumber: input.senderSsmNumber || null,
      senderLogoUrl: input.senderLogoUrl || null,
      clientName: client.name,
      clientEmail: client.email,
      clientAddress: [client.addressLine1, client.city, client.country].filter(Boolean).join(", "),
      clientCompany: client.company || null,
      subtotal: financials.subtotal,
      taxRate: input.taxRate,
      taxAmount: financials.taxAmount,
      discountType: input.discountType ?? null,
      discountValue: input.discountValue ?? null,
      discountAmount: financials.discountAmount,
      total: financials.total,
      notes: input.notes || null,
      terms: input.terms || null,
      lineItems: {
        create: input.lineItems.map((item, idx) => ({
          sortOrder: idx,
          description: item.description,
          notes: item.notes || null,
          quantity: item.quantity,
          unitPrice: dollarsToCents(item.unitPrice),
          amount: dollarsToCents(item.quantity * item.unitPrice),
        })),
      },
    },
    include: { lineItems: true, client: true },
  });
}

export async function softDeleteInvoice(invoiceId: string, userId: string) {
  return db.invoice.updateMany({
    where: { id: invoiceId, userId, status: { in: ["DRAFT", "CANCELLED"] }, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

export async function updateInvoiceStatus(
  invoiceId: string,
  userId: string,
  status: "SENT" | "PAID" | "CANCELLED"
) {
  const data: Record<string, unknown> = { status };
  if (status === "SENT") data.sentAt = new Date();
  if (status === "PAID") data.paidAt = new Date();

  return db.invoice.updateMany({
    where: { id: invoiceId, userId, deletedAt: null },
    data,
  });
}

export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const [allInvoices, now] = [
    await db.invoice.findMany({
      where: { userId, deletedAt: null },
      select: { status: true, total: true, dueDate: true },
    }),
    new Date(),
  ];

  const overdueIds = await db.invoice.findMany({
    where: {
      userId,
      deletedAt: null,
      status: { in: ["SENT", "VIEWED"] },
      dueDate: { lt: now },
    },
    select: { id: true },
  });

  if (overdueIds.length > 0) {
    await db.invoice.updateMany({
      where: { id: { in: overdueIds.map((i) => i.id) } },
      data: { status: "OVERDUE" },
    });
  }

  const totalRevenue = allInvoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.total, 0);

  const outstanding = allInvoices
    .filter((i) => ["SENT", "VIEWED", "OVERDUE"].includes(i.status))
    .reduce((s, i) => s + i.total, 0);

  return {
    totalRevenue,
    outstanding,
    overdueCount: overdueIds.length,
    draftCount: allInvoices.filter((i) => i.status === "DRAFT").length,
    invoicesThisMonth: allInvoices.filter((i) => i.status !== "DRAFT").length,
  };
}
