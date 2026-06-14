import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CanvaEditor } from "@/components/canva/CanvaEditor";
import type { CanvaPage, CanvaProjectData } from "@/types/canva";

export default async function CanvaEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const [project, assets] = await Promise.all([
    db.canvaProject.findFirst({ where: { id, userId: session.user.id, deletedAt: null } }),
    db.canvaAsset.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
  ]);
  if (!project) notFound();

  const data: CanvaProjectData = {
    id: project.id,
    title: project.title,
    format: project.format,
    width: project.width,
    height: project.height,
    pages: project.pages as unknown as CanvaPage[],
    updatedAt: project.updatedAt.toISOString(),
  };

  const imageAssets = assets
    .filter((a) => a.type === "image")
    .map((a) => ({ id: a.id, type: a.type, url: a.url, name: a.name, meta: a.meta }));
  const fontAssets = assets
    .filter((a) => a.type === "font")
    .map((a) => ({ id: a.id, type: a.type, url: a.url, name: a.name, meta: a.meta }));

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      <CanvaEditor project={data} imageAssets={imageAssets} fontAssets={fontAssets} />
    </div>
  );
}
