import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type))
      return NextResponse.json({ error: "Only PNG, JPG, or WebP files are allowed" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 });
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      return NextResponse.json({ error: "Image upload is not configured on this server" }, { status: 503 });

    const ext = file.name.split(".").pop() ?? "jpg";
    const blob = await put(`proposal-images/${session.user.id}-${Date.now()}.${ext}`, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Image upload failed:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
