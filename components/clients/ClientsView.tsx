"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientDialog } from "./ClientDialog";
import { deleteClientAction } from "@/actions/client";
import type { Client } from "@prisma/client";

type ClientWithCount = Client & { _count: { invoices: number } };

export function ClientsView({ clients }: { clients: ClientWithCount[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setDialogOpen(true);
  }

  async function handleDelete(client: ClientWithCount) {
    if (client._count.invoices > 0) {
      toast.error(`Cannot delete "${client.name}" — they have ${client._count.invoices} invoice(s)`);
      return;
    }
    if (!confirm(`Delete client "${client.name}"? This cannot be undone.`)) return;
    const result = await deleteClientAction(client.id);
    if ("error" in result && result.error) {
      toast.error(String(result.error));
      return;
    }
    toast.success("Client deleted");
    router.refresh();
  }

  if (clients.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-surface-400" />
            </div>
            <p className="text-sm font-medium text-surface-700">No clients yet</p>
            <p className="text-xs text-surface-500 mt-1 mb-4">Add clients to start creating invoices for them</p>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </CardContent>
        </Card>
        <ClientDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          client={null}
          onSuccess={() => { setDialogOpen(false); router.refresh(); }}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100">
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Name</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Email</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Company</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">Invoices</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-surface-50 transition-colors">
                <td className="py-3.5 px-4 font-medium text-surface-900">{client.name}</td>
                <td className="py-3.5 px-4 text-surface-600">{client.email}</td>
                <td className="py-3.5 px-4 text-surface-500">{client.company ?? "—"}</td>
                <td className="py-3.5 px-4 text-surface-500">{client._count.invoices}</td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(client)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(client)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClientDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        client={editing}
        onSuccess={(_client) => { setDialogOpen(false); setEditing(null); router.refresh(); }}
      />
    </>
  );
}
