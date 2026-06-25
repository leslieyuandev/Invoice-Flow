import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { driveConfigured, downloadDriveFile } from "@/lib/google/drive";

export const runtime = "nodejs";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/gif"];

// POST /api/canva/drive/import  { fileId }
// Downloads a Drive image (via the shared account) and stores it as a CanvaAsset
// so it persists in the design independently of Drive.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!driveConfigured()) return NextResponse.json({ error: "Drive not configured" }, { status: 503 });
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    return NextResponse.json({ error: "Uploads are not configured on this server" }, { status: 503 });

  let fileId: string | undefined;
  try {
    const body = (await req.json()) as { fileId?: string };
    fileId = body.fileId;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!fileId) return NextResponse.json({ error: "Missing fileId" }, { status: 400 });

  try {
    const { buf, contentType, name } = await downloadDriveFile(fileId);
    const type = IMAGE_TYPES.includes(contentType) ? contentType : "image/png";
    const ext = (name.split(".").pop() || type.split("/")[1] || "png").toLowerCase();
    const blob = await put(`canva-images/${session.user.id}-${Date.now()}.${ext}`, Buffer.from(buf), {
      access: "public",
      contentType: type,
    });
    const asset = await db.canvaAsset.create({
      data: { userId: session.user.id, type: "image", url: blob.url, name: name.slice(0, 80), meta: "drive" },
    });
    return NextResponse.json({ asset });
  } catch (err) {
    console.error("Drive import failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Import failed" }, { status: 500 });
  }
}
