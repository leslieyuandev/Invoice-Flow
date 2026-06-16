import "server-only";
import { db } from "@/lib/db";

/**
 * On a server restart, the in-process scrape queue is empty but the DB may still
 * have jobs marked RUNNING (mid-scrape when the process died) or PENDING (queued
 * in memory, never started). Neither will ever resume, so mark them FAILED so the
 * UI doesn't show jobs stuck forever. Called once from `instrumentation.ts`.
 */
export async function recoverInterruptedJobs(): Promise<number> {
  const res = await db.mapsScrapeJob.updateMany({
    where: { status: { in: ["RUNNING", "PENDING"] } },
    data: {
      status: "FAILED",
      error: "Interrupted by a server restart — please run it again.",
      finishedAt: new Date(),
    },
  });
  return res.count;
}
