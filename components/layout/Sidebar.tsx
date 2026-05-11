"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, Users, Settings, Zap, X, PanelLeft, Languages } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { Locale } from "@/lib/i18n/translations";

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useTranslation();

  const links = [
    { href: "/",         label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/invoices", label: t("nav.invoices"),  icon: FileText },
    { href: "/clients",  label: t("nav.clients"),   icon: Users },
    { href: "/settings", label: t("nav.settings"),  icon: Settings },
  ];

  function switchLocale(l: Locale) {
    setLocale(l);
    router.refresh();
  }

  return (
    <>
      {/* Backdrop (mobile only) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex flex-col w-60 shrink-0 border-r border-surface-200 bg-white h-screen transition-all duration-200",
          "md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed && "md:w-14"
        )}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between px-3 h-16 border-b border-surface-200">
          <div className={cn("flex items-center gap-2 min-w-0", collapsed && "md:hidden")}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-surface-900 tracking-tight truncate">InvoiceFlow</span>
          </div>
          {/* Icon-only logo when collapsed on desktop */}
          <div className={cn("hidden items-center justify-center w-8 h-8 rounded-lg bg-brand-600 mx-auto", collapsed && "md:flex")}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-md text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  collapsed && "md:justify-center md:px-0",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", active ? "text-brand-600" : "text-surface-400")} />
                <span className={cn(collapsed && "md:hidden")}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Language toggle */}
        <div className={cn(
          "p-3 border-t border-surface-100",
          collapsed ? "flex justify-center" : ""
        )}>
          {collapsed ? (
            <button
              type="button"
              onClick={() => switchLocale(locale === "en" ? "zh" : "en")}
              title={locale === "en" ? "切换到中文" : "Switch to English"}
              className="p-1.5 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
            >
              <Languages className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-0.5 rounded-lg bg-surface-100 p-0.5">
              <button
                type="button"
                onClick={() => switchLocale("en")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                  locale === "en"
                    ? "bg-white text-surface-900 shadow-sm"
                    : "text-surface-500 hover:text-surface-700"
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => switchLocale("zh")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                  locale === "zh"
                    ? "bg-white text-surface-900 shadow-sm"
                    : "text-surface-500 hover:text-surface-700"
                )}
              >
                中文
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
