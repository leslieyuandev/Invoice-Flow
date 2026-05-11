import { Suspense } from "react";
import Link from "next/link";
import { DollarSign, Clock, AlertTriangle, FileText } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { MetricCard, MetricCardSkeleton } from "@/components/dashboard/MetricCard";
import { InvoiceTable, InvoiceTableSkeleton } from "@/components/dashboard/InvoiceTable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardMetrics } from "@/lib/services/invoice.service";
import { getInvoicesByUser } from "@/lib/services/invoice.service";
import { formatCurrency } from "@/lib/utils/calculations";
import { auth } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";

async function DashboardMetrics() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const t = await getServerT();

  const [metrics, invoices] = await Promise.all([
    getDashboardMetrics(session.user.id),
    getInvoicesByUser(session.user.id),
  ]);

  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 p-6 pb-0">
        <MetricCard
          title={t("dashboard.totalRevenue")}
          value={formatCurrency(metrics.totalRevenue)}
          subtitle={t("dashboard.totalRevenue.subtitle")}
          icon={DollarSign}
          accent="green"
        />
        <MetricCard
          title={t("dashboard.outstanding")}
          value={formatCurrency(metrics.outstanding)}
          subtitle={t("dashboard.outstanding.subtitle").replace("{n}", String(metrics.overdueCount))}
          icon={Clock}
          accent="brand"
        />
        <MetricCard
          title={t("dashboard.overdue")}
          value={String(metrics.overdueCount)}
          subtitle={t("dashboard.overdue.subtitle")}
          icon={AlertTriangle}
          accent="orange"
        />
        <MetricCard
          title={t("dashboard.thisMonth")}
          value={String(metrics.invoicesThisMonth)}
          subtitle={t("dashboard.thisMonth.subtitle")}
          icon={FileText}
          accent="brand"
        />
      </div>

      <div className="p-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("dashboard.recentInvoices")}</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/invoices">{t("dashboard.viewAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <InvoiceTable invoices={invoices.slice(0, 8)} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default async function DashboardPage() {
  const t = await getServerT();

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />
      <Suspense
        fallback={
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)}
            </div>
            <Card>
              <CardHeader><div className="h-5 w-32 bg-surface-200 rounded animate-pulse" /></CardHeader>
              <CardContent className="p-0 pb-2"><InvoiceTableSkeleton /></CardContent>
            </Card>
          </div>
        }
      >
        <DashboardMetrics />
      </Suspense>
    </div>
  );
}
