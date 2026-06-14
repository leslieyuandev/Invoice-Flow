"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

export function DialogContent({
  children,
  className,
  title,
  description,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 bg-black/40 z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <RadixDialog.Content
        className={cn(
          "fixed z-50 bg-white rounded-2xl shadow-xl p-6",
          // Mobile: 16px margins on each side, near top, scrollable when keyboard opens
          "left-4 right-4 top-[8%] max-h-[85dvh] overflow-y-auto",
          // SM+: centered, capped so the dialog never goes off screen
          "sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[85dvh] sm:overflow-y-auto",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
      >
        {title && (
          <RadixDialog.Title className="text-base font-semibold text-surface-900 mb-1">
            {title}
          </RadixDialog.Title>
        )}
        {description && (
          <RadixDialog.Description className="text-sm text-surface-500 mb-4">
            {description}
          </RadixDialog.Description>
        )}
        {children}
        <RadixDialog.Close className="absolute top-4 right-4 rounded-lg p-1 text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors">
          <X className="w-4 h-4" />
          <span className="sr-only">Close</span>
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
