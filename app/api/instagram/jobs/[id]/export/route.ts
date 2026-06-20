import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPostsForExport, toPostRow, toScrapedPost } from "@/lib/services/instagram.service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

type Row = ReturnType<typeof toPostRow>;
const CSV_COLUMNS: { header: string; value: (r: Row) => unknown }[] = [
  { header: "Hashtag", value: (r) => r.hashtag },
  { header: "Text (caption)", value: (r) => r.caption },
  { header: "Author", value: (r) => r.ownerFullName },
  { header: "Author username", value: (r) => r.ownerUsername },
  { header: "Post URL", value: (r) => r.postUrl },
  { header: "Type", value: (r) => r.type },
  { header: "Likes", value: (r) => r.likesCount },
  { header: "Comments", value: (r) => r.commentsCount },
  { header: "Plays / Views", value: (r) => r.videoViewCount },
  { header: "Shares", value: (r) => r.sharesCount },
  { header: "First Comment", value: (r) => r.firstComment },
  { header: "Location", value: (r) => r.locationName },
  { header: "Posted on", value: (r) => r.timestamp },
  { header: "Hashtags", value: (r) => r.hashtags },
  { header: "Mentions", value: (r) => r.mentions },
  { header: "Audio", value: (r) => [r.musicInfo?.artist, r.musicInfo?.title].filter(Boolean).join(" – ") },
  { header: "Images", value: (r) => r.images?.length ?? (r.displayUrl ? 1 : 0) },
  { header: "Display URL", value: (r) => r.displayUrl },
  { header: "Shortcode", value: (r) => r.shortCode },
  { header: "Provider", value: (r) => r.provider },
];

function csvCell(value: unknown): string {
  if (value == null) return "";
  const s = Array.isArray(value) ? value.join("; ") : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const posts = await getPostsForExport(id, session.user.id);
  if (!posts) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const format = (req.nextUrl.searchParams.get("format") || "json").toLowerCase();

  if (format === "csv") {
    const rows = posts.map(toPostRow);
    const lines = [
      CSV_COLUMNS.map((c) => csvCell(c.header)).join(","),
      ...rows.map((r) => CSV_COLUMNS.map((c) => csvCell(c.value(r))).join(",")),
    ];
    // Prepend BOM so Excel reads UTF-8 correctly.
    const csvBody = "﻿" + lines.join("\r\n");
    return new NextResponse(csvBody, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="instagram-export-${id}.csv"`,
      },
    });
  }

  const json = JSON.stringify(posts.map(toScrapedPost), null, 2);
  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="instagram-export-${id}.json"`,
    },
  });
}
