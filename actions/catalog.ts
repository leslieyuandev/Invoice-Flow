"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user.id;
}

// ── Event Categories ──────────────────────────────────────────────────────────

export async function getEventCategoriesAction() {
  await requireAdmin();
  const cats = await db.eventCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { packages: true } },
    },
  });
  return { data: cats };
}

export async function createEventCategoryAction(input: {
  name: string;
  parentId?: string | null;
  sortOrder?: number;
}) {
  if (!await requireAdmin()) return { error: "Unauthorized" };
  try {
    const slug = slugify(input.name);
    const cat = await db.eventCategory.create({
      data: {
        name: input.name.trim(),
        slug,
        parentId: input.parentId || null,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    revalidatePath("/events");
    revalidatePath("/proposals");
    return { data: cat };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create category" };
  }
}

export async function updateEventCategoryAction(id: string, input: {
  name: string;
  parentId?: string | null;
  sortOrder?: number;
}) {
  if (!await requireAdmin()) return { error: "Unauthorized" };
  try {
    const cat = await db.eventCategory.update({
      where: { id },
      data: {
        name: input.name.trim(),
        slug: slugify(input.name),
        parentId: input.parentId || null,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    revalidatePath("/events");
    revalidatePath("/proposals");
    return { data: cat };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update category" };
  }
}

export async function deleteEventCategoryAction(id: string) {
  if (!await requireAdmin()) return { error: "Unauthorized" };
  try {
    await db.eventCategory.delete({ where: { id } });
    revalidatePath("/events");
    revalidatePath("/proposals");
    return { data: { id } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Cannot delete — category has packages" };
  }
}

// ── Catalog Packages ──────────────────────────────────────────────────────────

export async function createPackageAction(input: {
  categoryId: string;
  name: string;
  priceRm: number;
  originalPriceRm?: number | null;
  features: string[];
  imageUrl?: string | null;
  tagline?: string | null;
  isBestSeller?: boolean;
}) {
  if (!await requireAdmin()) return { error: "Unauthorized" };
  try {
    const pkg = await db.catalogPackage.create({
      data: {
        categoryId: input.categoryId,
        name: input.name.trim(),
        tagline: input.tagline?.trim() || null,
        price: Math.round(input.priceRm * 100),
        originalPrice: input.originalPriceRm != null ? Math.round(input.originalPriceRm * 100) : null,
        imageUrl: input.imageUrl ?? null,
        isBestSeller: input.isBestSeller ?? false,
        isActive: true,
        features: {
          create: input.features
            .map((f) => f.trim())
            .filter(Boolean)
            .map((text, idx) => ({ text, sortOrder: idx })),
        },
      },
      include: { features: { orderBy: { sortOrder: "asc" } } },
    });
    revalidatePath("/packages");
    revalidatePath("/proposals");
    return {
      data: {
        id: pkg.id,
        categoryId: pkg.categoryId,
        name: pkg.name,
        tagline: pkg.tagline,
        price: pkg.price,
        originalPrice: pkg.originalPrice,
        imageUrl: pkg.imageUrl,
        isBestSeller: pkg.isBestSeller,
        features: pkg.features.map((f) => f.text),
      },
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create package" };
  }
}

export async function updatePackageAction(id: string, input: {
  categoryId: string;
  name: string;
  priceRm: number;
  originalPriceRm?: number | null;
  features: string[];
  imageUrl?: string | null;
  tagline?: string | null;
  isBestSeller?: boolean;
  isActive?: boolean;
}) {
  if (!await requireAdmin()) return { error: "Unauthorized" };
  try {
    await db.catalogPackageFeature.deleteMany({ where: { packageId: id } });
    const pkg = await db.catalogPackage.update({
      where: { id },
      data: {
        categoryId: input.categoryId,
        name: input.name.trim(),
        tagline: input.tagline?.trim() || null,
        price: Math.round(input.priceRm * 100),
        originalPrice: input.originalPriceRm != null ? Math.round(input.originalPriceRm * 100) : null,
        imageUrl: input.imageUrl ?? null,
        isBestSeller: input.isBestSeller ?? false,
        isActive: input.isActive ?? true,
        features: {
          create: input.features
            .map((f) => f.trim())
            .filter(Boolean)
            .map((text, idx) => ({ text, sortOrder: idx })),
        },
      },
      include: { features: { orderBy: { sortOrder: "asc" } } },
    });
    revalidatePath("/packages");
    revalidatePath("/proposals");
    return { data: { id: pkg.id } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update package" };
  }
}

export async function deletePackageAction(id: string) {
  if (!await requireAdmin()) return { error: "Unauthorized" };
  try {
    await db.catalogPackage.delete({ where: { id } });
    revalidatePath("/packages");
    revalidatePath("/proposals");
    return { data: { id } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete package" };
  }
}

// ── Catalog Add-Ons ───────────────────────────────────────────────────────────

export async function createAddOnAction(input: {
  name: string;
  priceRm?: number | null;
  unit?: string | null;
  imageUrl?: string | null;
}) {
  if (!await requireAdmin()) return { error: "Unauthorized" };
  try {
    const price = input.priceRm != null ? Math.round(input.priceRm * 100) : null;
    const priceLabel =
      price != null && input.unit
        ? `RM${input.priceRm}/${input.unit}`
        : price != null
        ? `RM${input.priceRm}`
        : null;

    const addOn = await db.catalogAddOn.create({
      data: {
        name: input.name.trim(),
        price,
        priceLabel,
        unit: input.unit?.trim() || null,
        imageUrl: input.imageUrl ?? null,
        isActive: true,
      },
    });
    revalidatePath("/addons");
    revalidatePath("/proposals");
    return {
      data: {
        id: addOn.id,
        name: addOn.name,
        price: addOn.price,
        priceLabel: addOn.priceLabel,
        unit: (addOn as { unit?: string | null }).unit ?? null,
        imageUrl: addOn.imageUrl,
      },
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create add-on" };
  }
}

export async function updateAddOnAction(id: string, input: {
  name: string;
  priceRm?: number | null;
  unit?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}) {
  if (!await requireAdmin()) return { error: "Unauthorized" };
  try {
    const price = input.priceRm != null ? Math.round(input.priceRm * 100) : null;
    const priceLabel =
      price != null && input.unit
        ? `RM${input.priceRm}/${input.unit}`
        : price != null
        ? `RM${input.priceRm}`
        : null;

    const addOn = await db.catalogAddOn.update({
      where: { id },
      data: {
        name: input.name.trim(),
        price,
        priceLabel,
        unit: input.unit?.trim() || null,
        imageUrl: input.imageUrl ?? null,
        isActive: input.isActive ?? true,
      },
    });
    revalidatePath("/addons");
    revalidatePath("/proposals");
    return { data: { id: addOn.id } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update add-on" };
  }
}

export async function deleteAddOnAction(id: string) {
  if (!await requireAdmin()) return { error: "Unauthorized" };
  try {
    await db.catalogAddOn.delete({ where: { id } });
    revalidatePath("/addons");
    revalidatePath("/proposals");
    return { data: { id } };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete add-on" };
  }
}
