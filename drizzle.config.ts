// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// 显式加载根目录下的 .env 文件（如果有 .env.local 优先级更高，可自行调整）
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // 如果遇到 SSL 问题，可以加下面这行（可选）
  // ssl: true,
});
