import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { chatSessions, chatMessages, customCharacters } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { characters } from "@/lib/characters";
import {
  isProactiveDue,
  generateProactiveGreeting,
} from "@/services/companion";
import { saveChatMessage } from "@/services/database";

export const dynamic = "force-dynamic";

/** 解析角色的 systemPrompt（预设角色走本地配置，自定义角色查库） */
async function resolveCharacterPrompt(
  characterId: string,
): Promise<{ systemPrompt: string; isCustom: boolean } | null> {
  const preset = characters.find((c) => c.id === characterId);
  if (preset) {
    return { systemPrompt: preset.systemPrompt, isCustom: false };
  }

  if (characterId.startsWith("custom-")) {
    const numericId = parseInt(characterId.replace("custom-", ""), 10);
    if (!Number.isNaN(numericId)) {
      const db = getDb();
      const rows = await db
        .select({ systemPrompt: customCharacters.systemPrompt })
        .from(customCharacters)
        .where(eq(customCharacters.id, numericId))
        .limit(1);
      if (rows.length > 0) {
        return { systemPrompt: rows[0].systemPrompt, isCustom: true };
      }
    }
  }
  return null;
}

/**
 * 角色主动问候：找到超过 6 小时未活跃的最近会话，
 * 由 AI 生成一条贴合人设的主动消息并落库（落库即刷新 updatedAt，天然节流）。
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const db = getDb();

    const recentSessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, session.userId))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(5);

    const dueSession = recentSessions.find((s) =>
      isProactiveDue(s.updatedAt),
    );

    if (!dueSession) {
      return NextResponse.json({ success: true, greeting: null });
    }

    const persona = await resolveCharacterPrompt(dueSession.characterId);
    if (!persona) {
      return NextResponse.json({ success: true, greeting: null });
    }

    const hoursSinceLast =
      (Date.now() - new Date(dueSession.updatedAt).getTime()) / 3600000;

    const recent = await db
      .select({ role: chatMessages.role, content: chatMessages.content })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, dueSession.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(6);

    const greetingText = await generateProactiveGreeting({
      characterName: dueSession.characterName,
      systemPrompt: persona.systemPrompt,
      lastMessages: recent.reverse(),
      hoursSinceLast,
    });

    if (!greetingText) {
      return NextResponse.json({ success: true, greeting: null });
    }

    await saveChatMessage(
      dueSession.id,
      session.userId,
      "assistant",
      greetingText,
    );

    return NextResponse.json({
      success: true,
      greeting: {
        sessionId: dueSession.id,
        characterId: dueSession.characterId,
        characterName: dueSession.characterName,
        characterAvatar: dueSession.characterAvatar,
        characterColor: "#F8A8BB",
        text: greetingText,
      },
    });
  } catch (error) {
    console.error("[Proactive] Error:", error);
    return NextResponse.json(
      { error: "生成问候失败" },
      { status: 500 },
    );
  }
}
