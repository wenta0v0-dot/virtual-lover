import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL 环境变量未设置");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  dbInstance = drizzle(pool, { schema });
  return dbInstance;
}
