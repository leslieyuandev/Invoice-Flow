import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  accent?: "brand" | "green" | "orange" | "red";
}

const accentMap = {
  brand:  { bg: "bg-brand-50",  icon: "text-brand-600",  border: "border-brand-100" },
  green:  { bg: "bg-green-50",  icon: "text-green-600",  border: "border-green-100" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-100" },
  red:    { bg: "bg-red-50",    icon: "text-red-600",    border: "border-red-100" },
};

export function MetricCard({ title, value, subtitle, icon: Icon, accent = "brand" }: MetricCardProps) {
  const colors = accentMap[accent];
  return (
    <Card className="animate-fade-up">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-surface-900 tabular-nums">{value}</p>
            {subtitle && <p className="text-xs text-surface-500">{subtitle}</p>}
          </div>
          <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl border", colors.bg, colors.border)}>
            <Icon className={cn("w-5 h-5", colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="w-10 h-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}
