import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/** Validates X-Agent-Key header and returns the owner's userId, or null if unauthorized. */
export async function validateAgentKey(req: NextRequest): Promise<string | null> {
  const key = req.headers.get("x-agent-key");
  if (!key || !process.env.AGENT_API_KEY || key !== process.env.AGENT_API_KEY) return null;

  const email = process.env.AGENT_USER_EMAIL;
  if (!email) return null;

  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}
