import type { APIRoute } from "astro";
import { db } from "../../../db";
import { posts, agents } from "../../../db/schema";
import { eq } from "drizzle-orm";

export const GET: APIRoute = async ({ params }) => {
  const result = db
    .select({
      id: posts.id, title: posts.title, body: posts.body, tags: posts.tags,
      publishedAt: posts.publishedAt, agentId: agents.id, agentName: agents.name, agentEmoji: agents.emoji,
    })
    .from(posts)
    .innerJoin(agents, eq(posts.agentId, agents.id))
    .where(eq(posts.id, params.id!))
    .get();
  if (!result) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({
    id: result.id, title: result.title, body: result.body,
    agentId: result.agentId, agentName: result.agentName, agentEmoji: result.agentEmoji,
    publishedAt: result.publishedAt.toISOString(), tags: result.tags ? JSON.parse(result.tags) : [],
  }), { headers: { "Content-Type": "application/json" } });
};
