import { auth } from "@/lib/auth";
import { getInvoicesByUser } from "@/lib/services/invoice.service";
import { TopBar } from "@/components/layout/TopBar";
import { InvoiceTable } from "@/components/dashboard/InvoiceTable";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/translations";

type PageProps = { searchParams: Promise<{ status?: string }> };

export default async function InvoicesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const t = await getServerT();

  const STATUS_TABS: { labelKey: TranslationKey; value: string }[] = [
    { labelKey: "invoices.tab.all",     value: "all" },
    { labelKey: "invoices.tab.draft",   value: "DRAFT" },
    { labelKey: "invoices.tab.sent",    value: "SENT" },
    { labelKey: "invoices.tab.overdue", value: "OVERDUE" },
    { labelKey: "invoices.tab.paid",    value: "PAID" },
  ];

  const { status = "all" } = await searchParams;
  const allInvoices = await getInvoicesByUser(session.user.id);

  const filtered =
    status === "all"
      ? allInvoices
      : allInvoices.filter((i) => i.status === status);

  const counts = Object.fromEntries(
    STATUS_TABS.map(({ value }) => [
      value,
      value === "all" ? allInvoices.length : allInvoices.filter((i) => i.status === value).length,
    ])
  );

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title={t("invoices.title")} subtitle={`${allInvoices.length} total`} />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-1 rounded-lg bg-surface-100 p-1 w-fit">
          {STATUS_TABS.map(({ labelKey, value }) => {
            const active = status === value;
            return (
              <Link
                key={value}
                href={value === "all" ? "/invoices" : `/invoices?status=${value}`}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  active
                    ? "bg-white text-surface-900 shadow-sm"
                    : "text-surface-600 hover:text-surface-900"
                )}
              >
                {t(labelKey)}
                {counts[value] > 0 && (
                  <span className={cn("ml-1.5 text-xs", active ? "text-surface-500" : "text-surface-400")}>
                    {counts[value]}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <Card>
          <CardContent className="p-0 pb-2">
            <InvoiceTable invoices={filtered} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
