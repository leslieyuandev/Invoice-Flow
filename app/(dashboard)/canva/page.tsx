import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectsView, type ProjectListItem } from "@/components/canva/ProjectsView";
import type { CanvaPage } from "@/types/canva";

export default async function CanvaProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await db.canvaProject.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  const items: ProjectListItem[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    format: p.format,
    width: p.width,
    height: p.height,
    pages: p.pages as unknown as CanvaPage[],
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="flex-1 overflow-y-auto">
      <ProjectsView projects={items} />
    </div>
  );
}
