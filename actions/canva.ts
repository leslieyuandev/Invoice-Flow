"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { CanvaPage } from "@/types/canva";
import type { Prisma } from "@prisma/client";

export async function createCanvaProjectAction(input: {
  title: string;
  format: string;
  width: number;
  height: number;
  pages: CanvaPage[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const width = Math.max(50, Math.min(8000, Math.round(input.width)));
  const height = Math.max(50, Math.min(8000, Math.round(input.height)));

  try {
    const project = await db.canvaProject.create({
      data: {
        userId: session.user.id,
        title: input.title || "Untitled Design",
        format: input.format,
        width,
        height,
        pages: input.pages as unknown as Prisma.InputJsonValue,
      },
    });
    revalidatePath("/canva");
    return { data: { id: project.id } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create project" };
  }
}

export async function saveCanvaProjectAction(
  projectId: string,
  input: { title: string; pages: CanvaPage[]; width?: number; height?: number; format?: string }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const result = await db.canvaProject.updateMany({
      where: { id: projectId, userId: session.user.id, deletedAt: null },
      data: {
        title: input.title || "Untitled Design",
        pages: input.pages as unknown as Prisma.InputJsonValue,
        ...(input.width && input.height
          ? {
              width: Math.max(50, Math.min(8000, Math.round(input.width))),
              height: Math.max(50, Math.min(8000, Math.round(input.height))),
              format: input.format ?? "custom",
            }
          : {}),
      },
    });
    if (result.count === 0) return { error: "Project not found" };
    revalidatePath("/canva");
    return { data: { id: projectId } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save project" };
  }
}

export async function deleteCanvaProjectAction(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const result = await db.canvaProject.updateMany({
    where: { id: projectId, userId: session.user.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) return { error: "Project not found" };
  revalidatePath("/canva");
  return { data: null };
}

export async function deleteCanvaAssetAction(assetId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await db.canvaAsset.deleteMany({ where: { id: assetId, userId: session.user.id } });
  revalidatePath("/canva");
  return { data: null };
}

export async function duplicateCanvaProjectAction(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const project = await db.canvaProject.findFirst({
    where: { id: projectId, userId: session.user.id, deletedAt: null },
  });
  if (!project) return { error: "Project not found" };

  const copy = await db.canvaProject.create({
    data: {
      userId: session.user.id,
      title: `${project.title} (Copy)`,
      format: project.format,
      width: project.width,
      height: project.height,
      pages: project.pages as Prisma.InputJsonValue,
    },
  });
  revalidatePath("/canva");
  return { data: { id: copy.id } };
}
