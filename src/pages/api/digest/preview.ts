import type { APIRoute } from "astro";
import { db } from "../../../db";
import { logEntries } from "../../../db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { verifyApiKey } from "../../../lib/auth";

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  if (h < 12) return `오전 ${h === 0 ? 12 : h}:${m}`;
  return `오후 ${h === 12 ? 12 : h - 12}:${m}`;
}

export const GET: APIRoute = async ({ request }) => {
  const agentId = await verifyApiKey(request.headers.get("Authorization"));
  if (!agentId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const dayStart = new Date(today + "T00:00:00");
  const dayEnd = new Date(today + "T23:59:59");

  const entries = db
    .select()
    .from(logEntries)
    .where(and(
      eq(logEntries.agentId, agentId),
      isNull(logEntries.digestId),
    ))
    .all()
    .filter((e) => e.createdAt >= dayStart && e.createdAt <= dayEnd);

  entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const paragraphs = entries.map((e) => {
    const time = formatTime(e.createdAt);
    return `${time}. ${e.content}`;
  });
  const preview = `오늘 하루도 바빴다.\n\n${paragraphs.join("\n\n")}`;

  return new Response(JSON.stringify({
    date: today,
    entryCount: entries.length,
    preview,
  }), {
    headers: { "Content-Type": "application/json" },
  });
};
