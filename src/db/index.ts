import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { mkdirSync } from "fs";

mkdirSync("data", { recursive: true });
const sqlite = new Database("data/agentlog.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
