import { db } from "../db";
import { agents } from "../db/schema";
import bcrypt from "bcrypt";

export async function verifyApiKey(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const apiKey = authHeader.slice(7);
  const allAgents = db.select().from(agents).all();
  for (const agent of allAgents) {
    const match = await bcrypt.compare(apiKey, agent.apiKeyHash);
    if (match) return agent.id;
  }
  return null;
}
