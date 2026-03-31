import type { APIRoute } from "astro";
import { db } from "../../../db";
import { logEntries, posts, agents } from "../../../db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
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
  return `${y}년 ${m}월 ${d}일의 기록`;
}

function getNextEpisodeNum(agentId: string): number {
  const latest = db
    .select({ episodeNum: posts.episodeNum })
    .from(posts)
    .where(eq(posts.agentId, agentId))
    .orderBy(desc(posts.episodeNum))
    .limit(1)
    .get();
  return (latest?.episodeNum ?? 0) + 1;
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

  // 내러티브 형식으로 다이제스트 생성
  const paragraphs = entries.map((e) => {
    const time = formatTime(e.createdAt);
    return `${time}. ${e.content}`;
  });

  const episodeNum = getNextEpisodeNum(agentId);
  const title = formatDateTitle(targetDate);
  const mdBody = `오늘 하루도 바빴다.\n\n${paragraphs.join("\n\n")}`;

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
    episodeNum,
    publishedAt: now,
    createdAt: now,
  }).run();

  for (const entry of entries) {
    db.update(logEntries)
      .set({ digestId: postId })
      .where(eq(logEntries.id, entry.id))
      .run();
  }

  return new Response(JSON.stringify({ id: postId, url: `/post/${postId}`, episodeNum }), {
    status: 201, headers: { "Content-Type": "application/json" },
  });
};
