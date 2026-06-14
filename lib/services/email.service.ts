import nodemailer from "nodemailer";
import type { InvoiceWithRelations } from "@/types";
import type { ProposalWithItems } from "@/types/proposal";
import { formatCurrency } from "@/lib/utils/calculations";
import { formatDate } from "@/lib/utils/date";
import { generateInvoicePDF } from "./pdf.service";
import { generateProposalPDF } from "./proposal-pdf.service";

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD are not configured");
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface SendEmailOptions {
  invoice: InvoiceWithRelations;
  recipientEmail: string;
  customMessage?: string;
}

export async function sendInvoiceEmail(options: SendEmailOptions): Promise<void> {
  const { invoice, recipientEmail, customMessage } = options;

  const pdfBuffer = await generateInvoicePDF(invoice);
  const fmt = (c: number) => formatCurrency(c, invoice.currency);
  const html = buildEmailHtml({ invoice, customMessage, fmt });

  let lastError: Error | null = null;
  const transport = getTransport();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await transport.sendMail({
        from: `"${invoice.senderName}" <${process.env.GMAIL_USER}>`,
        to: recipientEmail,
        subject: `Invoice ${invoice.invoiceNumber} from ${invoice.senderName}`,
        html,
        attachments: [
          {
            filename: `Invoice-${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }

  throw new Error(`Failed to send invoice email after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

function buildEmailHtml({
  invoice,
  customMessage,
  fmt,
}: {
  invoice: InvoiceWithRelations;
  customMessage?: string;
  fmt: (cents: number) => string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #4f46e5; padding: 32px 40px; }
    .header-title { color: #fff; font-size: 22px; font-weight: 700; margin: 0; }
    .header-sub { color: #c7d2fe; font-size: 14px; margin: 4px 0 0; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 15px; margin-bottom: 20px; }
    .message-box { background: #f1f5f9; border-left: 3px solid #4f46e5; border-radius: 4px; padding: 14px 16px; margin-bottom: 28px; font-size: 14px; color: #475569; white-space: pre-wrap; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    .details-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .details-table td:last-child { text-align: right; font-weight: 600; }
    .total-row td { font-size: 16px; font-weight: 700; color: #4f46e5; border-bottom: none; padding-top: 16px; }
    .cta { display: block; text-align: center; background: #4f46e5; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 0 auto 28px; width: fit-content; }
    .footer { background: #f8fafc; padding: 20px 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-title">Invoice ${invoice.invoiceNumber}</p>
      <p class="header-sub">From ${invoice.senderName}</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${invoice.clientName},</p>
      ${customMessage ? `<div class="message-box">${customMessage}</div>` : `<p style="font-size:14px;color:#475569;margin-bottom:28px;">Please find your invoice attached to this email.</p>`}
      <table class="details-table">
        <tr><td style="color:#64748b">Invoice Number</td><td>${invoice.invoiceNumber}</td></tr>
        <tr><td style="color:#64748b">Issue Date</td><td>${formatDate(invoice.issueDate)}</td></tr>
        <tr><td style="color:#64748b">Due Date</td><td>${formatDate(invoice.dueDate)}</td></tr>
        <tr class="total-row"><td>Amount Due</td><td>${fmt(invoice.total)}</td></tr>
      </table>
      <a class="cta" href="${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}">View Invoice Online</a>
    </div>
    <div class="footer">
      <p>${invoice.senderName}${invoice.senderEmail ? ` · ${invoice.senderEmail}` : ""}</p>
      <p>This is an automated invoice email. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

interface SendProposalEmailOptions {
  proposal: ProposalWithItems;
  recipientEmail: string;
  customMessage?: string;
}

export async function sendProposalEmail(options: SendProposalEmailOptions): Promise<void> {
  const { proposal, recipientEmail, customMessage } = options;

  const pdfBuffer = await generateProposalPDF(proposal);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Proposal — ${proposal.eventTitle}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #4f46e5; padding: 32px 40px; }
    .header-title { color: #fff; font-size: 22px; font-weight: 700; margin: 0; }
    .header-sub { color: #c7d2fe; font-size: 14px; margin: 4px 0 0; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 15px; margin-bottom: 20px; }
    .message-box { background: #f1f5f9; border-left: 3px solid #4f46e5; border-radius: 4px; padding: 14px 16px; margin-bottom: 28px; font-size: 14px; color: #475569; white-space: pre-wrap; }
    .footer { background: #f8fafc; padding: 20px 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-title">${proposal.eventTitle}</p>
      <p class="header-sub">Proposal from ${proposal.senderName}</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${proposal.leadName},</p>
      ${customMessage ? `<div class="message-box">${customMessage}</div>` : `<p style="font-size:14px;color:#475569;margin-bottom:28px;">Please find your event proposal attached to this email. We look forward to making your event special!</p>`}
    </div>
    <div class="footer">
      <p>${proposal.senderName}${proposal.senderEmail ? ` · ${proposal.senderEmail}` : ""}${proposal.senderPhone ? ` · ${proposal.senderPhone}` : ""}</p>
    </div>
  </div>
</body>
</html>`;

  let lastError: Error | null = null;
  const transport = getTransport();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await transport.sendMail({
        from: `"${proposal.senderName}" <${process.env.GMAIL_USER}>`,
        to: recipientEmail,
        subject: `Proposal from ${proposal.senderName} — ${proposal.eventTitle}`,
        html,
        attachments: [
          {
            filename: `Proposal-${proposal.id}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }

  throw new Error(`Failed to send proposal email after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}
