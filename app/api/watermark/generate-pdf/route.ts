import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import React from "react";
import {
  Document,
  Page,
  Image,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";

function WatermarkedDocument({ imageDataUrl, orientation }: { imageDataUrl: string; orientation: "portrait" | "landscape" }) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", orientation, style: { padding: 0, margin: 0 } },
      React.createElement(Image, {
        src: imageDataUrl,
        style: { width: "100%", height: "100%", objectFit: "contain" },
      })
    )
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { imageDataUrl, orientation } = body as { imageDataUrl?: string; orientation?: string };
  if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "imageDataUrl is required" }, { status: 422 });
  }

  try {
    const element = React.createElement(
      WatermarkedDocument,
      { imageDataUrl, orientation: orientation === "landscape" ? "landscape" as const : "portrait" as const }
    ) as unknown as React.ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(element);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="watermarked.pdf"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Watermark PDF generation failed:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
