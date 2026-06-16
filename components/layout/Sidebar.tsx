"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, Users, Settings, Zap, X, PanelLeft, Languages, ScrollText, Calendar, Package, Sparkles, ChevronDown, ClipboardList, Stamp, Gift, Palette, MapPin, ExternalLink, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { Locale } from "@/lib/i18n/translations";

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  userName?: string | null;
  userEmail?: string | null;
  /** Self-hosted "Maps only" deployment: hide every other module. */
  mapsOnly?: boolean;
  /** When set, the Maps Extractor nav item links to this external URL (e.g. the self-hosted instance). */
  mapsExternalUrl?: string | null;
}

const PROPOSAL_SUB_LINKS = [
  { href: "/events",   label: "Events",   icon: Calendar },
  { href: "/packages", label: "Packages", icon: Package },
  { href: "/addons",   label: "Add-Ons",  icon: Sparkles },
];

export function Sidebar({ mobileOpen = false, onClose, collapsed = false, onToggleCollapse, userName, userEmail, mapsOnly = false, mapsExternalUrl = null }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useTranslation();

  const isProposalArea = ["/proposals", "/events", "/packages", "/addons"].some((p) => pathname.startsWith(p));
  const [proposalOpen, setProposalOpen] = useState(isProposalArea);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const topLinks = [
    { href: "/",           label: t("nav.dashboard"),   icon: LayoutDashboard },
    { href: "/invoices",   label: t("nav.invoices"),    icon: FileText },
    { href: "/quotations", label: "Quotations",         icon: ClipboardList },
    { href: "/clients",    label: t("nav.clients"),     icon: Users },
  ];

  const creativeLinks = [
    { href: "/canva",          label: "Canva Project", icon: Palette },
    { href: "/greeting-card",  label: "Greeting Card", icon: Gift },
    { href: "/watermark",      label: "Watermark",     icon: Stamp },
  ];

  const toolLinks = [
    { href: "/maps-extractor", label: "Maps Extractor", icon: MapPin },
  ];

  const profileInitial = userName?.[0]?.toUpperCase() ?? "U";

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
          "fixed top-0 left-0 z-50 flex flex-col w-60 shrink-0 border-r border-surface-200 bg-white h-dvh transition-all duration-200",
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
          {!mapsOnly && topLinks.map(({ href, label, icon }) => (
            <NavLink key={href} href={href} label={label} icon={icon} />
          ))}

          {!mapsOnly && (
          <>
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

          {/* Creative group */}
          <div className="pt-3">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-surface-400">Creative</p>
            )}
            {collapsed && <div className="my-2 mx-auto w-6 border-t border-surface-200" />}
            {creativeLinks.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} />
            ))}
          </div>
          </>
          )}

          {/* Tools group (Maps Extractor) */}
          <div className={cn(!mapsOnly && "pt-3")}>
            {!collapsed && !mapsOnly && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-surface-400">Tools</p>
            )}
            {collapsed && !mapsOnly && <div className="my-2 mx-auto w-6 border-t border-surface-200" />}
            {mapsExternalUrl ? (
              <a
                href={mapsExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                title={collapsed ? "Maps Extractor" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-surface-600 hover:bg-surface-100 hover:text-surface-900",
                  collapsed && "md:justify-center md:px-0"
                )}
              >
                <MapPin className="w-4 h-4 shrink-0 text-surface-400" />
                <span className={cn(collapsed && "md:hidden")}>Maps Extractor</span>
                {!collapsed && <ExternalLink className="w-3 h-3 ml-auto text-surface-300" />}
              </a>
            ) : (
              toolLinks.map(({ href, label, icon }) => (
                <NavLink key={href} href={href} label={label} icon={icon} />
              ))
            )}
          </div>
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

        {/* Profile (bottom, below language switcher) */}
        <div ref={profileRef} className="relative p-3 border-t border-surface-100">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            title={collapsed ? (userName ?? "Profile") : undefined}
            className={cn(
              "flex items-center gap-2.5 w-full rounded-lg p-1.5 hover:bg-surface-100 transition-colors",
              collapsed && "md:justify-center"
            )}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold shrink-0 select-none">
              {profileInitial}
            </span>
            <span className={cn("flex-1 min-w-0 text-left", collapsed && "md:hidden")}>
              <span className="block text-sm font-medium text-surface-900 truncate">{userName ?? "User"}</span>
              {userEmail && <span className="block text-xs text-surface-500 truncate">{userEmail}</span>}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1 rounded-xl border border-surface-200 bg-white shadow-lg z-50 overflow-hidden p-1">
              <Link
                href="/settings"
                onClick={() => { setProfileOpen(false); onClose?.(); }}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-surface-700 hover:bg-surface-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-surface-400" />
                {t("nav.settings")}
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
          )}
        </div>
      </aside>
    </>
  );
}
