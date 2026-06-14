import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuotationById, updateQuotationStatus } from "@/lib/services/quotation.service";
import { sendQuotationSchema } from "@/lib/validations/quotation";
import { generateQuotationPDF } from "@/lib/services/quotation-pdf.service";
import { formatCurrency } from "@/lib/utils/calculations";
import { formatDate } from "@/lib/utils/date";
import nodemailer from "nodemailer";

type RouteContext = { params: Promise<{ id: string }> };

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD are not configured");
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quotation = await getQuotationById(id, session.user.id);
  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (quotation.status === "DECLINED" || quotation.status === "EXPIRED") {
    return NextResponse.json({ error: "Cannot send a declined or expired quotation" }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sendQuotationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { channel, recipientEmail, recipientPhone, message: customMessage } = parsed.data;

  try {
    if (channel === "email") {
      const toEmail = recipientEmail ?? quotation.clientEmail;
      if (!toEmail) return NextResponse.json({ error: "No recipient email address" }, { status: 422 });

      const pdfBuffer = await generateQuotationPDF(quotation);
      const fmt = (c: number) => formatCurrency(c, quotation.currency);

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quotation ${quotation.quotationNumber}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #0f766e; padding: 32px 40px; }
    .header-title { color: #fff; font-size: 22px; font-weight: 700; margin: 0; }
    .header-sub { color: #99f6e4; font-size: 14px; margin: 4px 0 0; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 15px; margin-bottom: 20px; }
    .message-box { background: #f0fdfa; border-left: 3px solid #0f766e; border-radius: 4px; padding: 14px 16px; margin-bottom: 28px; font-size: 14px; color: #475569; white-space: pre-wrap; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    .details-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .details-table td:last-child { text-align: right; font-weight: 600; }
    .total-row td { font-size: 16px; font-weight: 700; color: #0f766e; border-bottom: none; padding-top: 16px; }
    .cta { display: block; text-align: center; background: #0f766e; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 0 auto 28px; width: fit-content; }
    .footer { background: #f8fafc; padding: 20px 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-title">Quotation ${quotation.quotationNumber}</p>
      <p class="header-sub">From ${quotation.senderName}</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${quotation.clientName},</p>
      ${customMessage ? `<div class="message-box">${customMessage}</div>` : `<p style="font-size:14px;color:#475569;margin-bottom:28px;">Please find your quotation attached to this email.</p>`}
      <table class="details-table">
        <tr><td style="color:#64748b">Quotation Number</td><td>${quotation.quotationNumber}</td></tr>
        <tr><td style="color:#64748b">Issue Date</td><td>${formatDate(quotation.issueDate)}</td></tr>
        <tr><td style="color:#64748b">Expiry Date</td><td>${formatDate(quotation.expiryDate)}</td></tr>
        <tr class="total-row"><td>Total Amount</td><td>${fmt(quotation.total)}</td></tr>
      </table>
      <a class="cta" href="${process.env.NEXT_PUBLIC_APP_URL}/quotations/${quotation.id}">View Quotation Online</a>
    </div>
    <div class="footer">
      <p>${quotation.senderName}${quotation.senderEmail ? ` · ${quotation.senderEmail}` : ""}</p>
      <p>This is an automated quotation email. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`;

      const transport = getTransport();
      await transport.sendMail({
        from: `"${quotation.senderName}" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `Quotation ${quotation.quotationNumber} from ${quotation.senderName}`,
        html,
        attachments: [
          {
            filename: `Quotation-${quotation.quotationNumber}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      await updateQuotationStatus(id, session.user.id, "SENT");
      return NextResponse.json({ data: null, message: "Quotation sent successfully" });
    } else if (channel === "whatsapp") {
      await updateQuotationStatus(id, session.user.id, "SENT");
      const phone = (parsed.data.recipientPhone ?? "").replace(/\D/g, "");
      const quotationLine = `Quotation ${quotation.quotationNumber}: ${quotation.currency} ${(quotation.total / 100).toFixed(2)}\nDownload PDF: ${process.env.NEXT_PUBLIC_APP_URL}/api/quotations/${id}/pdf`;
      const text = customMessage
        ? `${customMessage}\n\n${quotationLine}`
        : `Hi ${quotation.clientName},\n\n${quotationLine}`;
      return NextResponse.json({
        data: { whatsappUrl: `https://wa.me/${phone}?text=${encodeURIComponent(text)}` },
        message: "WhatsApp link generated",
      });
    }
  } catch (err) {
    console.error("Send quotation failed:", err);
    const message = err instanceof Error ? err.message : "Failed to send quotation";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
