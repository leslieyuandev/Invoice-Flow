import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInvoiceById, updateInvoiceStatus } from "@/lib/services/invoice.service";
import { sendInvoiceEmail } from "@/lib/services/email.service";
import { sendInvoiceSchema } from "@/lib/validations/invoice";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await getInvoiceById(id, session.user.id);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (invoice.status === "CANCELLED") {
    return NextResponse.json({ error: "Cannot send a cancelled invoice" }, { status: 409 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sendInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { channel, recipientEmail, recipientPhone, message: customMessage } = parsed.data;

  try {
    if (channel === "email") {
      await sendInvoiceEmail({
        invoice,
        recipientEmail: recipientEmail ?? invoice.clientEmail,
        customMessage,
      });
      await updateInvoiceStatus(id, session.user.id, "SENT");
      return NextResponse.json({ data: null, message: "Invoice sent successfully" });
    } else if (channel === "whatsapp") {
      await updateInvoiceStatus(id, session.user.id, "SENT");
      const phone = (parsed.data.recipientPhone ?? "").replace(/\D/g, "");
      const text = `Hi ${invoice.clientName}, please find Invoice ${invoice.invoiceNumber} (${invoice.currency} ${(invoice.total / 100).toFixed(2)}) at: ${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/${id}/pdf`;
      return NextResponse.json({
        data: { whatsappUrl: `https://wa.me/${phone}?text=${encodeURIComponent(text)}` },
        message: "WhatsApp link generated",
      });
    }
  } catch (err) {
    console.error("Send invoice failed:", err);
    const message = err instanceof Error ? err.message : "Failed to send invoice";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
