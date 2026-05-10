import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-surface-200 bg-white px-3 py-1 text-sm text-surface-800 shadow-sm transition-colors placeholder:text-surface-400",
          "focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
);
Input.displayName = "Input";

export { Input };
