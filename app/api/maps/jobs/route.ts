import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { scrapeInputSchema } from "@/lib/validations/maps";
import { createJob, listJobs, toJobSummary } from "@/lib/services/maps.service";
import { runScrapeJob } from "@/lib/services/maps-runner";

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

  // Enqueue: the runner caps concurrency (global + per-user) and keeps executing on
  // the persistent Node server after this response is sent. The proxy password is
  // passed in memory only (never persisted); all other config lives on the job row.
  runScrapeJob(job.id, session.user.id, { proxy: parsed.data.proxy ?? null });

  return NextResponse.json({ data: toJobSummary(job, 0) }, { status: 202 });
}
