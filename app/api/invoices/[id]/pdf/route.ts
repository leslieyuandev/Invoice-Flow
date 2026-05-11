import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getInvoiceById } from "@/lib/services/invoice.service";
import { generateInvoicePDF } from "@/lib/services/pdf.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [invoice, userSettings] = await Promise.all([
    getInvoiceById(id, session.user.id),
    db.user.findUnique({ where: { id: session.user.id }, select: { showDueDate: true } }),
  ]);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const showDueDate = userSettings?.showDueDate ?? true;

  try {
    const pdfBuffer = await generateInvoicePDF(invoice, showDueDate);
    const filename = `Invoice-${invoice.invoiceNumber}.pdf`;

    // Next.js 15 BodyInit doesn't accept Buffer directly — convert to Uint8Array
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        // Prevent caching of sensitive financial documents
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
