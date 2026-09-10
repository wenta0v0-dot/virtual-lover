import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getUserChatSessions,
  getChatHistory,
  getUserImageGenerations,
} from "@/services/database";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const userId = session.userId;

    // 获取所有聊天会话
    const chatSessions = await getUserChatSessions(userId);

    // 获取每个会话的最新消息（SQL 层限制条数）
    const sessionsWithMessages = await Promise.all(
      chatSessions.slice(0, 5).map(async (session) => {
        const messages = await getChatHistory(session.id, 3);
        return {
          ...session,
          recentMessages: messages,
          messageCount: session.messageCount,
        };
      }),
    );

    // 获取图片生成记录
    const imageGenerations = await getUserImageGenerations(userId, 10);

    // 计算统计数据
    const totalMessages = chatSessions.reduce(
      (sum, s) => sum + (s.messageCount || 0),
      0,
    );
    const totalCharacters = chatSessions.length;
    const totalImages = imageGenerations.filter(
      (img) => img.status === "success",
    ).length;

    // 找出最常聊天的角色
    const topCharacter =
      chatSessions.length > 0
        ? chatSessions.reduce((prev, current) =>
            (current.messageCount || 0) > (prev.messageCount || 0)
              ? current
              : prev,
          )
        : null;

    return NextResponse.json({
      user: {
        id: userId,
        phone: session.phone,
      },
      stats: {
        totalMessages,
        totalCharacters,
        totalImages,
        totalSessions: chatSessions.length,
      },
      topCharacter,
      recentSessions: sessionsWithMessages,
      imageGenerations: imageGenerations.filter(
        (img) => img.status === "success",
      ),
    });
  } catch (error) {
    console.error("[User-Experience-API] Error:", error);
    return NextResponse.json({ error: "获取用户数据失败" }, { status: 500 });
  }
}
