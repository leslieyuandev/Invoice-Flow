"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClientAction, updateClientAction } from "@/actions/client";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { Client } from "@prisma/client";

interface ClientDialogProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onSuccess: (client: Client) => void;
}

export function ClientDialog({ open, onClose, client, onSuccess }: ClientDialogProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const data = {
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone") || undefined,
      company: fd.get("company") || undefined,
      addressLine1: fd.get("addressLine1") || undefined,
      city: fd.get("city") || undefined,
      country: fd.get("country") || undefined,
    };

    const result = client
      ? await updateClientAction(client.id, data)
      : await createClientAction(data);

    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(String(result.error));
      return;
    }

    toast.success(client ? "Client updated" : "Client added");
    onSuccess(result.data as Client);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={client ? t("clientDialog.editClient") : t("clientDialog.addClient")}>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="name" required>{t("clientDialog.name")}</Label>
              <Input id="name" name="name" required defaultValue={client?.name ?? ""} placeholder="Jane Smith" />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="email" required>{t("clientDialog.email")}</Label>
              <Input id="email" name="email" type="email" required defaultValue={client?.email ?? ""} placeholder="jane@example.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company">{t("clientDialog.company")}</Label>
              <Input id="company" name="company" defaultValue={client?.company ?? ""} placeholder="Acme Inc." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">{t("clientDialog.phone")}</Label>
              <Input id="phone" name="phone" defaultValue={client?.phone ?? ""} placeholder="+60 12 345 6789" />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="addressLine1">{t("clientDialog.address")}</Label>
              <Input id="addressLine1" name="addressLine1" defaultValue={client?.addressLine1 ?? ""} placeholder="123 Main St" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">{t("clientDialog.city")}</Label>
              <Input id="city" name="city" defaultValue={client?.city ?? ""} placeholder="Kuala Lumpur" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">{t("clientDialog.country")}</Label>
              <Input id="country" name="country" defaultValue={client?.country ?? ""} placeholder="Malaysia" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>{t("clientDialog.cancel")}</Button>
            <Button type="submit" size="sm" loading={loading}>
              {client ? t("clientDialog.saveChanges") : t("clientDialog.addClientBtn")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
