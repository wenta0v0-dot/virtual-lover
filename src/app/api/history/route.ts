import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserChatSessions, getChatHistory } from "@/services/database";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const sessions = await getUserChatSessions(session.userId);

    const historyWithMessages = await Promise.all(
      sessions.map(async (sessionRecord) => {
        // 在 SQL 层限制条数，避免长会话全量加载
        const messages = await getChatHistory(sessionRecord.id, 50);
        return {
          ...sessionRecord,
          messages,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      sessions: historyWithMessages,
    });
  } catch (error) {
    console.error("[History-API] Error:", error);
    return NextResponse.json({ error: "获取历史记录失败" }, { status: 500 });
  }
}
