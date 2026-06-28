"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteProductAction } from "@/actions/product";
import type { Product } from "@prisma/client";

function money(cents: number | null | undefined, currency: string): string {
  if (cents == null) return "—";
  return `${currency} ${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function stockLabel(product: Product): string {
  if (product.quantityInStock == null) return "—";
  const qty = Number(product.quantityInStock);
  const num = Number.isInteger(qty) ? qty.toString() : qty.toString();
  return product.unit ? `${num} ${product.unit}` : num;
}

export function ProductsView({ products }: { products: Product[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [dlg, setDlg] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.sku, p.category, p.vendorName, p.manufacturer]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [products, query]);

  async function executeDelete(product: Product) {
    setDeletingId(product.id);
    const result = await deleteProductAction(product.id);
    setDeletingId(null);
    if ("error" in result && result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Could not delete product");
      return;
    }
    toast.success("Product deleted");
    router.refresh();
  }

  // Empty state — no products at all
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-100">
            <Boxes className="h-6 w-6 text-surface-400" />
          </div>
          <p className="text-sm font-medium text-surface-700">No products yet</p>
          <p className="mb-4 mt-1 text-xs text-surface-500">
            Build a catalog of reusable items to drop into invoices and quotations.
          </p>
          <Button size="sm" asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4" />
              New Product
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="h-9 w-full rounded-md border border-surface-200 bg-white pl-9 pr-3 text-sm text-surface-800 shadow-sm placeholder:text-surface-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>
        <Button size="sm" asChild>
          <Link href="/products/new">
            <Plus className="h-4 w-4" />
            New Product
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">
                Product
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-surface-500">
                Cost
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-surface-500">
                List Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-surface-500">
                Stock
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-surface-400">
                  No products match “{query}”.
                </td>
              </tr>
            )}
            {filtered.map((product) => (
              <tr key={product.id} className="group transition-colors hover:bg-surface-50">
                <td className="px-4 py-3.5">
                  <Link href={`/products/${product.id}/edit`} className="block">
                    <span className="font-medium text-surface-900 group-hover:text-brand-700">
                      {product.name}
                    </span>
                    {product.sku && <span className="block text-xs text-surface-400">{product.sku}</span>}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-surface-500">{product.category ?? "—"}</td>
                <td className="px-4 py-3.5 text-right text-surface-500">
                  {money(product.costPrice, product.currency)}
                </td>
                <td className="px-4 py-3.5 text-right font-medium text-surface-900">
                  {money(product.listPrice, product.currency)}
                </td>
                <td className="px-4 py-3.5 text-right text-surface-500">{stockLabel(product)}</td>
                <td className="px-4 py-3.5">
                  <Badge variant={product.isActive ? "paid" : "draft"}>
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/products/${product.id}/edit`} aria-label={`Edit ${product.name}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                      disabled={deletingId === product.id}
                      onClick={() => setDlg({ open: true, product })}
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={dlg.open}
        message={
          dlg.product ? `Delete product “${dlg.product.name}”? This cannot be undone.` : ""
        }
        onConfirm={() => {
          const p = dlg.product;
          setDlg({ open: false, product: null });
          if (p) executeDelete(p);
        }}
        onCancel={() => setDlg({ open: false, product: null })}
      />
    </>
  );
}
