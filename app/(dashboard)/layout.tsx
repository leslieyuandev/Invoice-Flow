import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MobileLayout } from "@/components/layout/MobileLayout";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Deployment mode (runtime env, read on the server):
  //  - MAPS_ONLY=true        → self-hosted instance that shows only the Maps Extractor
  //  - MAPS_EXTRACTOR_URL    → on the main app, links the sidebar item to the self-hosted instance
  const mapsOnly = process.env.MAPS_ONLY === "true";
  const mapsExternalUrl = process.env.MAPS_EXTRACTOR_URL || null;

  return (
    <MobileLayout
      userName={session.user.name}
      userEmail={session.user.email}
      mapsOnly={mapsOnly}
      mapsExternalUrl={mapsExternalUrl}
    >
      {children}
    </MobileLayout>
  );
}
