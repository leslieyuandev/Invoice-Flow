import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TopBar } from "@/components/layout/TopBar";
import { ProductsView } from "@/components/products/ProductsView";

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const products = await db.product.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <TopBar
        title="Products"
        subtitle={`${products.length} product${products.length !== 1 ? "s" : ""}`}
      />
      <div className="p-6">
        <ProductsView products={products} />
      </div>
    </div>
  );
}
