import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateAgentKey } from "@/lib/utils/agentAuth";
import { createClientSchema } from "@/lib/validations/client";

export async function GET(req: NextRequest) {
  const userId = await validateAgentKey(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") ?? "";

  const clients = await db.client.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(search
        ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { company: { contains: search, mode: "insensitive" } }] }
        : {}),
    },
    select: { id: true, name: true, email: true, phone: true, company: true },
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json({ data: clients });
}

export async function POST(req: NextRequest) {
  const userId = await validateAgentKey(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const client = await db.client.create({ data: { ...parsed.data, userId } });
  return NextResponse.json({ data: client }, { status: 201 });
}
