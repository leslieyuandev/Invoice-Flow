import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { instagramInputSchema } from "@/lib/validations/instagram";
import { createJob, listJobs, toJobSummary } from "@/lib/services/instagram.service";
import { assertProviderAvailable, ProviderUnavailableError } from "@/lib/services/instagram-credits";

// Provider calls are HTTP-only, but keep on the Node.js runtime for parity + lazy import.
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

  const parsed = instagramInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Free-credit gate: refuse if the chosen provider is unconfigured or over its limit.
  try {
    await assertProviderAvailable(parsed.data.provider);
  } catch (err) {
    if (err instanceof ProviderUnavailableError) {
      return NextResponse.json({ error: err.message, code: "PROVIDER_UNAVAILABLE" }, { status: 409 });
    }
    throw err;
  }

  const job = await createJob(session.user.id, parsed.data);

  // Lazy-load the runner so this route never imports the provider/network graph on
  // platforms that import the route at build time. The runner caps concurrency and
  // keeps executing after this response is sent.
  const { runInstagramJob } = await import("@/lib/services/instagram-runner");
  runInstagramJob(job.id, session.user.id);

  return NextResponse.json({ data: toJobSummary(job) }, { status: 202 });
}
