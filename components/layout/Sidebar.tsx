"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, Users, Settings, Zap, X, PanelLeft, Languages, ScrollText, Calendar, Package, Sparkles, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { Locale } from "@/lib/i18n/translations";

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const PROPOSAL_SUB_LINKS = [
  { href: "/events",   label: "Events",   icon: Calendar },
  { href: "/packages", label: "Packages", icon: Package },
  { href: "/addons",   label: "Add-Ons",  icon: Sparkles },
];

export function Sidebar({ mobileOpen = false, onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useTranslation();

  const isProposalArea = ["/proposals", "/events", "/packages", "/addons"].some((p) => pathname.startsWith(p));
  const [proposalOpen, setProposalOpen] = useState(isProposalArea);

  const topLinks = [
    { href: "/",         label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/invoices", label: t("nav.invoices"),  icon: FileText },
    { href: "/clients",  label: t("nav.clients"),   icon: Users },
  ];

  const bottomLinks = [
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  function switchLocale(l: Locale) {
    setLocale(l);
    router.refresh();
  }

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return (
      <Link
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
  }

  const proposalsActive = pathname.startsWith("/proposals");
  const subActive = PROPOSAL_SUB_LINKS.some((l) => pathname.startsWith(l.href));

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
          <div className={cn("hidden items-center justify-center w-8 h-8 rounded-lg bg-brand-600 mx-auto", collapsed && "md:flex")}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-md text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
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
          {topLinks.map(({ href, label, icon }) => (
            <NavLink key={href} href={href} label={label} icon={icon} />
          ))}

          {/* Proposals + collapsible submodules */}
          <div>
            <div className={cn("flex items-center rounded-lg transition-colors", proposalsActive || subActive ? "bg-brand-50" : "")}>
              <Link
                href="/proposals"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium flex-1 transition-colors rounded-lg",
                  collapsed && "md:justify-center md:px-0",
                  proposalsActive
                    ? "text-brand-700"
                    : "text-surface-600 hover:text-surface-900"
                )}
                title={collapsed ? t("nav.proposals") : undefined}
              >
                <ScrollText className={cn("w-4 h-4 shrink-0", (proposalsActive || subActive) ? "text-brand-600" : "text-surface-400")} />
                <span className={cn(collapsed && "md:hidden")}>{t("nav.proposals")}</span>
              </Link>
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => setProposalOpen((v) => !v)}
                  className="p-2 mr-1 rounded-md text-surface-400 hover:text-surface-700 transition-colors"
                  aria-label="Toggle proposals submenu"
                >
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", proposalOpen && "rotate-180")} />
                </button>
              )}
            </div>

            {/* Submodules */}
            {proposalOpen && !collapsed && (
              <div className="mt-0.5 ml-3 pl-3 border-l border-surface-200 space-y-0.5">
                {PROPOSAL_SUB_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-50 text-brand-700"
                          : "text-surface-500 hover:bg-surface-100 hover:text-surface-900"
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", active ? "text-brand-600" : "text-surface-400")} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Collapsed: show sub-icons directly */}
            {collapsed && (
              <div className="md:flex flex-col items-center gap-0.5 hidden">
                {PROPOSAL_SUB_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      title={label}
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                        active ? "bg-brand-50 text-brand-600" : "text-surface-400 hover:bg-surface-100 hover:text-surface-700"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {bottomLinks.map(({ href, label, icon }) => (
            <NavLink key={href} href={href} label={label} icon={icon} />
          ))}
        </nav>

        {/* Language toggle */}
        <div className={cn("p-3 border-t border-surface-100", collapsed ? "flex justify-center" : "")}>
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
                  locale === "en" ? "bg-white text-surface-900 shadow-sm" : "text-surface-500 hover:text-surface-700"
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => switchLocale("zh")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                  locale === "zh" ? "bg-white text-surface-900 shadow-sm" : "text-surface-500 hover:text-surface-700"
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
