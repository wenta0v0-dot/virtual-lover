import { db } from "../src/db";
import { chatSessions } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

async function diagnoseAvatar() {
  console.log("🔍 诊断陆温言的头像问题...\n");

  try {
    // 1. 查询所有包含 gentle-senpai 的会话
    const sessions = await db
      .select({
        id: chatSessions.id,
        characterId: chatSessions.characterId,
        characterName: chatSessions.characterName,
        characterAvatar: chatSessions.characterAvatar,
        updatedAt: chatSessions.updatedAt,
      })
      .from(chatSessions)
      .where(eq(chatSessions.characterId, "gentle-senpai"));

    console.log(`📊 找到 ${sessions.length} 个陆温言的会话记录:\n`);

    if (sessions.length === 0) {
      console.log("⚠️  没有找到任何陆温言的会话记录");
      console.log("   这说明你可能还没有和陆温言聊过天");
      return;
    }

    sessions.forEach((session, i) => {
      console.log(`会话 #${i + 1}:`);
      console.log(`   ID: ${session.id}`);
      console.log(`   角色名: ${session.characterName}`);
      console.log(`   头像值: "${session.characterAvatar}"`);
      console.log(`   类型: ${typeof session.characterAvatar}`);
      console.log(`   长度: ${session.characterAvatar?.length || 0} 字符`);
      console.log(`   更新时间: ${session.updatedAt}`);
      console.log("");
    });

    // 2. 检查是否有旧数据（emoji或null）
    const needsFix = sessions.some(
      (s) =>
        !s.characterAvatar ||
        s.characterAvatar.length <= 2 ||
        !s.characterAvatar.startsWith("/"),
    );

    if (needsFix) {
      console.log("❌ 发现问题：部分记录的头像值不是有效的图片路径！");
      console.log("\n🔧 正在修复...\n");

      // 执行修复
      const result = await db
        .update(chatSessions)
        .set({ characterAvatar: "/characters/gentle-senpai.png" })
        .where(eq(chatSessions.characterId, "gentle-senpai"))
        .returning({
          id: chatSessions.id,
          characterAvatar: chatSessions.characterAvatar,
        });

      console.log("✅ 修复完成！更新了以下记录:");
      result.forEach((r, i) => {
        console.log(`   ${i + 1}. ID=${r.id}, 新头像="${r.characterAvatar}"`);
      });
    } else {
      console.log("✅ 所有记录的头像路径都正确！");
    }

    // 3. 最终验证
    console.log("\n🔄 验证修复结果...");
    const finalCheck = await db
      .select({
        characterAvatar: chatSessions.characterAvatar,
      })
      .from(chatSessions)
      .where(eq(chatSessions.characterId, "gentle-senpai"));

    const allCorrect = finalCheck.every(
      (s) => s.characterAvatar === "/characters/gentle-senpai.png",
    );

    if (allCorrect) {
      console.log(
        "✅ 所有陆温言的头像都已正确设置为: /characters/gentle-senpai.png",
      );
    } else {
      console.log("⚠️  部分记录仍未修复，请检查数据库连接");
    }
  } catch (error) {
    console.error("❌ 诊断失败:", error);
    process.exit(1);
  }
}

diagnoseAvatar();
