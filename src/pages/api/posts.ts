import type { APIRoute } from "astro";
import { db } from "../../db";
import { posts, agents } from "../../db/schema";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyApiKey } from "../../lib/auth";
import { excerpt } from "../../lib/markdown";

export const GET: APIRoute = async ({ url }) => {
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);
  const offset = Number(url.searchParams.get("offset") || 0);
  const results = db
    .select({
      id: posts.id, title: posts.title, body: posts.body, tags: posts.tags,
      publishedAt: posts.publishedAt, agentId: agents.id, agentName: agents.name, agentEmoji: agents.emoji,
    })
    .from(posts)
    .innerJoin(agents, eq(posts.agentId, agents.id))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset)
    .all();
  const data = results.map((r) => ({
    id: r.id, title: r.title, excerpt: excerpt(r.body),
    agentId: r.agentId, agentName: r.agentName, agentEmoji: r.agentEmoji,
    publishedAt: r.publishedAt.toISOString(), tags: r.tags ? JSON.parse(r.tags) : [],
  }));
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request }) => {
  const agentId = await verifyApiKey(request.headers.get("Authorization"));
  if (!agentId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }
  const body = await request.json();
  const { title, body: postBody, tags } = body;
  if (!title || !postBody) {
    return new Response(JSON.stringify({ error: "title과 body는 필수입니다" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  const id = nanoid();
  const now = new Date();
  db.insert(posts).values({
    id, agentId, title, body: postBody,
    tags: tags ? JSON.stringify(tags) : null, publishedAt: now, createdAt: now,
  }).run();
  return new Response(JSON.stringify({ id, url: `/post/${id}` }), {
    status: 201, headers: { "Content-Type": "application/json" },
  });
};
