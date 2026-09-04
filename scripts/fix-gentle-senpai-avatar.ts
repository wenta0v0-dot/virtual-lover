import { db } from "../src/db";
import { chatSessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function fixGentleSenpaiAvatar() {
  console.log("🔧 修复陆温言的头像数据...\n");

  try {
    // 1. 查找所有包含旧 emoji 头像的会话
    const oldSessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.characterId, "gentle-senpai"));

    console.log(`📊 找到 ${oldSessions.length} 个陆温言的聊天会话`);

    if (oldSessions.length === 0) {
      console.log("✅ 没有找到需要修复的数据");
      return;
    }

    // 2. 显示当前数据
    console.log("\n当前头像值：");
    oldSessions.forEach((session, i) => {
      console.log(
        `   ${i + 1}. Session #${session.id}: "${session.characterAvatar}"`,
      );
    });

    // 3. 更新为正确的图片路径
    const correctAvatar = "/characters/gentle-senpai.png";

    console.log(`\n🔄 更新为: "${correctAvatar}"`);

    await db
      .update(chatSessions)
      .set({ characterAvatar: correctAvatar })
      .where(eq(chatSessions.characterId, "gentle-senpai"));

    // 4. 验证更新
    const updatedSessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.characterId, "gentle-senpai"));

    console.log("\n✅ 更新后的头像值：");
    updatedSessions.forEach((session, i) => {
      console.log(
        `   ${i + 1}. Session #${session.id}: "${session.characterAvatar}"`,
      );
    });

    // 检查是否全部更新成功
    const allUpdated = updatedSessions.every(
      (s) => s.characterAvatar === correctAvatar,
    );

    if (allUpdated) {
      console.log("\n🎉 所有陆温言的会话记录已成功更新！");
    } else {
      throw new Error("部分记录更新失败");
    }
  } catch (error) {
    console.error("\n❌ 修复失败:", error);
    process.exit(1);
  }
}

fixGentleSenpaiAvatar();
