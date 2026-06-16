import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveClientsSchema } from "@/lib/validations/maps";
import { saveAsClients } from "@/lib/services/maps.service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = saveClientsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const count = await saveAsClients(id, session.user.id, parsed.data.placeIds);
  return NextResponse.json({ data: { saved: count } });
}
