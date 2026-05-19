import ReactPDF, {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { centsToDollars, formatCurrency } from "@/lib/utils/calculations";
import { formatDate } from "@/lib/utils/date";
import type { InvoiceWithRelations } from "@/types";

// Register a clean sans-serif font — falls back to Helvetica if unavailable
Font.registerHyphenationCallback((word) => [word]);

const STATUS_COLORS: Record<string, string> = {
  PAID: "#15803d",
  SENT: "#1d4ed8",
  OVERDUE: "#c2410c",
  DRAFT: "#475569",
  CANCELLED: "#b91c1c",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
    backgroundColor: "#ffffff",
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 48,
  },
  // ── Header ──────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 36,
  },
  logo: { width: 240, height: 120, objectFit: "contain", objectPosition: "left" },
  companyName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  companyMeta: { fontSize: 8, color: "#64748b", marginTop: 2 },
  invoiceLabel: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#4f46e5" },
  invoiceNumber: { fontSize: 10, color: "#64748b", marginTop: 2 },
  // ── Status badge ─────────────────────────────────────────────────
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusText: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  // ── Meta row (Bill To / Bill From / Dates) ───────────────────────
  metaRow: { flexDirection: "row", marginBottom: 32 },
  metaBlock: { flex: 1 },
  metaLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  metaValue: { fontSize: 9, color: "#1e293b", lineHeight: 1.5 },
  metaBold: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  // ── Date grid ────────────────────────────────────────────────────
  dateGrid: { flexDirection: "row", gap: 24 },
  dateItem: { marginBottom: 12 },
  // ── Divider ──────────────────────────────────────────────────────
  divider: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", marginBottom: 16 },
  // ── Line items table ─────────────────────────────────────────────
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  colDescription: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colAmount: { flex: 1.5, textAlign: "right" },
  tableHeaderText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#64748b" },
  tableBodyText: { fontSize: 9, color: "#1e293b" },
  descriptionText: { fontSize: 9, color: "#1e293b", lineHeight: 1.4 },
  // ── Totals ───────────────────────────────────────────────────────
  totalsSection: { alignItems: "flex-end", marginTop: 16 },
  totalsTable: { width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalsDivider: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", marginVertical: 6 },
  totalsLabel: { fontSize: 9, color: "#64748b" },
  totalsValue: { fontSize: 9, color: "#1e293b" },
  grandTotalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  grandTotalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#4f46e5" },
  // ── Footer ───────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 30,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: "#94a3b8" },
  // ── Notes / Terms ─────────────────────────────────────────────────
  notesSection: { marginTop: 32, backgroundColor: "#f8fafc", borderRadius: 6, padding: 12 },
  notesLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#64748b", marginBottom: 4 },
  notesText: { fontSize: 9, color: "#475569", lineHeight: 1.5 },
});

