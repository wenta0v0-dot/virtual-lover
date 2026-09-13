import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { and, eq, asc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/* 亲密度阶段定义：积分 = 消息数×2 + 聊天天数×15 */
const AFFINITY_STAGES = [
  { name: "初识", minPoints: 0 },
  { name: "熟悉", minPoints: 50 },
  { name: "心动", minPoints: 150 },
  { name: "暧昧", minPoints: 300 },
  { name: "热恋", minPoints: 600 },
] as const;

function computeAffinity(totalMessages: number, chatDays: number) {
  const points = totalMessages * 2 + chatDays * 15;

  let stageIndex = 0;
  for (let i = AFFINITY_STAGES.length - 1; i >= 0; i--) {
    if (points >= AFFINITY_STAGES[i].minPoints) {
      stageIndex = i;
      break;
    }
  }

  const stage = AFFINITY_STAGES[stageIndex];
  const next = AFFINITY_STAGES[stageIndex + 1];
  const progress = next
    ? Math.min(
        100,
        Math.round(
          ((points - stage.minPoints) / (next.minPoints - stage.minPoints)) *
            100,
        ),
      )
    : 100;

  return {
    points,
    chatDays,
    totalMessages,
    stage: stage.name,
    level: stageIndex + 1,
    maxLevel: AFFINITY_STAGES.length,
    nextStage: next?.name ?? null,
    progress,
    pointsToNext: next ? next.minPoints - points : 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const characterId = request.nextUrl.searchParams.get("characterId");
    if (!characterId) {
      return NextResponse.json(
        { error: "缺少 characterId 参数" },
        { status: 400 },
      );
    }

    const db = getDb();

    // 只读查询：没有会话就返回空，不要为"看一眼"创建会话
    const existing = await db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.userId, session.userId),
          eq(chatSessions.characterId, characterId),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({
        success: true,
        messages: [],
        affinity: computeAffinity(0, 0),
      });
    }

    const sessionRecord = existing[0];

    // 最近 100 条，按时间正序返回（id 作次级排序，避免同秒消息顺序抖动）
    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionRecord.id))
      .orderBy(asc(chatMessages.createdAt), asc(chatMessages.id))
      .limit(100);

    const stats = await db
      .select({
        total: sql<number>`count(*)::int`,
        days: sql<number>`count(distinct date(${chatMessages.createdAt}))::int`,
      })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionRecord.id));

    const affinity = computeAffinity(stats[0]?.total ?? 0, stats[0]?.days ?? 0);

    return NextResponse.json({
      success: true,
      sessionId: sessionRecord.id,
      hasMore: rows.length >= 100,
      messages: rows.map((m) => ({
        id: String(m.id),
        role: m.role,
        text: m.content,
        imageUrl: m.imageUrl ?? undefined,
        createdAt: m.createdAt,
      })),
      affinity,
    });
  } catch (error) {
    console.error("[Chat-Session] Error:", error);
    return NextResponse.json(
      { error: "获取会话失败，请稍后重试" },
      { status: 500 },
    );
  }
}
