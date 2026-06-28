import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/products/ProductForm";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [product, existing] = await Promise.all([
    db.product.findFirst({
      where: { id, userId: session.user.id, deletedAt: null },
    }),
    db.product.findMany({
      where: { userId: session.user.id, deletedAt: null, category: { not: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  if (!product) notFound();

  const categories = existing.map((p) => p.category!).filter(Boolean);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ProductForm mode="edit" product={product} categories={categories} />
    </div>
  );
}
