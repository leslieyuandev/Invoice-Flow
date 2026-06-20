import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProviderStatuses } from "@/lib/services/instagram-credits";

export const runtime = "nodejs";

/** Provider availability + free-credit status, consumed by the scrape form. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const providers = await getProviderStatuses();
  return NextResponse.json({ data: providers });
}
