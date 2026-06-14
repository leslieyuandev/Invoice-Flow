import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await db.user.update({ where: { id: session.user.id }, data: { watermarkUrl: null } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("watermark");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      return NextResponse.json({ error: "Only PNG, JPG, or WebP files are allowed" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Image upload is not configured on this server" }, { status: 503 });
    }

    const blob = await put(`watermarks/${session.user.id}-${Date.now()}`, file, { access: "public" });
    await db.user.update({ where: { id: session.user.id }, data: { watermarkUrl: blob.url } });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Watermark upload failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
