import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PackagesManager } from "@/components/catalog/PackagesManager";

export default async function PackagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [packages, categories] = await Promise.all([
    db.catalogPackage.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { features: { orderBy: { sortOrder: "asc" } } },
    }),
    db.eventCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);

  const serializedPkgs = packages.map((p) => ({
    id: p.id,
    categoryId: p.categoryId,
    name: p.name,
    tagline: p.tagline,
    price: p.price,
    originalPrice: p.originalPrice,
    imageUrl: p.imageUrl,
    isBestSeller: p.isBestSeller,
    isActive: p.isActive,
    features: p.features.map((f) => f.text),
  }));

  const serializedCats = categories.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId }));

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-surface-900">Packages</h1>
        <p className="text-sm text-surface-500 mt-1">Manage the catalog packages available for proposals</p>
      </div>
      <PackagesManager packages={serializedPkgs} categories={serializedCats} />
    </div>
  );
}
