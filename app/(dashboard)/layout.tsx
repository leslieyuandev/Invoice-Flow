import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MobileLayout } from "@/components/layout/MobileLayout";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Deployment mode (runtime env, read on the server):
  //  - MAPS_ONLY=true            → self-hosted instance that shows only the scraper tools
  //  - MAPS_EXTRACTOR_URL        → on the main app, links the Maps item to the self-hosted instance
  //  - INSTAGRAM_EXTRACTOR_URL   → on the main app, links the Instagram item to the self-hosted
  //    instance. When unset, the Instagram Scraper is hidden on the main app (it lives on the
  //    self-hosted box) — set it to show an external link there instead.
  const mapsOnly = process.env.MAPS_ONLY === "true";
  const mapsExternalUrl = process.env.MAPS_EXTRACTOR_URL || null;
  const instagramExternalUrl = process.env.INSTAGRAM_EXTRACTOR_URL || null;

  return (
    <MobileLayout
      userName={session.user.name}
      userEmail={session.user.email}
      mapsOnly={mapsOnly}
      mapsExternalUrl={mapsExternalUrl}
      instagramExternalUrl={instagramExternalUrl}
    >
      {children}
    </MobileLayout>
  );
}
