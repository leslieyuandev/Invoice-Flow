import { Suspense } from "react";
import Link from "next/link";
import { DollarSign, Clock, AlertTriangle, FileText, Plus } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { MetricCard, MetricCardSkeleton } from "@/components/dashboard/MetricCard";
import { InvoiceTable, InvoiceTableSkeleton } from "@/components/dashboard/InvoiceTable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardMetrics } from "@/lib/services/invoice.service";
import { getInvoicesByUser } from "@/lib/services/invoice.service";
import { formatCurrency } from "@/lib/utils/calculations";
import { auth } from "@/lib/auth";

async function DashboardMetrics() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [metrics, invoices] = await Promise.all([
    getDashboardMetrics(session.user.id),
    getInvoicesByUser(session.user.id),
  ]);

  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 p-6 pb-0">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          subtitle="From paid invoices"
          icon={DollarSign}
          accent="green"
        />
        <MetricCard
          title="Outstanding"
          value={formatCurrency(metrics.outstanding)}
          subtitle={`${metrics.overdueCount} overdue`}
          icon={Clock}
          accent="brand"
        />
        <MetricCard
          title="Overdue"
          value={String(metrics.overdueCount)}
          subtitle="Require attention"
          icon={AlertTriangle}
          accent="orange"
        />
        <MetricCard
          title="This Month"
          value={String(metrics.invoicesThisMonth)}
          subtitle="Invoices sent"
          icon={FileText}
          accent="brand"
        />
      </div>

      <div className="p-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/invoices">View all</Link>
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

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <TopBar title="Dashboard" subtitle="Overview of your invoicing activity" />
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
