import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "fs";

mkdirSync("data", { recursive: true });
const sqlite = new Database("data/agentlog.db");
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: "./drizzle" });
console.log("마이그레이션 완료!");
sqlite.close();
