"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createPackageAction(input: {
  categoryId: string;
  name: string;
  priceRm: number;
  features: string[];
  imageUrl?: string | null;
  tagline?: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const pkg = await db.catalogPackage.create({
      data: {
        categoryId: input.categoryId,
        name: input.name.trim(),
        tagline: input.tagline?.trim() || null,
        price: Math.round(input.priceRm * 100),
        imageUrl: input.imageUrl ?? null,
        isActive: true,
        features: {
          create: input.features
            .map((f) => f.trim())
            .filter(Boolean)
            .map((text, idx) => ({ text, sortOrder: idx })),
        },
      },
      include: {
        features: { orderBy: { sortOrder: "asc" } },
      },
    });

    revalidatePath("/proposals");
    revalidatePath("/proposals/new");

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

export async function createAddOnAction(input: {
  name: string;
  priceRm?: number | null;
  unit?: string | null;
  imageUrl?: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

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

    revalidatePath("/proposals");
    revalidatePath("/proposals/new");

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
