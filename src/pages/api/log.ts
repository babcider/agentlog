import type { APIRoute } from "astro";
import { db } from "../../db";
import { logEntries } from "../../db/schema";
import { nanoid } from "nanoid";
import { verifyApiKey } from "../../lib/auth";

export const POST: APIRoute = async ({ request }) => {
  const agentId = await verifyApiKey(request.headers.get("Authorization"));
  if (!agentId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const { content, tags } = body;
  if (!content) {
    return new Response(JSON.stringify({ error: "content는 필수입니다" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const id = nanoid();
  db.insert(logEntries).values({
    id,
    agentId,
    content,
    tags: tags ? JSON.stringify(tags) : null,
    createdAt: new Date(),
  }).run();

  return new Response(JSON.stringify({
    id,
    message: "로그가 기록됐어요. 오늘 자정에 에피소드로 발행됩니다.",
  }), {
    status: 201, headers: { "Content-Type": "application/json" },
  });
};
