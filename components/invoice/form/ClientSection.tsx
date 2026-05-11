"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { UserPlus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { InvoiceFormData } from "@/types";
import type { Client } from "@prisma/client";

interface ClientSectionProps {
  form: UseFormReturn<InvoiceFormData>;
  clients: Client[];
}

export function ClientSection({ form, clients: initialClients }: ClientSectionProps) {
  const router = useRouter();
  const { register, setValue, watch, formState: { errors } } = form;
  const selectedId = watch("clientId");
  const [clients, setClients] = useState(initialClients);
  const selectedClient = clients.find((c) => c.id === selectedId);
  const [open, setOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const { t } = useTranslation();

  function handleNewClient(newClient: Client) {
    setClients((prev) => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)));
    setValue("clientId", newClient.id, { shouldValidate: true });
    setAddClientOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1.5">
        <Label required>{t("builder.billTo")}</Label>
        {/* Custom dropdown with client list */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "flex items-center justify-between w-full h-9 px-3 rounded-md border text-sm bg-white shadow-sm transition-colors text-left",
              errors.clientId ? "border-red-500" : "border-surface-200 hover:border-surface-300",
              "focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            )}
          >
            <span className={selectedClient ? "text-surface-800" : "text-surface-400"}>
              {selectedClient ? selectedClient.name : t("client.selectClient")}
            </span>
            <ChevronDown className="w-4 h-4 text-surface-400 shrink-0" />
          </button>

          {open && (
            <div className="absolute z-50 mt-1 w-full rounded-md border border-surface-200 bg-white shadow-card-lg max-h-52 overflow-y-auto animate-slide-in-right">
              {clients.length === 0 ? (
                <p className="p-3 text-sm text-surface-500 text-center">{t("client.noClients")}</p>
              ) : (
                clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      setValue("clientId", client.id, { shouldValidate: true });
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 text-sm hover:bg-surface-50 transition-colors",
                      client.id === selectedId && "bg-brand-50 text-brand-700"
                    )}
                  >
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-surface-500">{client.email}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {errors.clientId && <span className="text-xs text-red-600">{errors.clientId.message}</span>}

        {/* Hidden input to register clientId with RHF */}
        <input type="hidden" {...register("clientId")} />
      </div>

      {selectedClient && (
        <div className="rounded-lg bg-surface-50 border border-surface-100 p-3 text-xs text-surface-600 space-y-0.5 animate-fade-up">
          {selectedClient.company && <p className="font-medium text-surface-700">{selectedClient.company}</p>}
          <p>{selectedClient.email}</p>
          {selectedClient.phone && <p>{selectedClient.phone}</p>}
          {selectedClient.addressLine1 && <p>{selectedClient.addressLine1}</p>}
          {(selectedClient.city || selectedClient.country) && (
            <p>{[selectedClient.city, selectedClient.country].filter(Boolean).join(", ")}</p>
          )}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full border border-dashed border-surface-200 text-surface-500 hover:text-surface-700 hover:border-surface-300"
        onClick={() => { setOpen(false); setAddClientOpen(true); }}
      >
        <UserPlus className="w-4 h-4" />
        {t("client.addNewClient")}
      </Button>

      <ClientDialog
        open={addClientOpen}
        onClose={() => setAddClientOpen(false)}
        client={null}
        onSuccess={handleNewClient}
      />
    </div>
  );
}
