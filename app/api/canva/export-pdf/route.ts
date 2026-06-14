import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import React from "react";
import { Document, Page, Image, renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";

// px → pt (CSS 96dpi to PDF 72dpi)
const PX_TO_PT = 72 / 96;

function DesignDocument({ images, width, height }: { images: string[]; width: number; height: number }) {
  return React.createElement(
    Document,
    null,
    images.map((src, i) =>
      React.createElement(
        Page,
        { key: i, size: { width: width * PX_TO_PT, height: height * PX_TO_PT }, style: { padding: 0, margin: 0 } },
        React.createElement(Image, {
          src,
          style: { width: "100%", height: "100%", objectFit: "fill" },
        })
      )
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

  const { images, width, height } = body as { images?: string[]; width?: number; height?: number };
  if (!Array.isArray(images) || images.length === 0 || images.length > 50)
    return NextResponse.json({ error: "images (1–50 data URLs) is required" }, { status: 422 });
  if (!images.every((s) => typeof s === "string" && s.startsWith("data:image/")))
    return NextResponse.json({ error: "Every image must be a data URL" }, { status: 422 });
  if (!width || !height || width < 50 || height < 50 || width > 8000 || height > 8000)
    return NextResponse.json({ error: "Valid width/height required" }, { status: 422 });

  try {
    const element = React.createElement(
      DesignDocument,
      { images, width, height }
    ) as unknown as React.ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(element);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="design.pdf"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Canva PDF export failed:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
