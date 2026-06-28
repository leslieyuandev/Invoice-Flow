"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Boxes, Coins, Warehouse, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProductAction, updateProductAction } from "@/actions/product";
import type { Product } from "@prisma/client";

interface ProductFormProps {
  mode: "create" | "edit";
  product?: Product;
  /** Distinct categories already in use, for quick autocomplete. */
  categories?: string[];
}

function toDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toRm(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toString();
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-surface-200 bg-white shadow-card">
      <div className="flex items-center gap-3 border-b border-surface-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-surface-900">{title}</h2>
          {description && <p className="text-xs text-surface-500">{description}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  full,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-surface-400">{hint}</p>}
    </div>
  );
}

export function ProductForm({ mode, product, categories = [] }: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    category: product?.category ?? "",
    vendorName: product?.vendorName ?? "",
    manufacturer: product?.manufacturer ?? "",
    isActive: product?.isActive ?? true,
    salesStartDate: toDateInput(product?.salesStartDate),
    salesEndDate: toDateInput(product?.salesEndDate),
    currency: product?.currency ?? "MYR",
    costPrice: toRm(product?.costPrice),
    listPrice: toRm(product?.listPrice),
    taxRate: product?.taxRate != null ? String(product.taxRate) : "",
    taxable: product?.taxable ?? true,
    unit: product?.unit ?? "",
    quantityInStock: product?.quantityInStock != null ? String(product.quantityInStock) : "",
    reorderLevel: product?.reorderLevel != null ? String(product.reorderLevel) : "",
    description: product?.description ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Margin preview (when both prices are present)
  const cost = form.costPrice === "" ? null : Number(form.costPrice);
  const list = form.listPrice === "" ? null : Number(form.listPrice);
  const margin =
    cost != null && list != null && list > 0 ? Math.round(((list - cost) / list) * 100) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (form.listPrice === "" || isNaN(Number(form.listPrice))) {
      toast.error("Enter a valid list price");
      return;
    }

    setSaving(true);
    const input = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      vendorName: form.vendorName,
      manufacturer: form.manufacturer,
      isActive: form.isActive,
      salesStartDate: form.salesStartDate || null,
      salesEndDate: form.salesEndDate || null,
      currency: form.currency || "MYR",
      costPriceRm: form.costPrice === "" ? null : Number(form.costPrice),
      listPriceRm: Number(form.listPrice),
      taxRate: form.taxRate === "" ? null : Number(form.taxRate),
      taxable: form.taxable,
      unit: form.unit,
      quantityInStock: form.quantityInStock === "" ? null : Number(form.quantityInStock),
      reorderLevel: form.reorderLevel === "" ? null : Number(form.reorderLevel),
      description: form.description,
    };

    const result =
      mode === "edit" && product
        ? await updateProductAction(product.id, input)
        : await createProductAction(input);

    setSaving(false);

    if ("error" in result && result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Could not save product");
      return;
    }

    toast.success(mode === "edit" ? "Product updated" : "Product created");
    router.push("/products");
    router.refresh();
  }

  const inputClass =
    "flex h-9 w-full rounded-md border border-surface-200 bg-white px-3 py-1 text-sm text-surface-800 shadow-sm transition-colors placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent";

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
      {/* Sticky action header */}
      <div className="flex items-center justify-between gap-3 border-b border-surface-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/products"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-900"
            aria-label="Back to products"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-surface-900">
              {mode === "edit" ? "Edit Product" : "Create Product"}
            </h1>
            <p className="truncate text-xs text-surface-500">
              {mode === "edit" ? form.name || "Untitled product" : "Add a reusable item to your catalog"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/products">Cancel</Link>
          </Button>
          <Button type="submit" size="sm" loading={saving}>
            {mode === "edit" ? "Save Changes" : "Save Product"}
          </Button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto bg-surface-50 p-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          {/* ── Product Information ─────────────────────────────────── */}
          <Section icon={Boxes} title="Product Information" description="Basic details about this product.">
            <Field label="Product Name" htmlFor="name" required full>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Premium Helium Balloon Bundle"
                required
              />
            </Field>

            <Field label="Product Code / SKU" htmlFor="sku">
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="e.g. BLN-PREM-01"
              />
            </Field>

            <Field label="Category" htmlFor="category">
              <input
                id="category"
                list="product-categories"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. Decorations"
                className={inputClass}
              />
              <datalist id="product-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>

            <Field label="Vendor Name" htmlFor="vendorName">
              <Input
                id="vendorName"
                value={form.vendorName}
                onChange={(e) => set("vendorName", e.target.value)}
                placeholder="e.g. PartyCo Supplies"
              />
            </Field>

            <Field label="Manufacturer" htmlFor="manufacturer">
              <Input
                id="manufacturer"
                value={form.manufacturer}
                onChange={(e) => set("manufacturer", e.target.value)}
                placeholder="e.g. BalloonWorks"
              />
            </Field>

            <Field label="Sales Start Date" htmlFor="salesStartDate">
              <input
                id="salesStartDate"
                type="date"
                value={form.salesStartDate}
                onChange={(e) => set("salesStartDate", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Sales End Date" htmlFor="salesEndDate">
              <input
                id="salesEndDate"
                type="date"
                value={form.salesEndDate}
                onChange={(e) => set("salesEndDate", e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Status" full>
              <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-surface-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                  className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-surface-700">
                  Product is active{" "}
                  <span className="text-surface-400">— available to add to invoices &amp; quotations</span>
                </span>
              </label>
            </Field>
          </Section>

          {/* ── Price Information ───────────────────────────────────── */}
          <Section
            icon={Coins}
            title="Price Information"
            description="Set the cost basis and a default selling price."
          >
            <Field
              label="Cost Price"
              htmlFor="costPrice"
              hint="What this product costs you. Used to gauge margin."
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
                  {form.currency}
                </span>
                <input
                  id="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(e) => set("costPrice", e.target.value)}
                  placeholder="0.00"
                  className={`${inputClass} pl-12`}
                />
              </div>
            </Field>

            <Field
              label="List Price"
              htmlFor="listPrice"
              required
              hint="Default selling price — you can still change it per line item when invoicing."
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
                  {form.currency}
                </span>
                <input
                  id="listPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.listPrice}
                  onChange={(e) => set("listPrice", e.target.value)}
                  placeholder="0.00"
                  className={`${inputClass} pl-12`}
                  required
                />
              </div>
            </Field>

            {margin != null && (
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 rounded-lg bg-surface-50 px-3 py-2 text-xs text-surface-600">
                  <span className="font-medium text-surface-700">Margin preview:</span>
                  <span
                    className={
                      margin < 0 ? "font-semibold text-red-600" : "font-semibold text-emerald-600"
                    }
                  >
                    {margin}%
                  </span>
                  <span className="text-surface-400">
                    ({form.currency} {(list! - cost!).toFixed(2)} profit per unit)
                  </span>
                </div>
              </div>
            )}

            <Field label="Currency" htmlFor="currency">
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => set("currency", e.target.value.toUpperCase())}
                placeholder="MYR"
                maxLength={8}
              />
            </Field>

            <Field label="Tax Rate (%)" htmlFor="taxRate">
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.taxRate}
                onChange={(e) => set("taxRate", e.target.value)}
                placeholder="e.g. 6"
              />
            </Field>

            <Field label="Taxable" full>
              <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-surface-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={form.taxable}
                  onChange={(e) => set("taxable", e.target.checked)}
                  className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-surface-700">Apply tax when this product is sold</span>
              </label>
            </Field>
          </Section>

          {/* ── Stock Information ───────────────────────────────────── */}
          <Section
            icon={Warehouse}
            title="Stock Information"
            description="Optional inventory tracking."
          >
            <Field label="Usage Unit" htmlFor="unit">
              <Input
                id="unit"
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
                placeholder="e.g. Unit, Box, Hour"
              />
            </Field>

            <div className="hidden sm:block" />

            <Field label="Quantity in Stock" htmlFor="quantityInStock">
              <Input
                id="quantityInStock"
                type="number"
                min="0"
                step="0.001"
                value={form.quantityInStock}
                onChange={(e) => set("quantityInStock", e.target.value)}
                placeholder="0"
              />
            </Field>

            <Field
              label="Reorder Level"
              htmlFor="reorderLevel"
              hint="Get reminded when stock dips to this level."
            >
              <Input
                id="reorderLevel"
                type="number"
                min="0"
                step="0.001"
                value={form.reorderLevel}
                onChange={(e) => set("reorderLevel", e.target.value)}
                placeholder="0"
              />
            </Field>
          </Section>

          {/* ── Description ─────────────────────────────────────────── */}
          <Section icon={FileText} title="Description">
            <Field label="Description" htmlFor="description" full>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                placeholder="Internal notes or a description shown when adding this product…"
                className="w-full resize-none rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </Field>
          </Section>
        </div>
      </div>
    </form>
  );
}
