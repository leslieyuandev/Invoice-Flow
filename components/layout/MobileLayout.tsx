"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

interface MobileLayoutProps {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
  mapsOnly?: boolean;
  mapsExternalUrl?: string | null;
}

export function MobileLayout({ children, userName, userEmail, mapsOnly, mapsExternalUrl }: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
