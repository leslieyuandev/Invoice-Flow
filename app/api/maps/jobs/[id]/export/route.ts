import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlacesForExport, toPlaceRow, toScrapedPlace } from "@/lib/services/maps.service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

type Row = ReturnType<typeof toPlaceRow>;
const CSV_COLUMNS: { header: string; value: (r: Row) => unknown }[] = [
  { header: "Place ID", value: (r) => r.placeId },
  { header: "Place name", value: (r) => r.title },
  { header: "Category", value: (r) => r.category },
  { header: "Total Score", value: (r) => r.totalScore },
  { header: "Reviews Count", value: (r) => r.reviewsCount },
  { header: "Address", value: (r) => r.address },
  { header: "Street", value: (r) => r.street },
  { header: "City", value: (r) => r.city },
  { header: "State", value: (r) => r.state },
  { header: "Country Code", value: (r) => r.countryCode },
  { header: "Phone", value: (r) => r.phone },
  { header: "Website", value: (r) => r.website },
  { header: "Emails", value: (r) => r.emails },
  { header: "Claimed", value: (r) => (r.isClaimed == null ? "" : r.isClaimed ? "Yes" : "No") },
  { header: "Opening Status", value: (r) => r.openingStatus },
  { header: "Description", value: (r) => r.description },
  { header: "Plus Code", value: (r) => r.plusCode },
  { header: "Price Level", value: (r) => r.priceLevel },
  { header: "Images", value: (r) => r.imageUrls?.length ?? 0 },
  { header: "Is Likely New", value: (r) => (r.isLikelyNew ? "Yes" : "No") },
  { header: "New Signals", value: (r) => r.newnessSignals?.matched ?? [] },
  { header: "Latitude", value: (r) => r.latitude },
  { header: "Longitude", value: (r) => r.longitude },
  { header: "Search Query", value: (r) => r.searchQuery },
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
  const places = await getPlacesForExport(id, session.user.id);
  if (!places) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const format = (req.nextUrl.searchParams.get("format") || "json").toLowerCase();

  if (format === "csv") {
    const rows = places.map(toPlaceRow);
    const lines = [
      CSV_COLUMNS.map((c) => csvCell(c.header)).join(","),
      ...rows.map((r) => CSV_COLUMNS.map((c) => csvCell(c.value(r))).join(",")),
    ];
    // Prepend BOM so Excel reads UTF-8 correctly.
    const body = "﻿" + lines.join("\r\n");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="maps-export-${id}.csv"`,
      },
    });
  }

  const json = JSON.stringify(places.map(toScrapedPlace), null, 2);
  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="maps-export-${id}.json"`,
    },
  });
}
