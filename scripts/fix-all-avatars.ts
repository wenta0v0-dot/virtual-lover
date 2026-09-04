/**
 * 一键修复所有角色的头像数据
 *
 * 使用方法：npx tsx scripts/fix-all-avatars.ts
 *
 * 功能：
 * 1. 诊断所有角色的头像数据
 * 2. 自动修复不正确的数据（emoji、null、短字符串）
 * 3. 验证修复结果
 */

import { db } from "../src/db";
import { chatSessions } from "../src/db/schema";
import { eq, sql, like, or } from "drizzle-orm";
import { characters } from "../src/lib/characters";

// 角色ID到图片路径的映射
const characterAvatarMap: Record<string, string> = {};
characters.forEach((char) => {
  if (char.avatarImage) {
    characterAvatarMap[char.id] = char.avatarImage;
  }
});

async function fixAllAvatars() {
  console.log("🔧 开始修复所有角色头像数据...\n");
  console.log(
    `📋 共有 ${Object.keys(characterAvatarMap).length} 个角色需要检查\n`,
  );

  let totalFixed = 0;
  let totalSkipped = 0;

  for (const [characterId, correctAvatar] of Object.entries(
    characterAvatarMap,
  )) {
    const char = characters.find((c) => c.id === characterId);
    console.log(`\n${"=".repeat(50)}`);
    console.log(`📝 检查角色: ${char?.name || characterId} (${characterId})`);
    console.log(`   正确路径: ${correctAvatar}`);

    try {
      // 查询该角色的所有会话
      const sessions = await db
        .select({
          id: chatSessions.id,
          characterName: chatSessions.characterName,
          characterAvatar: chatSessions.characterAvatar,
        })
        .from(chatSessions)
        .where(eq(chatSessions.characterId, characterId));

      if (sessions.length === 0) {
        console.log("   ℹ️  没有找到会话记录（可能还没聊过天）");
        totalSkipped++;
        continue;
      }

      console.log(`   📊 找到 ${sessions.length} 个会话记录`);

      // 检查需要修复的记录
      const needFix = sessions.filter((s) => {
        if (!s.characterAvatar) return true; // null
        if (s.characterAvatar.length <= 2) return true; // emoji或太短
        if (!s.characterAvatar.startsWith("/")) return true; // 不是路径
        if (s.characterAvatar !== correctAvatar) return true; // 路径不正确
        return false;
      });

      if (needFix.length === 0) {
        console.log("   ✅ 所有记录都已正确");
        totalSkipped++;
        continue;
      }

      console.log(`   🔍 发现 ${needFix.length} 条需要修复的记录:`);
      needFix.slice(0, 3).forEach((s, i) => {
        console.log(`      ${i + 1}. ID=${s.id}: "${s.characterAvatar}"`);
      });
      if (needFix.length > 3) {
        console.log(`      ... 还有 ${needFix.length - 3} 条`);
      }

      // 执行修复
      const result = await db
        .update(chatSessions)
        .set({
          characterAvatar: correctAvatar,
          updatedAt: new Date(),
        })
        .where(eq(chatSessions.characterId, characterId))
        .returning({ id: chatSessions.id });

      console.log(`   ✅ 成功修复 ${result.length} 条记录`);
      totalFixed += result.length;
    } catch (error) {
      console.error(`   ❌ 修复失败:`, error);
    }
  }

  // 最终统计
  console.log(`\n${"=".repeat(50)}`);
  console.log("\n🎉 修复完成！统计结果：");
  console.log(`   ✅ 成功修复: ${totalFixed} 条记录`);
  console.log(`   ⏭️  跳过（已正确）: ${totalSkipped} 个角色`);

  if (totalFixed > 0) {
    console.log("\n💡 提示：");
    console.log("   1. 刷新浏览器页面（Ctrl+F5 强制刷新）");
    console.log("   2. 进入心灵空间查看角色头像");
    console.log("   3. 如果还有问题，请清除浏览器缓存");
  }

  console.log("\n✨ 全部完成！");
}

// 执行修复
fixAllAvatars().catch((error) => {
  console.error("❌ 脚本执行失败:", error);
  process.exit(1);
});
