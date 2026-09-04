import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function migrateDatabase() {
  console.log("🔄 开始数据库迁移...");

  try {
    // 1. 检查当前字段长度
    console.log("\n📊 检查当前 character_avatar 字段...");
    const currentLength = await db.execute(sql`
      SELECT character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'chat_sessions' 
      AND column_name = 'character_avatar'
    `);

    console.log(
      "   当前长度:",
      currentLength.rows[0]?.character_maximum_length,
      "字符",
    );

    // 2. 执行迁移
    console.log(
      "\n🔧 执行迁移：将 character_avatar 字段从 10 字符扩展到 500 字符...",
    );
    await db.execute(sql`
      ALTER TABLE chat_sessions 
      ALTER COLUMN character_avatar TYPE varchar(500)
    `);

    // 3. 验证修改
    console.log("\n✅ 验证修改结果...");
    const newLength = await db.execute(sql`
      SELECT character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'chat_sessions' 
      AND column_name = 'character_avatar'
    `);

    console.log(
      "   新的长度:",
      newLength.rows[0]?.character_maximum_length,
      "字符",
    );

    if (newLength.rows[0]?.character_maximum_length === "500") {
      console.log("\n🎉 迁移成功！现在可以正常使用所有角色了！");
    } else {
      throw new Error("验证失败：字段长度未正确更新");
    }
  } catch (error) {
    console.error("\n❌ 迁移失败:", error);
    console.error("\n💡 请手动在 Neon 控制台执行以下 SQL：");
    console.error(`
ALTER TABLE chat_sessions 
ALTER COLUMN character_avatar TYPE varchar(500);
    `);
    process.exit(1);
  }

  process.exit(0);
}

migrateDatabase();
