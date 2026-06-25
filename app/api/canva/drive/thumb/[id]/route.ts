import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { driveConfigured, getDriveThumb } from "@/lib/google/drive";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/canva/drive/thumb/<fileId>
// Proxies a Drive thumbnail through the server so the browser <img> can show it
// without exposing the access token.
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!driveConfigured()) return NextResponse.json({ error: "Drive not configured" }, { status: 503 });

  const { id } = await params;
  try {
    const thumb = await getDriveThumb(id);
    if (!thumb) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return new NextResponse(thumb.buf, {
      headers: {
        "Content-Type": thumb.contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Drive thumb failed:", err);
    return NextResponse.json({ error: "Thumb error" }, { status: 500 });
  }
}
