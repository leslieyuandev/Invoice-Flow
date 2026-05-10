"use client";

import { type UseFormReturn, useWatch } from "react-hook-form";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InvoiceFormData } from "@/types";

interface SenderSectionProps {
  form: UseFormReturn<InvoiceFormData>;
}

export function SenderSection({ form }: SenderSectionProps) {
  const { register, control, formState: { errors } } = form;
  const watchedLogoUrl = useWatch({ control, name: "senderLogoUrl" });

  return (
    <div className="space-y-3">
      {/* Logo preview */}
      <div className="flex flex-col gap-1.5">
        <Label>Company Logo</Label>
        {watchedLogoUrl ? (
          <div className="flex items-center gap-3">
            <img
              src={watchedLogoUrl}
              alt="Company logo"
              className="h-10 w-auto max-w-[120px] object-contain rounded border border-surface-200 p-1 bg-white"
            />
            <p className="text-xs text-surface-400">
              Change in{" "}
              <Link href="/settings" className="text-brand-600 underline">Settings</Link>
            </p>
          </div>
        ) : (
          <p className="text-xs text-surface-400">
            No logo set. Upload one in{" "}
            <Link href="/settings" className="text-brand-600 underline">Settings</Link>.
          </p>
        )}
        <input type="hidden" {...register("senderLogoUrl")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label required>Company / Your Name</Label>
        <Input
          {...register("senderName")}
          placeholder="Acme Corp"
          error={errors.senderName?.message}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Email</Label>
        <Input
          type="email"
          {...register("senderEmail")}
          placeholder="billing@acme.com"
          error={errors.senderEmail?.message}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Address</Label>
        <Input
          {...register("senderAddress")}
          placeholder="123 Main St, City, Country"
          error={errors.senderAddress?.message}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Phone</Label>
        <Input
          {...register("senderPhone")}
          placeholder="+60 12 345 6789"
          error={errors.senderPhone?.message}
        />
      </div>
    </div>
  );
}