function InvoiceDocument({ invoice, showDueDate }: { invoice: InvoiceWithRelations; showDueDate: boolean }) {
  const currency = invoice.currency;
  const fmt = (cents: number) => formatCurrency(cents, currency);
  const statusColor = STATUS_COLORS[invoice.status] ?? "#475569";
  const statusBg = invoice.status === "PAID" ? "#f0fdf4" : invoice.status === "OVERDUE" ? "#fff7ed" : "#f1f5f9";

  return React.createElement(
    Document,
    { title: `Invoice ${invoice.invoiceNumber}`, author: invoice.senderName },
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // ── Header ──────────────────────────────────────────────────
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          invoice.senderLogoUrl
            ? React.createElement(Image, { style: styles.logo, src: invoice.senderLogoUrl })
            : React.createElement(Text, { style: styles.companyName }, invoice.senderName),
          invoice.senderLogoUrl && React.createElement(Text, { style: { ...styles.companyName, marginTop: 4 } }, invoice.senderName),
          invoice.senderAddress && React.createElement(Text, { style: styles.companyMeta }, invoice.senderAddress),
          invoice.senderEmail && React.createElement(Text, { style: styles.companyMeta }, invoice.senderEmail),
          invoice.senderPhone && React.createElement(Text, { style: styles.companyMeta }, invoice.senderPhone)
        ),
        React.createElement(
          View,
          { style: { alignItems: "flex-end" } },
          React.createElement(Text, { style: styles.invoiceLabel }, "INVOICE"),
          React.createElement(Text, { style: styles.invoiceNumber }, invoice.invoiceNumber),
          React.createElement(
            View,
            { style: { ...styles.statusBadge, backgroundColor: statusBg } },
            React.createElement(Text, { style: { ...styles.statusText, color: statusColor } }, invoice.status)
          )
        )
      ),
      // ── Meta row ────────────────────────────────────────────────
      React.createElement(
        View,
        { style: styles.metaRow },
        React.createElement(
          View,
          { style: styles.metaBlock },
          React.createElement(Text, { style: styles.metaLabel }, "Bill To"),
          React.createElement(Text, { style: styles.metaBold }, invoice.clientName),
          invoice.clientCompany && React.createElement(Text, { style: styles.metaValue }, invoice.clientCompany),
          invoice.clientEmail && React.createElement(Text, { style: styles.metaValue }, invoice.clientEmail),
          invoice.clientAddress && React.createElement(Text, { style: styles.metaValue }, invoice.clientAddress)
        ),
        React.createElement(
          View,
          { style: { ...styles.metaBlock, alignItems: "flex-end" } },
          React.createElement(
            View,
            { style: styles.dateGrid },
            React.createElement(
              View,
              null,
              React.createElement(
                View,
                { style: styles.dateItem },
                React.createElement(Text, { style: styles.metaLabel }, "Issue Date"),
                React.createElement(Text, { style: styles.metaValue }, formatDate(invoice.issueDate))
              ),
              showDueDate
                ? React.createElement(
                    View,
                    { style: styles.dateItem },
                    React.createElement(Text, { style: styles.metaLabel }, "Due Date"),
                    React.createElement(Text, { style: { ...styles.metaValue, color: invoice.status === "OVERDUE" ? "#c2410c" : "#1e293b" } }, formatDate(invoice.dueDate))
                  )
                : null
            )
          )
        )
      ),
      // ── Divider ─────────────────────────────────────────────────
      React.createElement(View, { style: styles.divider }),
      // ── Table header ─────────────────────────────────────────────
      React.createElement(
        View,
        { style: styles.tableHeader },
        React.createElement(Text, { style: { ...styles.tableHeaderText, ...styles.colDescription } }, "ITEM"),
        React.createElement(Text, { style: { ...styles.tableHeaderText, ...styles.colQty } }, "QTY"),
        React.createElement(Text, { style: { ...styles.tableHeaderText, ...styles.colPrice } }, "PRICE"),
        React.createElement(Text, { style: { ...styles.tableHeaderText, ...styles.colAmount } }, "AMOUNT")
      ),
      // ── Line items ───────────────────────────────────────────────
      ...invoice.lineItems.map((item) =>
        React.createElement(
          View,
          { key: item.id, style: styles.tableRow, wrap: false },
          React.createElement(
            View,
            { style: styles.colDescription },
            React.createElement(Text, { style: { ...styles.descriptionText, fontFamily: "Helvetica-Bold" } }, item.description),
            item.notes
              ? React.createElement(Text, { style: { ...styles.descriptionText, fontSize: 8, color: "#64748b", marginTop: 2 } }, item.notes)
              : null
          ),
          React.createElement(Text, { style: { ...styles.tableBodyText, ...styles.colQty } }, Number(item.quantity).toFixed(item.quantity.toString().includes(".") ? 2 : 0)),
          React.createElement(Text, { style: { ...styles.tableBodyText, ...styles.colPrice } }, fmt(item.unitPrice)),
          React.createElement(Text, { style: { ...styles.tableBodyText, ...styles.colAmount } }, fmt(item.amount))
        )
      ),
      // ── Totals ───────────────────────────────────────────────────
      React.createElement(
        View,
        { style: styles.totalsSection },
        React.createElement(
          View,
          { style: styles.totalsTable },
          React.createElement(
            View,
            { style: styles.totalsRow },
            React.createElement(Text, { style: styles.totalsLabel }, "Subtotal"),
            React.createElement(Text, { style: styles.totalsValue }, fmt(invoice.subtotal))
          ),
          Number(invoice.taxRate) > 0 &&
            React.createElement(
              View,
              { style: styles.totalsRow },
              React.createElement(Text, { style: styles.totalsLabel }, `Tax (${Number(invoice.taxRate)}%)`),
              React.createElement(Text, { style: styles.totalsValue }, fmt(invoice.taxAmount))
            ),
          invoice.discountAmount && invoice.discountAmount > 0
            ? React.createElement(
                View,
                { style: styles.totalsRow },
                React.createElement(Text, { style: styles.totalsLabel }, `Discount${invoice.discountType === "PERCENTAGE" ? ` (${Number(invoice.discountValue)}%)` : ""}`),
                React.createElement(Text, { style: { ...styles.totalsValue, color: "#15803d" } }, `- ${fmt(invoice.discountAmount)}`)
              )
            : null,
          React.createElement(View, { style: styles.totalsDivider }),
          React.createElement(
            View,
            { style: styles.totalsRow },
            React.createElement(Text, { style: styles.grandTotalLabel }, "Total Due"),
            React.createElement(Text, { style: styles.grandTotalValue }, fmt(invoice.total))
          )
        )
      ),
      // ── Notes / Terms ─────────────────────────────────────────────
      (invoice.notes || invoice.terms) &&
        React.createElement(
          View,
          { style: styles.notesSection },
          invoice.notes &&
            React.createElement(
              View,
              { style: { marginBottom: invoice.terms ? 12 : 0 } },
              React.createElement(Text, { style: styles.notesLabel }, "Notes"),
              React.createElement(Text, { style: styles.notesText }, invoice.notes)
            ),
          invoice.terms &&
            React.createElement(
              View,
              null,
              React.createElement(Text, { style: styles.notesLabel }, "Payment Terms"),
              React.createElement(Text, { style: styles.notesText }, invoice.terms)
            )
        ),
      // ── Page footer ───────────────────────────────────────────────
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(Text, { style: styles.footerText }, invoice.senderName),
        React.createElement(
          Text,
          { style: styles.footerText, render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Page ${pageNumber} of ${totalPages}` }
        )
      )
    )
  );
}

export async function generateInvoicePDF(invoice: InvoiceWithRelations, showDueDate = true): Promise<Buffer> {
  const element = React.createElement(
    InvoiceDocument,
    { invoice, showDueDate }
  ) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(element);
}
