"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { createPackageAction, updatePackageAction, deletePackageAction } from "@/actions/catalog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Package {
  id: string;
  categoryId: string;
  name: string;
  tagline: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  isBestSeller: boolean;
  isActive: boolean;
  features: string[];
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface PackagesManagerProps {
  packages: Package[];
  categories: Category[];
}

function PackageDialog({
  pkg,
  categories,
  defaultCategoryId,
  onClose,
}: {
  pkg?: Package;
  categories: Category[];
  defaultCategoryId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(pkg?.categoryId ?? defaultCategoryId ?? "");
  const [name, setName] = useState(pkg?.name ?? "");
  const [tagline, setTagline] = useState(pkg?.tagline ?? "");
  const [priceRm, setPriceRm] = useState(pkg ? (pkg.price / 100).toFixed(0) : "");
  const [originalPriceRm, setOriginalPriceRm] = useState(
    pkg?.originalPrice != null ? (pkg.originalPrice / 100).toFixed(0) : ""
  );
  const [featuresText, setFeaturesText] = useState(pkg?.features.join("\n") ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(pkg?.imageUrl ?? null);
  const [isBestSeller, setIsBestSeller] = useState(pkg?.isBestSeller ?? false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!categoryId) { toast.error("Select a category"); return; }
    if (!priceRm || isNaN(Number(priceRm))) { toast.error("Enter a valid price"); return; }
    setSaving(true);
    const input = {
      categoryId,
      name: name.trim(),
      tagline: tagline.trim() || null,
      priceRm: Number(priceRm),
      originalPriceRm: originalPriceRm ? Number(originalPriceRm) : null,
      features: featuresText.split("\n").map((l) => l.trim()).filter(Boolean),
      imageUrl,
      isBestSeller,
    };
    const result = pkg
      ? await updatePackageAction(pkg.id, input)
      : await createPackageAction(input);
    setSaving(false);
    if ("error" in result && result.error) { toast.error(result.error); return; }
    toast.success(pkg ? "Updated" : "Created");
    router.refresh();
    onClose();
  }

  const leafCategories = categories.filter((c) => {
    const hasChildren = categories.some((ch) => ch.parentId === c.id);
    return !hasChildren;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-900">{pkg ? "Edit Package" : "New Package"}</h3>
          <button type="button" onClick={onClose}><X className="w-4 h-4 text-surface-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <ImageUploadField label="Package Photo" value={imageUrl} onChange={setImageUrl} previewHeight="h-40" />

          <div className="space-y-1.5">
            <Label required>Category</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-md border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">Select category…</option>
              {leafCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label required>Package Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Premium Package" />
          </div>

          <div className="space-y-1.5">
            <Label>Tagline <span className="text-surface-400 font-normal">optional</span></Label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. 锦上添花" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label required>Price (RM)</Label>
              <Input type="number" min="0" step="1" value={priceRm} onChange={(e) => setPriceRm(e.target.value)} placeholder="e.g. 888" />
            </div>
            <div className="space-y-1.5">
              <Label>Original Price (RM) <span className="text-surface-400 font-normal">optional</span></Label>
              <Input type="number" min="0" step="1" value={originalPriceRm} onChange={(e) => setOriginalPriceRm(e.target.value)} placeholder="e.g. 1288" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Features / Description <span className="text-surface-400 font-normal">(one per line)</span></Label>
            <textarea
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
              placeholder={"12x Helium Balloons\n1x Balloon Arch\nSetup & teardown included"}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isBestSeller}
              onChange={(e) => setIsBestSeller(e.target.checked)}
              className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-surface-700">Best Seller badge</span>
          </label>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-surface-100">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="button" className="flex-1" loading={saving} onClick={handleSave}>
            {pkg ? "Save Changes" : "Create Package"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PackagesManager({ packages, categories }: PackagesManagerProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"create" | Package | null>(null);
  const [defaultCatId, setDefaultCatId] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dlg, setDlg] = useState<{ open: boolean; id: string }>({ open: false, id: "" });

  function handleDelete(id: string) {
    setDlg({ open: true, id });
  }

  async function executeDelete(id: string) {
    setDeletingId(id);
    const result = await deletePackageAction(id);
    setDeletingId(null);
    if ("error" in result && result.error) { toast.error(result.error); return; }
    toast.success("Deleted");
    router.refresh();
  }

  function catName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? id;
  }

  function openCreate(catId?: string) {
    setDefaultCatId(catId ?? "");
    setDialog("create");
  }

  const grouped = new Map<string, Package[]>();
  for (const cat of categories.filter((c) => !categories.some((ch) => ch.parentId === c.id))) {
    grouped.set(cat.id, packages.filter((p) => p.categoryId === cat.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" onClick={() => openCreate()}>
          <Plus className="w-4 h-4" />
          New Package
        </Button>
      </div>

      {packages.length === 0 && (
        <div className="border border-surface-200 rounded-xl p-8 text-center text-surface-400 text-sm">
          No packages yet. Create your first package.
        </div>
      )}

      {[...grouped.entries()].map(([catId, pkgs]) => (
        <div key={catId}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wide">{catName(catId)}</h2>
            <button
              type="button"
              onClick={() => openCreate(catId)}
              className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="border border-surface-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-surface-600 w-14">Photo</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-surface-600">Price</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {pkgs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-surface-400 text-xs italic">
                      No packages in this category yet.
                    </td>
                  </tr>
                )}
                {pkgs.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-surface-50">
                    <td className="px-4 py-3">
                      {pkg.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pkg.imageUrl} alt={pkg.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-300">✦</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-surface-900">{pkg.name}</span>
                        {pkg.isBestSeller && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                      </div>
                      {pkg.tagline && <p className="text-xs text-surface-400">{pkg.tagline}</p>}
                    </td>
                    <td className="px-4 py-3 text-surface-500">
                      RM{Math.round(pkg.price / 100)}
                      {pkg.originalPrice != null && (
                        <span className="line-through ml-1 text-surface-300">RM{Math.round(pkg.originalPrice / 100)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDialog(pkg)}
                          className="p-1.5 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(pkg.id)}
                          disabled={deletingId === pkg.id}
                          className="p-1.5 rounded-md text-surface-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {dialog && (
        <PackageDialog
          pkg={dialog === "create" ? undefined : dialog}
          categories={categories}
          defaultCategoryId={dialog === "create" ? defaultCatId : undefined}
          onClose={() => setDialog(null)}
        />
      )}

      <ConfirmDialog
        open={dlg.open}
        message="Delete this package? This cannot be undone."
        onConfirm={() => { setDlg((d) => ({ ...d, open: false })); executeDelete(dlg.id); }}
        onCancel={() => setDlg((d) => ({ ...d, open: false }))}
      />
    </div>
  );
}
