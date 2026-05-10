import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateInvoiceSchema } from "@/lib/validations/invoice";
import { getInvoiceById } from "@/lib/services/invoice.service";
import { db } from "@/lib/db";
import { calculateInvoiceFinancials, dollarsToCents } from "@/lib/utils/calculations";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await getInvoiceById(id, session.user.id);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: invoice });
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await getInvoiceById(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { lineItems, taxRate, discountType, discountValue, ...rest } = parsed.data;

  const financials =
    lineItems && taxRate !== undefined
      ? calculateInvoiceFinancials(lineItems, taxRate, discountType, discountValue)
      : null;

  try {
    const updated = await db.invoice.update({
      where: { id },
      data: {
        ...rest,
        ...(financials && {
          subtotal: financials.subtotal,
          taxAmount: financials.taxAmount,
          discountAmount: financials.discountAmount,
          total: financials.total,
          taxRate: taxRate!,
          discountType: discountType ?? null,
          discountValue: discountValue ?? null,
        }),
        ...(lineItems && {
          lineItems: {
            deleteMany: {},
            create: lineItems.map((item, idx) => ({
              sortOrder: idx,
              description: item.description,
              quantity: item.quantity,
              unitPrice: dollarsToCents(item.unitPrice),
              amount: dollarsToCents(item.quantity * item.unitPrice),
            })),
          },
        }),
      },
      include: { lineItems: { orderBy: { sortOrder: "asc" } }, client: true },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getInvoiceById(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only DRAFT and CANCELLED invoices can be deleted
  if (!["DRAFT", "CANCELLED"].includes(existing.status)) {
    return NextResponse.json(
      { error: "Only draft or cancelled invoices can be deleted" },
      { status: 409 }
    );
  }

  await db.invoice.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
