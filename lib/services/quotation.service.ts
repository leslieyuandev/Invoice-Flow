import { db } from "@/lib/db";
import { calculateInvoiceFinancials, dollarsToCents } from "@/lib/utils/calculations";
import type { CreateQuotationInput } from "@/lib/validations/quotation";
import type { QuotationWithRelations, QuotationListItem } from "@/types";

export async function getQuotationsByUser(userId: string): Promise<QuotationListItem[]> {
  return db.quotation.findMany({
    where: { userId, deletedAt: null },
    select: {
      id: true,
      quotationNumber: true,
      status: true,
      total: true,
      currency: true,
      issueDate: true,
      expiryDate: true,
      clientName: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuotationById(quotationId: string, userId: string): Promise<QuotationWithRelations | null> {
  return db.quotation.findFirst({
    where: { id: quotationId, userId, deletedAt: null },
    include: { lineItems: { orderBy: { sortOrder: "asc" } }, client: true },
  }) as Promise<QuotationWithRelations | null>;
}

export async function createQuotation(userId: string, input: CreateQuotationInput) {
  const client = await db.client.findFirst({ where: { id: input.clientId, userId, deletedAt: null } });
  if (!client) throw new Error("Client not found");

  const financials = calculateInvoiceFinancials(input.lineItems, input.taxRate, input.discountType, input.discountValue);

  return db.quotation.create({
    data: {
      userId,
      clientId: input.clientId,
      quotationNumber: input.quotationNumber,
      issueDate: input.issueDate,
      expiryDate: input.expiryDate,
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

export async function updateQuotation(quotationId: string, userId: string, input: CreateQuotationInput) {
  const existing = await db.quotation.findFirst({ where: { id: quotationId, userId, deletedAt: null } });
  if (!existing) throw new Error("Quotation not found");

  const client = await db.client.findFirst({ where: { id: input.clientId, userId, deletedAt: null } });
  if (!client) throw new Error("Client not found");

  const financials = calculateInvoiceFinancials(input.lineItems, input.taxRate, input.discountType, input.discountValue);

  await db.quotationLineItem.deleteMany({ where: { quotationId } });

  return db.quotation.update({
    where: { id: quotationId },
    data: {
      clientId: input.clientId,
      quotationNumber: input.quotationNumber,
      issueDate: input.issueDate,
      expiryDate: input.expiryDate,
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

export async function softDeleteQuotation(quotationId: string, userId: string) {
  return db.quotation.updateMany({
    where: { id: quotationId, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

export async function updateQuotationStatus(
  quotationId: string,
  userId: string,
  status: "SENT" | "ACCEPTED" | "DECLINED" | "EXPIRED"
) {
  const data: Record<string, unknown> = { status };
  if (status === "SENT") data.sentAt = new Date();
  return db.quotation.updateMany({
    where: { id: quotationId, userId, deletedAt: null },
    data,
  });
}

export async function convertQuotationToInvoice(quotationId: string, userId: string): Promise<string> {
  const [quotation, user] = await Promise.all([
    db.quotation.findFirst({
      where: { id: quotationId, userId, deletedAt: null },
      include: { lineItems: { orderBy: { sortOrder: "asc" } }, client: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { defaultTerms: true, defaultPaymentTerms: true },
    }),
  ]);
  if (!quotation) throw new Error("Quotation not found");

  // Check not already converted
  const existing = await db.invoice.findUnique({ where: { quotationId } });
  if (existing) throw new Error("This quotation has already been converted to an invoice");

  // Generate next invoice number
  const allInvoices = await db.invoice.findMany({ where: { userId }, select: { invoiceNumber: true } });
  const prefix = "INV";
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  let maxSeq = 0;
  for (const inv of allInvoices) {
    const match = inv.invoiceNumber.match(pattern);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  const invoiceNumber = `${prefix}-${year}-${String(maxSeq + 1).padStart(4, "0")}`;

  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + (user?.defaultPaymentTerms ?? 30));

  const invoice = await db.invoice.create({
    data: {
      userId,
      clientId: quotation.clientId,
      invoiceNumber,
      issueDate,
      dueDate,
      currency: quotation.currency,
      senderName: quotation.senderName,
      senderEmail: quotation.senderEmail,
      senderAddress: quotation.senderAddress,
      senderPhone: quotation.senderPhone,
      senderSsmNumber: quotation.senderSsmNumber,
      senderLogoUrl: quotation.senderLogoUrl,
      clientName: quotation.clientName,
      clientEmail: quotation.clientEmail,
      clientAddress: quotation.clientAddress,
      clientCompany: quotation.clientCompany,
      subtotal: quotation.subtotal,
      taxRate: quotation.taxRate,
      taxAmount: quotation.taxAmount,
      discountType: quotation.discountType,
      discountValue: quotation.discountValue,
      discountAmount: quotation.discountAmount,
      total: quotation.total,
      notes: quotation.notes,
      terms: user?.defaultTerms ?? null,
      quotationId: quotation.id,
      lineItems: {
        create: quotation.lineItems.map((item) => ({
          sortOrder: item.sortOrder,
          description: item.description,
          notes: item.notes,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
      },
    },
  });

  // Mark quotation as ACCEPTED if not already
  if (quotation.status === "DRAFT" || quotation.status === "SENT") {
    await db.quotation.update({ where: { id: quotationId }, data: { status: "ACCEPTED" } });
  }

  return invoice.id;
}
