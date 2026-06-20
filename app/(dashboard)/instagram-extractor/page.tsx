import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Camera } from "lucide-react";
import { listJobs } from "@/lib/services/instagram.service";
import { getProviderStatuses } from "@/lib/services/instagram-credits";
import { InstagramExtractorView } from "@/components/instagram/InstagramExtractorView";

// Reads provider state + jobs (pure Prisma). The provider/network graph is only ever
// pulled into the POST route's runner — never here.
export const runtime = "nodejs";

export default async function InstagramExtractorPage() {
  // The Instagram Scraper runs on the self-hosted instance only (MAPS_ONLY=true).
  // On the main app (e.g. Vercel) it isn't a hosted module — bounce to the external
  // self-hosted URL if one is configured, otherwise to the dashboard.
  if (process.env.MAPS_ONLY !== "true") {
    redirect(process.env.INSTAGRAM_EXTRACTOR_URL || "/");
  }

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [jobs, providers] = await Promise.all([listJobs(session.user.id), getProviderStatuses()]);

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <header className="flex items-center justify-between h-16 px-6 border-b border-surface-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-brand-600" />
          <div>
            <h1 className="text-base font-semibold text-surface-900">Instagram Hashtag Scraper</h1>
            <p className="text-xs text-surface-500">
              Scrape posts &amp; reels by hashtag — captions, likes, plays, comments, audio &amp; more.
              Export to CSV/JSON.
            </p>
          </div>
        </div>
      </header>

      <div className="p-6">
        <InstagramExtractorView initialJobs={jobs} initialProviders={providers} />
      </div>
    </div>
  );
}
