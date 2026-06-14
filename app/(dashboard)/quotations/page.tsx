import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuotationTable } from "@/components/quotation/QuotationTable";
import { getQuotationsByUser } from "@/lib/services/quotation.service";

export default async function QuotationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const quotations = await getQuotationsByUser(session.user.id);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-surface-200 bg-white shrink-0">
        <h1 className="text-lg font-semibold text-surface-900">Quotations</h1>
        <Button asChild size="sm">
          <Link href="/quotations/new">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Quotation</span>
          </Link>
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <QuotationTable quotations={quotations} />
        </div>
      </div>
    </div>
  );
}
