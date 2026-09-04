import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ 错误: DATABASE_URL 环境变量未设置");
    console.log("\n请在 .env.local 文件中设置:");
    console.log(
      "DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require",
    );
    console.log("\n示例格式（请替换为你的实际值）:");
    console.log("DATABASE_URL=postgresql://user:pass@localhost:5432/mydb");
    process.exit(1);
  }

  console.log("🔗 正在连接数据库...");

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    const sqlPath = path.join(__dirname, "../src/db/init.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");

    console.log("\n📄 执行初始化脚本...");
    await pool.query(sqlContent);

    console.log("\n✅ 数据库初始化成功！");
    console.log("\n📊 已创建以下表:");
    console.log("   ✅ users (用户表)");
    console.log("   ✅ verification_codes (验证码表)");
    console.log("   ✅ chat_sessions (聊天会话表)");
    console.log("   ✅ chat_messages (聊天消息表)");
    console.log("   ✅ image_generations (图片生成记录表)");
    console.log("\n🎉 所有索引已创建完成！");
  } catch (error) {
    console.error("\n❌ 初始化失败:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

initDatabase().catch(() => process.exit(1));
