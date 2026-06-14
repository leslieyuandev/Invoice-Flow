import type { Invoice, Client, LineItem, User, InvoiceStatus, DiscountType, Quotation, QuotationLineItem, QuotationStatus } from "@prisma/client";

// ─── Re-exports for convenience ──────────────────────────────────────────────
export type { InvoiceStatus, DiscountType };

// ─── Enriched types (with relations) ─────────────────────────────────────────
export type InvoiceWithRelations = Invoice & {
  lineItems: LineItem[];
  client: Client;
  quotation?: { id: string; quotationNumber: string } | null;
};

export type InvoiceListItem = Pick<
  Invoice,
  | "id"
  | "invoiceNumber"
  | "status"
  | "total"
  | "currency"
  | "issueDate"
  | "dueDate"
  | "clientName"
  | "createdAt"
>;

// ─── Form data types (before saving to DB) ───────────────────────────────────
export interface LineItemFormData {
  id?: string;
  description: string;  // item name (bold)
  notes?: string;        // multiline description shown below the name
  quantity: number;
  unitPrice: number; // in major currency units (dollars), converted to cents on save
  amount: number;
}

export interface InvoiceFormData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  clientId: string;
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  senderPhone: string;
  senderSsmNumber?: string;
  senderLogoUrl?: string;
  lineItems: LineItemFormData[];
  taxRate: number;
  discountType?: DiscountType;
  discountValue?: number;
  notes?: string;
  terms?: string;
}

// ─── Calculated financials ────────────────────────────────────────────────────
export interface InvoiceFinancials {
  subtotal: number;      // cents
  taxAmount: number;     // cents
  discountAmount: number; // cents
  total: number;         // cents
}

// ─── Dashboard metrics ────────────────────────────────────────────────────────
export interface DashboardMetrics {
  totalRevenue: number;      // cents — sum of PAID invoices
  outstanding: number;       // cents — sum of SENT + OVERDUE
  overdueCount: number;
  draftCount: number;
  invoicesThisMonth: number;
}

// ─── API response shapes ──────────────────────────────────────────────────────
export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Email / Send ─────────────────────────────────────────────────────────────
export interface SendInvoicePayload {
  invoiceId: string;
  channel: "email" | "whatsapp";
  recipientEmail?: string;
  recipientPhone?: string;
  message?: string;
}

// ─── Quotation types ──────────────────────────────────────────────────────────
export type { QuotationStatus };

export type QuotationWithRelations = Quotation & {
  lineItems: QuotationLineItem[];
  client: Client;
};

export type QuotationListItem = Pick<
  Quotation,
  | "id"
  | "quotationNumber"
  | "status"
  | "total"
  | "currency"
  | "issueDate"
  | "expiryDate"
  | "clientName"
  | "createdAt"
>;

export interface QuotationFormData {
  quotationNumber: string;
  issueDate: Date;
  expiryDate: Date;
  currency: string;
  clientId: string;
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  senderPhone: string;
  senderSsmNumber?: string;
  senderLogoUrl?: string;
  lineItems: LineItemFormData[];
  taxRate: number;
  discountType?: DiscountType;
  discountValue?: number;
  notes?: string;
}
