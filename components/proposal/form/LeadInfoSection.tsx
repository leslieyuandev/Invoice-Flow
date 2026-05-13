"use client";

import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { ProposalFormData } from "@/types/proposal";

interface LeadInfoSectionProps {
  form: UseFormReturn<ProposalFormData>;
}

export function LeadInfoSection({ form }: LeadInfoSectionProps) {
  const { t } = useTranslation();
  const { register, formState: { errors } } = form;

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="leadName" required>{t("proposalBuilder.leadName")}</Label>
        <Input
          id="leadName"
          {...register("leadName")}
          placeholder="e.g. John Tan"
        />
        {errors.leadName && (
          <p className="text-xs text-red-500">{errors.leadName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="leadEmail">{t("proposalBuilder.leadEmail")}</Label>
        <Input
          id="leadEmail"
          type="email"
          {...register("leadEmail")}
          placeholder="john@example.com"
        />
        {errors.leadEmail && (
          <p className="text-xs text-red-500">{String(errors.leadEmail.message)}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="leadPhone">{t("proposalBuilder.leadPhone")}</Label>
        <Input
          id="leadPhone"
          type="tel"
          {...register("leadPhone")}
          placeholder="+60 12 345 6789"
        />
      </div>
    </div>
  );
}
