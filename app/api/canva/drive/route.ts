import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { driveConfigured, driveRootFolder, listDrive } from "@/lib/google/drive";

export const runtime = "nodejs";

// GET /api/canva/drive?folder=<id>&q=<search>
// Lists sub-folders + image files from the shared business Drive account.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!driveConfigured()) {
    return NextResponse.json({ configured: false, root: driveRootFolder(), items: [] });
  }

  const url = new URL(req.url);
  const folder = url.searchParams.get("folder") || driveRootFolder();
  const q = url.searchParams.get("q") ?? "";

  try {
    const items = await listDrive(folder, q);
    return NextResponse.json({ configured: true, root: driveRootFolder(), folder, items });
  } catch (err) {
    console.error("Drive list failed:", err);
    return NextResponse.json(
      { configured: true, error: err instanceof Error ? err.message : "Drive error", items: [] },
      { status: 500 }
    );
  }
}
