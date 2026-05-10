"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
}

export function UserMenu({ name, email }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = name?.[0]?.toUpperCase() ?? "U";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold select-none hover:bg-brand-700 transition-colors"
        aria-label="User menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-surface-200 bg-white shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-surface-100">
            <p className="text-sm font-medium text-surface-900 truncate">{name ?? "User"}</p>
            {email && <p className="text-xs text-surface-500 truncate">{email}</p>}
          </div>
          <div className="p-1">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-surface-700 hover:bg-surface-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-surface-400" />
              Settings
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
