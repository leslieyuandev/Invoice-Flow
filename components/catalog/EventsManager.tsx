"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createEventCategoryAction,
  updateEventCategoryAction,
  deleteEventCategoryAction,
} from "@/actions/catalog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  packageCount: number;
}

interface EventsManagerProps {
  categories: Category[];
}

function CategoryDialog({
  category,
  categories,
  onClose,
}: {
  category?: Category;
  categories: Category[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? "");
  const [parentId, setParentId] = useState(category?.parentId ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const input = { name: name.trim(), parentId: parentId || null };
    const result = category
      ? await updateEventCategoryAction(category.id, input)
      : await createEventCategoryAction(input);
    setSaving(false);
    if ("error" in result && result.error) { toast.error(result.error); return; }
    toast.success(category ? "Updated" : "Created");
    router.refresh();
    onClose();
  }

  const eligibleParents = categories.filter(
    (c) => c.id !== category?.id && !c.parentId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-900">{category ? "Edit Category" : "New Event Category"}</h3>
          <button type="button" onClick={onClose}><X className="w-4 h-4 text-surface-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name" required>Name</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wedding Dinner" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-parent">Parent Category <span className="text-surface-400 font-normal">(optional)</span></Label>
            <select
              id="cat-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-md border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">— Top level —</option>
              {eligibleParents.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-surface-100">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="button" className="flex-1" loading={saving} onClick={handleSave}>
            {category ? "Save Changes" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EventsManager({ categories }: EventsManagerProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"create" | Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dlg, setDlg] = useState<{ open: boolean; id: string }>({ open: false, id: "" });

  function handleDelete(id: string) {
    setDlg({ open: true, id });
  }

  async function executeDelete(id: string) {
    setDeletingId(id);
    const result = await deleteEventCategoryAction(id);
    setDeletingId(null);
    if ("error" in result && result.error) { toast.error(result.error); return; }
    toast.success("Deleted");
    router.refresh();
  }

  function parentName(parentId: string | null) {
    if (!parentId) return "—";
    return categories.find((c) => c.id === parentId)?.name ?? "—";
  }

  const topLevel = categories.filter((c) => !c.parentId);
  const children = categories.filter((c) => c.parentId);

  const rows = [
    ...topLevel,
    ...children,
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setDialog("create")}>
          <Plus className="w-4 h-4" />
          New Event Category
        </Button>
      </div>

      <div className="border border-surface-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-surface-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-surface-600">Parent</th>
              <th className="text-left px-4 py-3 font-medium text-surface-600">Packages</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-surface-400 text-sm">
                  No categories yet. Create your first event category.
                </td>
              </tr>
            )}
            {rows.map((cat) => (
              <tr key={cat.id} className="hover:bg-surface-50">
                <td className="px-4 py-3 font-medium text-surface-900">
                  {cat.parentId && <span className="text-surface-400 mr-1">└</span>}
                  {cat.name}
                </td>
                <td className="px-4 py-3 text-surface-500">{parentName(cat.parentId)}</td>
                <td className="px-4 py-3 text-surface-500">{cat.packageCount}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setDialog(cat)}
                      className="p-1.5 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id || cat.packageCount > 0}
                      title={cat.packageCount > 0 ? "Cannot delete — has packages" : "Delete"}
                      className="p-1.5 rounded-md text-surface-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
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

      {dialog && (
        <CategoryDialog
          category={dialog === "create" ? undefined : dialog}
          categories={categories}
          onClose={() => setDialog(null)}
        />
      )}

      <ConfirmDialog
        open={dlg.open}
        message="Delete this category? This cannot be undone."
        onConfirm={() => { setDlg((d) => ({ ...d, open: false })); executeDelete(dlg.id); }}
        onCancel={() => setDlg((d) => ({ ...d, open: false }))}
      />
    </div>
  );
}
