import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProposalById } from "@/lib/services/proposal.service";
import { generateProposalPDF } from "@/lib/services/proposal-pdf.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const proposal = await getProposalById(id, session.user.id);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await generateProposalPDF(proposal);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Proposal-${id}.pdf"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
