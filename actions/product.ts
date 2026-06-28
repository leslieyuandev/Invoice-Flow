"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/utils/calculations";
import { createProductSchema, updateProductSchema } from "@/lib/validations/product";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";

type ParsedProduct = z.output<typeof createProductSchema>;

function buildData(parsed: ParsedProduct): Omit<Prisma.ProductUncheckedCreateInput, "userId"> {
  return {
    name: parsed.name,
    sku: parsed.sku ?? null,
    category: parsed.category ?? null,
    vendorName: parsed.vendorName ?? null,
    manufacturer: parsed.manufacturer ?? null,
    isActive: parsed.isActive,
    salesStartDate: parsed.salesStartDate,
    salesEndDate: parsed.salesEndDate,
    currency: parsed.currency,
    costPrice: parsed.costPriceRm != null ? dollarsToCents(parsed.costPriceRm) : null,
    listPrice: dollarsToCents(parsed.listPriceRm),
    taxRate: parsed.taxRate,
    taxable: parsed.taxable,
    unit: parsed.unit ?? null,
    quantityInStock: parsed.quantityInStock,
    reorderLevel: parsed.reorderLevel,
    description: parsed.description ?? null,
  };
}

export async function createProductAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = createProductSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.flatten().fieldErrors };
  }

  const product = await db.product.create({
    data: { ...buildData(parsed.data), userId: session.user.id },
  });

  revalidatePath("/products");
  return { data: product };
}

export async function updateProductAction(productId: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db.product.findFirst({
    where: { id: productId, userId: session.user.id, deletedAt: null },
  });
  if (!existing) return { error: "Not found" };

  const parsed = updateProductSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.flatten().fieldErrors };
  }

  const product = await db.product.update({
    where: { id: productId },
    data: buildData(parsed.data),
  });

  revalidatePath("/products");
  revalidatePath(`/products/${productId}/edit`);
  return { data: product };
}

export async function deleteProductAction(productId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db.product.findFirst({
    where: { id: productId, userId: session.user.id, deletedAt: null },
  });
  if (!existing) return { error: "Not found" };

  await db.product.update({
    where: { id: productId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/products");
  return { data: null };
}

export async function getProductsAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db.product.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { name: "asc" },
  });
}
