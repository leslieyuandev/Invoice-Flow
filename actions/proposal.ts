"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createProposalSchema, updateProposalSchema } from "@/lib/validations/proposal";
import {
  createProposal,
  updateProposal,
  updateProposalStatus,
  softDeleteProposal,
} from "@/lib/services/proposal.service";
import { revalidatePath } from "next/cache";

export async function createProposalAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = createProposalSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.flatten().fieldErrors };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, logoUrl: true, companyPhone: true },
  });

  const sender = {
    senderName: user?.name ?? "",
    senderEmail: user?.email ?? null,
    senderLogoUrl: user?.logoUrl ?? null,
    senderPhone: user?.companyPhone ?? null,
  };

  const proposal = await createProposal(session.user.id, parsed.data, sender);
  revalidatePath("/proposals");
  return { data: { id: proposal.id } };
}

export async function updateProposalAction(proposalId: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = updateProposalSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.flatten().fieldErrors };
  }

  await updateProposal(proposalId, session.user.id, parsed.data);
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
  return { data: { id: proposalId } };
}

export async function markProposalSentAction(proposalId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await updateProposalStatus(proposalId, session.user.id, "SENT");
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
  return { data: null };
}

export async function markProposalAcceptedAction(proposalId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await updateProposalStatus(proposalId, session.user.id, "ACCEPTED");
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
  return { data: null };
}

export async function markProposalRejectedAction(proposalId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await updateProposalStatus(proposalId, session.user.id, "REJECTED");
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposalId}`);
  return { data: null };
}

export async function deleteProposalAction(proposalId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const affected = await softDeleteProposal(proposalId, session.user.id);
  if (affected.count === 0) {
    return { error: "Proposal not found or cannot be deleted in its current status" };
  }

  revalidatePath("/proposals");
  return { data: null };
}
