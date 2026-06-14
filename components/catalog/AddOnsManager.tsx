"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { createAddOnAction, updateAddOnAction, deleteAddOnAction } from "@/actions/catalog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface AddOn {
  id: string;
  name: string;
  price: number | null;
  priceLabel: string | null;
  unit: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

interface AddOnsManagerProps {
  addOns: AddOn[];
}

function AddOnDialog({
  addOn,
  onClose,
}: {
  addOn?: AddOn;
  onClose: () => void;
}) {
  const router = useRouter();
  const priceRmInit = addOn?.price != null ? (addOn.price / 100).toFixed(0) : "";
  const [name, setName] = useState(addOn?.name ?? "");
  const [priceRm, setPriceRm] = useState(priceRmInit);
  const [unit, setUnit] = useState(addOn?.unit ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(addOn?.imageUrl ?? null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const input = {
      name: name.trim(),
      priceRm: priceRm ? Number(priceRm) : null,
      unit: unit.trim() || null,
      imageUrl,
    };
    const result = addOn
      ? await updateAddOnAction(addOn.id, input)
      : await createAddOnAction(input);
    setSaving(false);
    if ("error" in result && result.error) { toast.error(result.error); return; }
    toast.success(addOn ? "Updated" : "Created");
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-900">{addOn ? "Edit Add-On" : "New Add-On"}</h3>
          <button type="button" onClick={onClose}><X className="w-4 h-4 text-surface-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <ImageUploadField label="Photo" value={imageUrl} onChange={setImageUrl} previewHeight="h-32" />
          <div className="space-y-1.5">
            <Label required>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Flower Bouquet" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Price (RM) <span className="text-surface-400 font-normal">optional</span></Label>
              <Input type="number" min="0" step="1" value={priceRm} onChange={(e) => setPriceRm(e.target.value)} placeholder="e.g. 20" />
            </div>
            <div className="space-y-1.5">
              <Label>Unit <span className="text-surface-400 font-normal">optional</span></Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. pcs, set" />
            </div>
          </div>
          <p className="text-xs text-surface-400 -mt-2">Label: RM{priceRm || "X"}{unit ? `/${unit}` : ""}</p>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-surface-100">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="button" className="flex-1" loading={saving} onClick={handleSave}>
            {addOn ? "Save Changes" : "Create Add-On"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AddOnsManager({ addOns }: AddOnsManagerProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"create" | AddOn | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dlg, setDlg] = useState<{ open: boolean; id: string }>({ open: false, id: "" });

  function handleDelete(id: string) {
    setDlg({ open: true, id });
  }

  async function executeDelete(id: string) {
    setDeletingId(id);
    const result = await deleteAddOnAction(id);
    setDeletingId(null);
    if ("error" in result && result.error) { toast.error(result.error); return; }
    toast.success("Deleted");
    router.refresh();
  }

  function displayPrice(ao: AddOn) {
    if (ao.priceLabel) return ao.priceLabel;
    if (ao.price != null) return `RM${Math.round(ao.price / 100)}${ao.unit ? `/${ao.unit}` : ""}`;
    return "—";
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setDialog("create")}>
          <Plus className="w-4 h-4" />
          New Add-On
        </Button>
      </div>

      <div className="border border-surface-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-surface-600">Photo</th>
              <th className="text-left px-4 py-3 font-medium text-surface-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-surface-600">Price</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {addOns.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-surface-400 text-sm">
                  No add-ons yet. Create your first add-on.
                </td>
              </tr>
            )}
            {addOns.map((ao) => (
              <tr key={ao.id} className="hover:bg-surface-50">
                <td className="px-4 py-3">
                  {ao.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ao.imageUrl} alt={ao.name} className="w-10 h-10 rounded-lg object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center text-surface-300">✦</div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-surface-900">{ao.name}</td>
                <td className="px-4 py-3 text-surface-500">{displayPrice(ao)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setDialog(ao)}
                      className="p-1.5 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ao.id)}
                      disabled={deletingId === ao.id}
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

      {dialog && (
        <AddOnDialog
          addOn={dialog === "create" ? undefined : dialog}
          onClose={() => setDialog(null)}
        />
      )}

      <ConfirmDialog
        open={dlg.open}
        message="Delete this add-on? This cannot be undone."
        onConfirm={() => { setDlg((d) => ({ ...d, open: false })); executeDelete(dlg.id); }}
        onCancel={() => setDlg((d) => ({ ...d, open: false }))}
      />
    </div>
  );
}
