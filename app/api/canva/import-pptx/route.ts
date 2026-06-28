import { NextResponse } from "next/server";

// Allow up to 300 s on Vercel Pro (60 s on Hobby) — needed for large PPTX files
// with many embedded images that each require a Blob upload.
export const maxDuration = 300;
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { parsePptx } from "@/lib/canva/pptxParser";
import type { Prisma } from "@prisma/client";
import type { CanvaPage } from "@/types/canva";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      return NextResponse.json({ error: "Uploads are not configured on this server" }, { status: 503 });

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".pptx"))
      return NextResponse.json({ error: "File must be a .pptx file" }, { status: 400 });
    if (file.size > 50 * 1024 * 1024)
      return NextResponse.json({ error: "File is too large (max 50 MB)" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const { width, height, formatId, pages, images } = await parsePptx(buffer);

    // Upload each extracted image to Vercel Blob and record as a CanvaAsset
    const urlMap = new Map<string, string>();
    for (const [key, entry] of images) {
      const blobName = `canva-images/${session.user.id}-${Date.now()}-${entry.name}`;
      const blob = await put(blobName, entry.data, {
        access: "public",
        contentType: entry.contentType,
      });
      await db.canvaAsset.create({
        data: {
          userId: session.user.id,
          type: "image",
          url: blob.url,
          name: entry.name.slice(0, 80),
          meta: "",
        },
      });
      urlMap.set(key, blob.url);
    }

    // Replace image placeholder keys with real Blob URLs
    const resolvedPages: CanvaPage[] = pages.map((page) => ({
      ...page,
      elements: page.elements.map((el) => {
        if (el.type === "image" && el.src && urlMap.has(el.src)) {
          return { ...el, src: urlMap.get(el.src)! };
        }
        return el;
      }),
    }));

    const title = file.name.replace(/\.pptx$/i, "").slice(0, 80) || "Imported Presentation";
    const project = await db.canvaProject.create({
      data: {
        userId: session.user.id,
        title,
        format: formatId,
        width,
        height,
        pages: resolvedPages as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/canva");
    return NextResponse.json({ projectId: project.id });
  } catch (err) {
    console.error("PPTX import error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 }
    );
  }
}
