import "server-only";
import { db } from "@/lib/db";

/**
 * Mirror of `maps-recovery`: on a server restart the in-process Instagram queue is
 * empty, but the DB may still show jobs RUNNING (died mid-scrape) or PENDING (queued
 * in memory, never started). Mark them FAILED so the UI doesn't show stuck jobs.
 * Called once from `instrumentation.ts`.
 */
export async function recoverInterruptedInstagramJobs(): Promise<number> {
  const res = await db.instagramScrapeJob.updateMany({
    where: { status: { in: ["RUNNING", "PENDING"] } },
    data: {
      status: "FAILED",
      error: "Interrupted by a server restart — please run it again.",
      finishedAt: new Date(),
    },
  });
  return res.count;
}
