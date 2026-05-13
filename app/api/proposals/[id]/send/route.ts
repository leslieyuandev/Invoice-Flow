import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProposalById, updateProposalStatus } from "@/lib/services/proposal.service";
import { sendProposalEmail } from "@/lib/services/email.service";
import { sendProposalSchema } from "@/lib/validations/proposal";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const proposal = await getProposalById(id, session.user.id);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sendProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { channel, recipientEmail, recipientPhone, message: customMessage } = parsed.data;

  try {
    if (channel === "email") {
      const toEmail = recipientEmail ?? proposal.leadEmail;
      if (!toEmail) return NextResponse.json({ error: "No recipient email address" }, { status: 422 });
      await sendProposalEmail({ proposal, recipientEmail: toEmail, customMessage });
      await updateProposalStatus(id, session.user.id, "SENT");
      return NextResponse.json({ data: null, message: "Proposal sent successfully" });
    } else if (channel === "whatsapp") {
      await updateProposalStatus(id, session.user.id, "SENT");
      const phone = (recipientPhone ?? "").replace(/\D/g, "");
      const text = `Hi ${proposal.leadName}, please find the proposal for "${proposal.eventTitle}" at: ${process.env.NEXT_PUBLIC_APP_URL}/api/proposals/${id}/pdf`;
      return NextResponse.json({
        data: { whatsappUrl: `https://wa.me/${phone}?text=${encodeURIComponent(text)}` },
        message: "WhatsApp link generated",
      });
    }
  } catch (err) {
    console.error("Send proposal failed:", err);
    const message = err instanceof Error ? err.message : "Failed to send proposal";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
