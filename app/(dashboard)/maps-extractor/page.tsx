import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { listJobs } from "@/lib/services/maps.service";
import { MapsExtractorView } from "@/components/maps/MapsExtractorView";

// Pulls in the Playwright-backed service graph — keep on the Node.js runtime.
export const runtime = "nodejs";

export default async function MapsExtractorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const jobs = await listJobs(session.user.id);

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <header className="flex items-center justify-between h-16 px-6 border-b border-surface-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-600" />
          <div>
            <h1 className="text-base font-semibold text-surface-900">Maps Extractor</h1>
            <p className="text-xs text-surface-500">
              Extract business leads from Google Maps — results export to CSV/JSON and save to Clients
            </p>
          </div>
        </div>
      </header>

      <div className="p-6">
        <MapsExtractorView initialJobs={jobs} />
      </div>
    </div>
  );
}
