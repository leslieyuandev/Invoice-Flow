/**
 * Runs once when a new server instance starts (Next.js stable instrumentation hook).
 * Used to recover Maps + Instagram scrape jobs left mid-run by a previous process.
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
  try {
    const { recoverInterruptedInstagramJobs } = await import("@/lib/services/instagram-recovery");
    const recovered = await recoverInterruptedInstagramJobs();
    if (recovered > 0) {
      console.log(`[instagram] marked ${recovered} interrupted job(s) as FAILED on startup`);
    }
  } catch (err) {
    console.error("[instagram] startup recovery failed:", err);
  }
}
