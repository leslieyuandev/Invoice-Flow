import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQuotationById } from "@/lib/services/quotation.service";
import { generateQuotationPDF } from "@/lib/services/quotation-pdf.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quotation = await getQuotationById(id, session.user.id);
  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const pdf = await generateQuotationPDF(quotation);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Quotation-${quotation.quotationNumber}.pdf"`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Quotation PDF generation failed:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
