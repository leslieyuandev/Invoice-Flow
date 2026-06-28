import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/products/ProductForm";

export default async function NewProductPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const existing = await db.product.findMany({
    where: { userId: session.user.id, deletedAt: null, category: { not: null } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  const categories = existing.map((p) => p.category!).filter(Boolean);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
