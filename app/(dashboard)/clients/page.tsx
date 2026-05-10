import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TopBar } from "@/components/layout/TopBar";
import { ClientsView } from "@/components/clients/ClientsView";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const clients = await db.client.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { invoices: { where: { deletedAt: null } } } } },
  });

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar
        title="Clients"
        subtitle={`${clients.length} client${clients.length !== 1 ? "s" : ""}`}
      />
      <div className="p-6">
        <ClientsView clients={clients} />
      </div>
    </div>
  );
}
