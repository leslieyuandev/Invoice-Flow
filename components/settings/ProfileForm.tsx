"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Trash2, Plus, ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction, changePasswordAction } from "@/actions/settings";
import { createTemplateAction, deleteTemplateAction } from "@/actions/template";
import { SUPPORTED_CURRENCIES } from "@/lib/utils/currency";
import { centsToDollars } from "@/lib/utils/calculations";
import type { LineItemTemplate } from "@prisma/client";

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    companyAddress: string;
    defaultCurrency: string;
    defaultPaymentTerms: number;
    defaultNotes: string;
    defaultTerms: string;
    invoiceNumberPrefix: string;
    logoUrl: string;
    hasPassword: boolean;
  };
  templates: LineItemTemplate[];
}

export function ProfileForm({ user, templates: initialTemplates }: ProfileFormProps) {
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(user.logoUrl);
  const [logoUploading, setLogoUploading] = useState(false);
  const [templates, setTemplates] = useState(initialTemplates);
  const [addingTemplate, setAddingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateProfileAction({
      name: fd.get("name"),
      companyName: fd.get("companyName") || undefined,
      companyEmail: fd.get("companyEmail") || undefined,
      companyPhone: fd.get("companyPhone") || undefined,
      companyAddress: fd.get("companyAddress") || undefined,
      defaultCurrency: fd.get("defaultCurrency"),
      defaultPaymentTerms: fd.get("defaultPaymentTerms") || undefined,
      defaultNotes: fd.get("defaultNotes") || undefined,
      defaultTerms: fd.get("defaultTerms") || undefined,
      invoiceNumberPrefix: fd.get("invoiceNumberPrefix") || undefined,
    });
    setProfileLoading(false);
    if ("error" in result && result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to save");
    } else {
      toast.success("Profile updated");
    }
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await changePasswordAction({
      currentPassword: fd.get("currentPassword"),
      newPassword: fd.get("newPassword"),
    });
    setPasswordLoading(false);
    if ("error" in result && result.error) {
      toast.error(String(result.error));
    } else {
      toast.success("Password changed");
      (e.target as HTMLFormElement).reset();
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/upload/logo", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setLogoUrl(json.url);
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAddTemplate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddingTemplate(true);
    const fd = new FormData(e.currentTarget);
    const result = await createTemplateAction({
      name: fd.get("tName"),
      description: fd.get("tDescription"),
      unitPrice: fd.get("tUnitPrice"),
    });
    setAddingTemplate(false);
    if ("error" in result && result.error) {
      toast.error(String(result.error));
      return;
    }
    if (result.data) setTemplates((prev) => [...prev, result.data!].sort((a, b) => a.name.localeCompare(b.name)));
    toast.success("Template saved");
    (e.target as HTMLFormElement).reset();
  }

  async function handleDeleteTemplate(id: string) {
    const result = await deleteTemplateAction(id);
    if ("error" in result && result.error) {
      toast.error(String(result.error));
      return;
    }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("Template deleted");
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <Card>
        <CardHeader><CardTitle>Company Logo</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company logo"
                className="h-16 w-auto max-w-[160px] object-contain rounded border border-surface-200 p-1.5 bg-white"
              />
            ) : (
              <div className="flex items-center justify-center w-16 h-16 rounded border border-dashed border-surface-300 bg-surface-50">
                <ImageIcon className="w-6 h-6 text-surface-400" />
              </div>
            )}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={logoUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {logoUrl ? "Replace logo" : "Upload logo"}
              </Button>
              <p className="text-xs text-surface-400 mt-1">PNG, JPG or WebP · max 2 MB</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleLogoChange}
          />
        </CardContent>
      </Card>

      {/* Profile & Company */}
      <Card>
        <CardHeader><CardTitle>Profile & Company</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" required>Your name</Label>
                <Input id="name" name="name" required defaultValue={user.name} placeholder="Jane Smith" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  readOnly
                  className="opacity-60 cursor-not-allowed bg-surface-50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="companyName">Company name</Label>
                <Input id="companyName" name="companyName" defaultValue={user.companyName} placeholder="Acme Inc." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="defaultCurrency">Default currency</Label>
                <select
                  id="defaultCurrency"
                  name="defaultCurrency"
                  defaultValue={user.defaultCurrency}
                  className="h-9 w-full rounded-md border border-surface-200 bg-white px-3 py-1 text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="companyEmail">Company email</Label>
                <Input id="companyEmail" name="companyEmail" type="email" defaultValue={user.companyEmail} placeholder="billing@acme.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="companyPhone">Company phone</Label>
                <Input id="companyPhone" name="companyPhone" defaultValue={user.companyPhone} placeholder="+60 12 345 6789" />
              </div>
              <div className="col-span-full flex flex-col gap-1.5">
                <Label htmlFor="companyAddress">Company address</Label>
                <Input id="companyAddress" name="companyAddress" defaultValue={user.companyAddress} placeholder="123 Jalan Maju, Kuala Lumpur" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="defaultPaymentTerms">Default payment terms (days)</Label>
                <Input
                  id="defaultPaymentTerms"
                  name="defaultPaymentTerms"
                  type="number"
                  min={1}
                  max={365}
                  defaultValue={user.defaultPaymentTerms}
                  placeholder="30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="invoiceNumberPrefix">Invoice number prefix</Label>
                <Input
                  id="invoiceNumberPrefix"
                  name="invoiceNumberPrefix"
                  defaultValue={user.invoiceNumberPrefix}
                  placeholder="INV"
                  maxLength={20}
                />
                <p className="text-xs text-surface-400">e.g. "INV" → INV-2025-001</p>
              </div>
              <div className="col-span-full flex flex-col gap-1.5">
                <Label htmlFor="defaultNotes">Default notes</Label>
                <textarea
                  id="defaultNotes"
                  name="defaultNotes"
                  rows={3}
                  defaultValue={user.defaultNotes}
                  placeholder="Any notes to appear on every invoice by default…"
                  className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
                />
              </div>
              <div className="col-span-full flex flex-col gap-1.5">
                <Label htmlFor="defaultTerms">Default payment terms text</Label>
                <textarea
                  id="defaultTerms"
                  name="defaultTerms"
                  rows={5}
                  defaultValue={user.defaultTerms}
                  placeholder="Payment instructions…"
                  className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <Button type="submit" size="sm" loading={profileLoading}>Save changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Line item templates */}
      <Card>
        <CardHeader><CardTitle>Line Item Templates</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {templates.length > 0 && (
            <div className="divide-y divide-surface-100 rounded-md border border-surface-200 overflow-hidden">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-900 truncate">{t.name}</p>
                    <p className="text-xs text-surface-500 truncate">{t.description} · MYR {centsToDollars(t.unitPrice).toFixed(2)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(t.id)}
                    className="shrink-0 p-1 rounded hover:bg-red-50 text-surface-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {templates.length === 0 && (
            <p className="text-sm text-surface-400 text-center py-4">No templates yet. Add one below.</p>
          )}
          <form onSubmit={handleAddTemplate} className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-surface-600 uppercase tracking-wide">Add new template</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="tName" required>Name</Label>
                <Input id="tName" name="tName" required placeholder="e.g. Balloon Arch Setup" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="tUnitPrice" required>Unit price (MYR)</Label>
                <Input id="tUnitPrice" name="tUnitPrice" type="number" min={0} step="0.01" required placeholder="0.00" />
              </div>
              <div className="col-span-full flex flex-col gap-1">
                <Label htmlFor="tDescription">Description</Label>
                <Input id="tDescription" name="tDescription" placeholder="Brief description shown on invoice (optional)" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="outline" size="sm" loading={addingTemplate}>
                <Plus className="w-4 h-4" />
                Add template
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {user.hasPassword && (
        <Card>
          <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handlePassword} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 max-w-sm">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="currentPassword" required>Current password</Label>
                  <Input id="currentPassword" name="currentPassword" type="password" required placeholder="••••••••" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="newPassword" required>New password</Label>
                  <Input id="newPassword" name="newPassword" type="password" required placeholder="8+ characters" />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button type="submit" size="sm" loading={passwordLoading}>Change password</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
