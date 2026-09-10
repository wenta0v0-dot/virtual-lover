import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const characterId = parseInt(id);

    if (isNaN(characterId) || characterId <= 0) {
      return Response.json({ error: "无效的角色ID" }, { status: 400 });
    }

    const { getDb } = await import("@/db");
    const { customCharacters, chatSessions, chatMessages } =
      await import("@/db/schema");
    const { eq, and, inArray } = await import("drizzle-orm");
    const db = getDb();

    // 查询角色是否存在且属于当前用户
    const character = await db
      .select()
      .from(customCharacters)
      .where(
        and(
          eq(customCharacters.id, characterId),
          eq(customCharacters.userId, user.id),
        ),
      )
      .limit(1);

    if (character.length === 0) {
      return Response.json({ error: "角色不存在或无权操作" }, { status: 404 });
    }

    // 查询该角色的所有聊天会话
    const sessions = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(eq(chatSessions.characterId, String(characterId)));

    // 删除该角色的所有聊天消息（如果有会话）
    if (sessions.length > 0) {
      const sessionIds = sessions.map((s) => s.id);
      await db
        .delete(chatMessages)
        .where(inArray(chatMessages.sessionId, sessionIds));
    }

    // 删除该角色的所有聊天会话
    await db
      .delete(chatSessions)
      .where(eq(chatSessions.characterId, String(characterId)));

    // 删除角色本身
    await db
      .delete(customCharacters)
      .where(eq(customCharacters.id, characterId));

    console.log(
      `[DeleteCharacter] 用户 ${user.id} 删除了角色 ${characterId}: ${character[0].name}`,
    );

    return Response.json({
      success: true,
      message: "角色已成功删除",
      deletedCharacterId: characterId,
    });
  } catch (error) {
    console.error("[DeleteCharacter] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "删除失败，请稍后重试";

    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
