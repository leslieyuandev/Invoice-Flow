"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CollapsibleCardProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleCard({ title, defaultOpen = true, children }: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none py-3 px-4 md:px-6"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {open
            ? <ChevronUp className="w-4 h-4 text-surface-400 shrink-0" />
            : <ChevronDown className="w-4 h-4 text-surface-400 shrink-0" />
          }
        </div>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  );
}
