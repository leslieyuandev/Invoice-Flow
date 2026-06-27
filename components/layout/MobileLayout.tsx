"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

interface MobileLayoutProps {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
  mapsOnly?: boolean;
  mapsExternalUrl?: string | null;
  instagramExternalUrl?: string | null;
}

export function MobileLayout({ children, userName, userEmail, mapsOnly, mapsExternalUrl, instagramExternalUrl }: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // The Canva design editor (/canva/<id>) runs full-screen so iPad users get the
  // whole viewport to design in: no app sidebar, no mobile top bar. The editor's own
  // Home button (top-left) is the way back to the dashboard/sidebar. The /canva grid
  // page keeps the normal chrome.
  const isCanvaEditor = /^\/canva\/[^/]+$/.test(pathname);

  if (isCanvaEditor) {
    return (
      <LanguageProvider>
        <div className="h-dvh overflow-hidden bg-surface-50">{children}</div>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
    <div className="flex h-dvh overflow-hidden bg-surface-50">
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
        userName={userName}
        userEmail={userEmail}
        mapsOnly={mapsOnly}
        mapsExternalUrl={mapsExternalUrl}
        instagramExternalUrl={instagramExternalUrl}
      />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center h-14 px-4 border-b border-surface-200 bg-white md:hidden shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-md text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
    </LanguageProvider>
  );
}
