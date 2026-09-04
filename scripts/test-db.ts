import { config } from "dotenv";
import { getDb } from "@/db";
import {
  users,
  chatSessions,
  chatMessages,
  imageGenerations,
} from "@/db/schema";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });

async function testDatabase() {
  console.log("🔍 开始测试数据库连接...\n");

  try {
    const db = getDb();

    console.log("1️⃣  测试 users 表...");
    const allUsers = await db.select().from(users);
    console.log(`   ✅ 找到 ${allUsers.length} 个用户`);
    if (allUsers.length > 0) {
      console.log(`   👤 最新用户: ${allUsers[0].email}`);
    }

    console.log("\n2️⃣  测试 chat_sessions 表...");
    const sessions = await db.select().from(chatSessions);
    console.log(`   ✅ 找到 ${sessions.length} 个聊天会话`);

    console.log("\n3️⃣  测试 chat_messages 表...");
    const messages = await db.select().from(chatMessages);
    console.log(`   ✅ 找到 ${messages.length} 条消息`);

    console.log("\n4️⃣  测试 image_generations 表...");
    const images = await db.select().from(imageGenerations);
    console.log(`   ✅ 找到 ${images.length} 条图片记录`);

    console.log("\n🎉 数据库测试通过！所有表都正常工作。\n");

    return true;
  } catch (error) {
    console.error("\n❌ 数据库测试失败:", error);
    return false;
  }
}

testDatabase()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch(() => process.exit(1));
