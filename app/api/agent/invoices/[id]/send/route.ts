import { NextRequest, NextResponse } from "next/server";
import { validateAgentKey } from "@/lib/utils/agentAuth";
import { getInvoiceById, updateInvoiceStatus } from "@/lib/services/invoice.service";
import { sendInvoiceSchema } from "@/lib/validations/invoice";
import { sendInvoiceEmail } from "@/lib/services/email.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const userId = await validateAgentKey(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await getInvoiceById(id, userId);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = sendInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { channel, recipientEmail, recipientPhone, message: customMessage } = parsed.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://invoice-flow-o2vt.vercel.app";

  if (channel === "email") {
    const toEmail = recipientEmail ?? invoice.clientEmail;
    if (!toEmail) return NextResponse.json({ error: "No recipient email" }, { status: 422 });
    await sendInvoiceEmail({ invoice, recipientEmail: toEmail, customMessage });
    await updateInvoiceStatus(id, userId, "SENT");
    return NextResponse.json({ data: null, message: "Invoice sent by email" });
  }

  // WhatsApp
  await updateInvoiceStatus(id, userId, "SENT");
  const phone = (recipientPhone ?? "").replace(/\D/g, "");
  const text = customMessage
    ?? `Hi ${invoice.clientName}, please find your invoice ${invoice.invoiceNumber} (${invoice.currency} ${(invoice.total / 100).toFixed(2)}) here:\n${appUrl}/api/invoices/${id}/pdf`;
  return NextResponse.json({
    data: { whatsappUrl: `https://wa.me/${phone}?text=${encodeURIComponent(text)}` },
    message: "WhatsApp link ready",
  });
}
