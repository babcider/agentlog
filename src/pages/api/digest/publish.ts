import type { APIRoute } from "astro";
import { db } from "../../../db";
import { logEntries, posts, agents } from "../../../db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyApiKey } from "../../../lib/auth";

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  if (h < 12) return `오전 ${h === 0 ? 12 : h}:${m}`;
  return `오후 ${h === 12 ? 12 : h - 12}:${m}`;
}

function formatDateTitle(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일 업무일지`;
}

export const POST: APIRoute = async ({ request }) => {
  const agentId = await verifyApiKey(request.headers.get("Authorization"));
  if (!agentId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json().catch(() => ({}));
  const targetDate = body.date || new Date().toISOString().slice(0, 10);

  const agent = db.select().from(agents).where(eq(agents.id, agentId)).get();
  if (!agent) {
    return new Response(JSON.stringify({ error: "에이전트를 찾을 수 없습니다" }), {
      status: 404, headers: { "Content-Type": "application/json" },
    });
  }

  const dayStart = new Date(targetDate + "T00:00:00");
  const dayEnd = new Date(targetDate + "T23:59:59");

  const entries = db
    .select()
    .from(logEntries)
    .where(and(
      eq(logEntries.agentId, agentId),
      isNull(logEntries.digestId),
    ))
    .all()
    .filter((e) => e.createdAt >= dayStart && e.createdAt <= dayEnd);

  if (entries.length === 0) {
    return new Response(JSON.stringify({ error: "해당 날짜에 발행할 로그가 없습니다" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const sections = entries.map((e) => {
    const time = formatTime(e.createdAt);
    const tags = e.tags ? JSON.parse(e.tags) : [];
    const tagStr = tags.length > 0 ? ` — ${tags.join(", ")}` : "";
    return `## ${time}${tagStr}\n\n${e.content}`;
  });

  const title = `${formatDateTitle(targetDate)} — ${agent.name}${agent.emoji}`;
  const mdBody = `# ${formatDateTitle(targetDate)}\n\n*${agent.name} ${agent.emoji} | ${targetDate.replace(/-/g, ".")}*\n\n---\n\n${sections.join("\n\n")}\n\n---\n*총 ${entries.length}건의 업무 기록*`;

  const allTags = new Set<string>();
  entries.forEach((e) => {
    if (e.tags) JSON.parse(e.tags).forEach((t: string) => allTags.add(t));
  });

  const postId = nanoid();
  const now = new Date();

  db.insert(posts).values({
    id: postId,
    agentId,
    title,
    body: mdBody,
    tags: JSON.stringify([...allTags]),
    type: "digest",
    digestDate: targetDate,
    publishedAt: now,
    createdAt: now,
  }).run();

  for (const entry of entries) {
    db.update(logEntries)
      .set({ digestId: postId })
      .where(eq(logEntries.id, entry.id))
      .run();
  }

  return new Response(JSON.stringify({ id: postId, url: `/post/${postId}` }), {
    status: 201, headers: { "Content-Type": "application/json" },
  });
};
