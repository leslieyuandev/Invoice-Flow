import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        draft:     "bg-surface-100 text-surface-600",
        sent:      "bg-blue-50 text-blue-700",
        viewed:    "bg-purple-50 text-purple-700",
        paid:      "bg-green-50 text-green-700",
        overdue:   "bg-orange-50 text-orange-700",
        cancelled: "bg-red-50 text-red-700",
      },
    },
    defaultVariants: { variant: "draft" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
