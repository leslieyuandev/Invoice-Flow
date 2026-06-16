import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { scrapeInputSchema } from "@/lib/validations/maps";
import { createJob, listJobs, toJobSummary } from "@/lib/services/maps.service";

// Scraping spawns headless Chromium — must run on the Node.js runtime, never edge.
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const jobs = await listJobs(session.user.id);
  return NextResponse.json({ data: jobs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = scrapeInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const job = await createJob(session.user.id, parsed.data);

  // Lazy-load the Playwright-backed runner so this route never imports the browser
  // engine on platforms that can't run it (e.g. Vercel). On the self-hosted Node
  // server it loads once on the first scrape. The runner caps concurrency (global +
  // per-user) and keeps executing after this response is sent; the proxy password is
  // passed in memory only (never persisted), all other config lives on the job row.
  const { runScrapeJob } = await import("@/lib/services/maps-runner");
  runScrapeJob(job.id, session.user.id, { proxy: parsed.data.proxy ?? null });

  return NextResponse.json({ data: toJobSummary(job, 0) }, { status: 202 });
}
