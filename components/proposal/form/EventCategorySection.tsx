"use client";

import type { UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { ProposalFormData, CatalogCategoryTree } from "@/types/proposal";

interface EventCategorySectionProps {
  form: UseFormReturn<ProposalFormData>;
  categoryTree: CatalogCategoryTree[];
}

export function EventCategorySection({ form, categoryTree }: EventCategorySectionProps) {
  const { t } = useTranslation();
  const { register, setValue, formState: { errors } } = form;
  const selectedCategoryId = useWatch({ control: form.control, name: "eventCategoryId" });

  // Find which top-level node is "active" (either directly selected or a parent of selected)
  const allCategories = categoryTree.flatMap((top) => [top, ...top.children]);

  const selectedNode = allCategories.find((c) => c.id === selectedCategoryId);
  const activeTopLevel = categoryTree.find(
    (top) => top.id === selectedCategoryId || top.children.some((c) => c.id === selectedCategoryId)
  );

  function selectCategory(id: string) {
    setValue("eventCategoryId", id, { shouldValidate: true, shouldDirty: true });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="eventTitle" required>{t("proposalBuilder.eventTitle")}</Label>
        <Input
          id="eventTitle"
          {...register("eventTitle")}
          placeholder={t("proposalBuilder.eventTitle.placeholder")}
        />
        {errors.eventTitle && (
          <p className="text-xs text-red-500">{errors.eventTitle.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label required>{t("proposalBuilder.eventCategory")}</Label>

        {/* Top-level category pills */}
        <div className="flex flex-wrap gap-2">
          {categoryTree.map((top) => {
            const isActive = top.id === selectedCategoryId || top.children.some((c) => c.id === selectedCategoryId);
            return (
              <button
                key={top.id}
                type="button"
                onClick={() => {
                  if (top.children.length === 0) {
                    selectCategory(top.id);
                  } else {
                    // Select first child by default when expanding a parent
                    selectCategory(top.children[0].id);
                  }
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                  isActive
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-surface-700 border-surface-200 hover:border-brand-400 hover:text-brand-600"
                )}
              >
                {top.name}
              </button>
            );
          })}
        </div>

        {/* Sub-category pills (shown when active top-level has children) */}
        {activeTopLevel && activeTopLevel.children.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-2 border-l-2 border-brand-100">
            {activeTopLevel.children.map((sub) => {
              const isActive = sub.id === selectedCategoryId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => selectCategory(sub.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    isActive
                      ? "bg-brand-100 text-brand-700 border-brand-300"
                      : "bg-white text-surface-600 border-surface-200 hover:border-brand-300 hover:text-brand-600"
                  )}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        )}

        {errors.eventCategoryId && (
          <p className="text-xs text-red-500">Please select an event category</p>
        )}

        {selectedNode && (
          <p className="text-xs text-surface-400">Selected: {selectedNode.name}</p>
        )}
      </div>
    </div>
  );
}
