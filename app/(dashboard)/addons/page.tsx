import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AddOnsManager } from "@/components/catalog/AddOnsManager";

export default async function AddOnsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const addOns = await db.catalogAddOn.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const serialized = addOns.map((a) => ({
    id: a.id,
    name: a.name,
    price: a.price,
    priceLabel: a.priceLabel,
    unit: (a as typeof a & { unit?: string | null }).unit ?? null,
    imageUrl: a.imageUrl,
    isActive: a.isActive,
  }));

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-surface-900">Add-Ons</h1>
        <p className="text-sm text-surface-500 mt-1">Manage the add-on items available for proposals</p>
      </div>
      <AddOnsManager addOns={serialized} />
    </div>
  );
}
