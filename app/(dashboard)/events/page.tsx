import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { EventsManager } from "@/components/catalog/EventsManager";

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const categories = await db.eventCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { packages: true } } },
  });

  const serialized = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    sortOrder: c.sortOrder,
    packageCount: c._count.packages,
  }));

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-surface-900">Event Categories</h1>
        <p className="text-sm text-surface-500 mt-1">Manage the event types available for proposals</p>
      </div>
      <EventsManager categories={serialized} />
    </div>
  );
}
