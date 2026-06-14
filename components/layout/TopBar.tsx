import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerT } from "@/lib/i18n/server";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export async function TopBar({ title, subtitle }: TopBarProps) {
  const t = await getServerT();

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-surface-200 bg-white shrink-0">
      <div>
        <h1 className="text-base font-semibold text-surface-900">{title}</h1>
        {subtitle && <p className="text-xs text-surface-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <Button asChild size="sm">
          <Link href="/invoices/new">
            <Plus className="w-4 h-4" />
            {t("topbar.newInvoice")}
          </Link>
        </Button>
      </div>
    </header>
  );
}
