import { NextRequest, NextResponse } from "next/server";
import { validateAgentKey } from "@/lib/utils/agentAuth";
import { createInvoiceSchema } from "@/lib/validations/invoice";
import { createInvoice } from "@/lib/services/invoice.service";

export async function POST(req: NextRequest) {
  const userId = await validateAgentKey(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const invoice = await createInvoice(userId, parsed.data);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://invoice-flow-o2vt.vercel.app";
    return NextResponse.json({
      data: { id: invoice.id, invoiceNumber: invoice.invoiceNumber },
      previewUrl: `${appUrl}/invoices/${invoice.id}`,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create invoice" }, { status: 500 });
  }
}
