import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
const FONT_EXTS = ["ttf", "otf", "woff", "woff2"];

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "image";
  const assets = await db.canvaAsset.findMany({
    where: { userId: session.user.id, type },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ assets });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      return NextResponse.json({ error: "Uploads are not configured on this server" }, { status: 503 });

    const formData = await req.formData();
    const file = formData.get("file");
    const type = String(formData.get("type") ?? "image");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (type === "font") {
      const ext = (file.name.split(".").pop() ?? "").toLowerCase();
      if (!FONT_EXTS.includes(ext))
        return NextResponse.json({ error: "Font must be TTF, OTF, WOFF, or WOFF2" }, { status: 400 });
      if (file.size > 10 * 1024 * 1024)
        return NextResponse.json({ error: "Font must be under 10 MB" }, { status: 400 });

      const blob = await put(`canva-fonts/${session.user.id}-${Date.now()}.${ext}`, file, { access: "public" });
      // Family name derived from the original filename (sans extension)
      const family = (formData.get("family") ? String(formData.get("family")) : file.name.replace(/\.[^.]+$/, ""))
        .replace(/[_-]+/g, " ")
        .trim()
        .slice(0, 60) || "Custom Font";
      const asset = await db.canvaAsset.create({
        data: { userId: session.user.id, type: "font", url: blob.url, name: family, meta: ext },
      });
      return NextResponse.json({ asset });
    }

    // image
    if (!IMAGE_TYPES.includes(file.type))
      return NextResponse.json({ error: "Only PNG, JPG, WebP, or SVG images are allowed" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: "Image must be under 10 MB" }, { status: 400 });

    const ext = file.name.split(".").pop() ?? "png";
    const blob = await put(`canva-images/${session.user.id}-${Date.now()}.${ext}`, file, { access: "public" });
    const asset = await db.canvaAsset.create({
      data: { userId: session.user.id, type: "image", url: blob.url, name: file.name.slice(0, 80), meta: "" },
    });
    return NextResponse.json({ asset });
  } catch (err) {
    console.error("Canva asset upload failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
