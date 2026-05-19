"use client";

import { useRef, useState, useEffect } from "react";
import { formatCurrency, centsToDollars } from "@/lib/utils/calculations";
import { formatDate } from "@/lib/utils/date";
import { getCurrencySymbol } from "@/lib/utils/currency";
import type { InvoiceFormData, InvoiceFinancials } from "@/types";
import type { Client } from "@prisma/client";
import Image from "next/image";

interface InvoicePreviewProps {
  data: Partial<InvoiceFormData>;
  financials: InvoiceFinancials;
  client?: Client;
  lineItemAmounts: number[];
  showDueDate?: boolean;
}

// This component mirrors the PDF layout exactly — same data, CSS-rendered.
export function InvoicePreview({ data, financials, client, lineItemAmounts, showDueDate = true }: InvoicePreviewProps) {
  const currency = data.currency ?? "USD";
  const fmt = (cents: number) => formatCurrency(cents, currency);
  const symbol = getCurrencySymbol(currency);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width - 48;
      setScale(Math.min(1, available / 794));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    // Outer scroll wrapper — preview pane scrolls while form stays sticky
    <div ref={containerRef} className="preview-scroll overflow-y-auto h-full bg-surface-100 p-6 flex justify-center">
      {/* A4 sheet */}
      <div
        className="bg-white shadow-preview font-invoice text-surface-800 shrink-0 w-a4 min-h-a4"
        style={{
          padding: "48px",
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          marginLeft: `${(scale - 1) * 397}px`,
          marginRight: `${(scale - 1) * 397}px`,
          marginBottom: `${(scale - 1) * 1123}px`,
        }}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex justify-between items-start mb-10">
          <div>
            {data.senderLogoUrl ? (
              <div className="mb-3 h-[120px] w-[240px] relative">
                <Image
                  src={data.senderLogoUrl}
                  alt="Company logo"
                  fill
                  className="object-contain object-left"
                  unoptimized
                />
              </div>
            ) : null}
            <p className="text-lg font-bold text-surface-900">{data.senderName || "Your Company"}</p>
            {data.senderAddress && <p className="text-xs text-surface-500 mt-0.5">{data.senderAddress}</p>}
            {data.senderEmail && <p className="text-xs text-surface-500">{data.senderEmail}</p>}
            {data.senderPhone && <p className="text-xs text-surface-500">{data.senderPhone}</p>}
            {data.senderSsmNumber && <p className="text-xs text-surface-500">SSM No: {data.senderSsmNumber}</p>}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-brand-600 tracking-tight">INVOICE</p>
            <p className="text-sm text-surface-500 mt-1">{data.invoiceNumber || "INV-XXXX"}</p>
          </div>
        </div>

        {/* ── Bill To / Dates ───────────────────────────────────────── */}
        <div className="flex justify-between mb-8">
          <div>
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Bill To</p>
            {client ? (
              <div className="text-sm space-y-0.5">
                <p className="font-semibold text-surface-900">{client.name}</p>
                {client.company && <p className="text-surface-600">{client.company}</p>}
                <p className="text-surface-500">{client.email}</p>
                {client.addressLine1 && <p className="text-surface-500">{client.addressLine1}</p>}
                {(client.city || client.country) && (
                  <p className="text-surface-500">{[client.city, client.country].filter(Boolean).join(", ")}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-surface-400 italic">Select a client…</p>
            )}
          </div>
          <div className="text-right space-y-3">
            <div>
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">Issue Date</p>
              <p className="text-sm text-surface-700">
                {data.issueDate ? formatDate(data.issueDate) : "—"}
              </p>
            </div>
            {showDueDate && (
              <div>
                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">Due Date</p>
                <p className="text-sm text-surface-700">
                  {data.dueDate ? formatDate(data.dueDate) : "—"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────────────── */}
        <div className="h-px bg-surface-200 mb-4" />

        {/* ── Line items table ──────────────────────────────────────── */}
        <div>
          <div className="grid grid-cols-[1fr_60px_80px_80px] gap-2 px-2 mb-1">
            {["Item", "Qty", "Price", "Amount"].map((h) => (
              <span key={h} className="text-[10px] font-bold text-surface-400 uppercase tracking-widest text-right first:text-left">
                {h}
              </span>
            ))}
          </div>

          <div className="divide-y divide-surface-50">
            {(data.lineItems ?? []).length === 0 ? (
              <p className="text-sm text-surface-400 italic py-4 text-center">Add line items…</p>
            ) : (
              (data.lineItems ?? []).map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_80px_80px] gap-2 py-2.5 px-2 text-sm items-start">
                  <div>
                    <p className="font-semibold text-surface-900">{item.description || <span className="text-surface-300 italic font-normal">—</span>}</p>
                    {item.notes && (
                      <p className="text-xs text-surface-500 mt-0.5 whitespace-pre-line leading-relaxed">{item.notes}</p>
                    )}
                  </div>
                  <span className="text-right text-surface-600 tabular-nums">{item.quantity || 0}</span>
                  <span className="text-right text-surface-600 tabular-nums">
                    {symbol}{(Number(item.unitPrice) || 0).toFixed(2)}
                  </span>
                  <span className="text-right text-surface-800 tabular-nums font-medium">
                    {fmt(lineItemAmounts[i] ?? 0)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Totals ────────────────────────────────────────────────── */}
        <div className="flex justify-end mt-6">
          <div className="w-52 space-y-1.5 text-sm">
            <div className="flex justify-between text-surface-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{fmt(financials.subtotal)}</span>
            </div>
            {financials.discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount</span>
                <span className="tabular-nums">- {fmt(financials.discountAmount)}</span>
              </div>
            )}
            {financials.taxAmount > 0 && (
              <div className="flex justify-between text-surface-600">
                <span>Tax</span>
                <span className="tabular-nums">{fmt(financials.taxAmount)}</span>
              </div>
            )}
            <div className="h-px bg-surface-200 my-2" />
            <div className="flex justify-between font-bold text-base">
              <span className="text-surface-900">Total Due</span>
              <span className="tabular-nums text-brand-700">{fmt(financials.total)}</span>
            </div>
          </div>
        </div>

        {/* ── Notes / Terms ─────────────────────────────────────────── */}
        {(data.notes || data.terms) && (
          <div className="mt-8 rounded-lg bg-surface-50 border border-surface-100 p-4 space-y-3 text-xs text-surface-600">
            {data.notes && (
              <div>
                <p className="font-bold text-surface-500 uppercase tracking-wide mb-1">Notes</p>
                <p className="whitespace-pre-wrap leading-relaxed">{data.notes}</p>
              </div>
            )}
            {data.terms && (
              <div>
                <p className="font-bold text-surface-500 uppercase tracking-wide mb-1">Payment Terms</p>
                <p className="whitespace-pre-wrap leading-relaxed">{data.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="mt-12 pt-4 border-t border-surface-100 flex justify-between text-[10px] text-surface-400">
          <span>{data.senderName}</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}
