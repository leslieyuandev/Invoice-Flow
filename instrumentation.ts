/**
 * Runs once when a new server instance starts (Next.js stable instrumentation hook).
 * Used to recover Maps scrape jobs that were left mid-run by a previous process.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { recoverInterruptedJobs } = await import("@/lib/services/maps-recovery");
    const recovered = await recoverInterruptedJobs();
    if (recovered > 0) {
      console.log(`[maps] marked ${recovered} interrupted job(s) as FAILED on startup`);
    }
  } catch (err) {
    console.error("[maps] startup recovery failed:", err);
  }
}
