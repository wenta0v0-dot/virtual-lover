/**
 * 陪伴体验服务：主动问候、长期记忆
 * 复用智谱 AI 配置（ZHIPUAI_BASE_URL / ZHIPUAI_CHAT_API_KEY）
 */

const API_BASE_URL =
  process.env.ZHIPUAI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";
const API_KEY = process.env.ZHIPUAI_CHAT_API_KEY || "";
const DEFAULT_MODEL = process.env.ZHIPUAI_CHAT_MODEL || "glm-5.2";

export interface SimpleMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** 非流式对话：短文本场景（问候、记忆总结） */
export async function simpleChatComplete(
  messages: SimpleMessage[],
  options: { maxTokens?: number; temperature?: number; model?: string } = {},
): Promise<{ success: boolean; content?: string; error?: string }> {
  if (!API_KEY) {
    return { success: false, error: "API Key 未配置" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model || DEFAULT_MODEL,
        messages,
        max_tokens: options.maxTokens ?? 200,
        temperature: options.temperature ?? 0.9,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Companion] API error:", response.status, errText.slice(0, 200));
      return { success: false, error: `API 请求失败 (${response.status})` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { success: false, error: "AI 未返回内容" };
    }
    return { success: true, content };
  } catch (error) {
    const isTimeout =
      error instanceof DOMException && error.name === "AbortError";
    console.error("[Companion] Request failed:", isTimeout ? "timeout" : error);
    return { success: false, error: isTimeout ? "请求超时" : "网络异常" };
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ================= 主动问候 ================= */

const PROACTIVE_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 每个会话 6 小时最多问候一次

export function isProactiveDue(lastUpdatedAt: Date | string): boolean {
  const last = new Date(lastUpdatedAt).getTime();
  return Date.now() - last > PROACTIVE_COOLDOWN_MS;
}

function greetingTimeHint(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "现在是早上";
  if (hour >= 11 && hour < 14) return "现在是中午";
  if (hour >= 14 && hour < 18) return "现在是下午";
  if (hour >= 18 && hour < 23) return "现在是晚上";
  return "现在是深夜";
}

export async function generateProactiveGreeting(params: {
  characterName: string;
  systemPrompt: string;
  lastMessages: { role: string; content: string }[];
  hoursSinceLast: number;
}): Promise<string | null> {
  const recentChat = params.lastMessages
    .slice(-6)
    .map((m) => `${m.role === "user" ? "对方" : "你"}：${m.content.slice(0, 100)}`)
    .join("\n");

  const result = await simpleChatComplete(
    [
      {
        role: "system",
        content: `${params.systemPrompt}

【补充指令】对方已经 ${Math.round(params.hoursSinceLast)} 个小时没有和你联系了。${greetingTimeHint()}。请以角色的身份，主动给对方发一条问候消息。
要求：
1. 完全符合角色人设和说话方式
2. 1-2 句话，自然口语化，像真人发的微信
3. 可以结合时间问候、或延续你们之前聊过的话题、或分享自己的近况
4. 直接输出消息内容，不要加引号、不要任何解释或前缀`,
      },
      ...(recentChat
        ? [
            {
              role: "user" as const,
              content: `你们上次的对话片段：\n${recentChat}\n\n请生成你的主动问候消息。`,
            },
          ]
        : [
            {
              role: "user" as const,
              content: "你们是刚认识的阶段，请发送第一条主动问候。",
            },
          ]),
    ],
    { maxTokens: 120, temperature: 1 },
  );

  if (!result.success || !result.content) return null;
  return result.content.trim().slice(0, 200);
}

/* ================= 长期记忆 ================= */

const MEMORY_INTERVAL = 20; // 每 20 条消息更新一次记忆

export function shouldUpdateMemory(messageCount: number): boolean {
  if (messageCount < MEMORY_INTERVAL) return false;
  // 用户消息与AI回复成对落库，计数落在奇数位；兼容单条落库落在整除位的情况
  const m = messageCount % MEMORY_INTERVAL;
  return m === 0 || m === 1;
}

/**
 * 若消息数达到阈值，异步总结近 20 条对话并更新会话的长期记忆。
 * 设计为 fire-and-forget：不抛出异常，失败只记日志。
 */
export async function updateSessionMemoryIfDue(sessionId: number): Promise<void> {
  try {
    const { getDb } = await import("@/db");
    const { chatSessions, chatMessages } = await import("@/db/schema");
    const { desc, eq } = await import("drizzle-orm");
    const db = getDb();

    const rows = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);
    const sess = rows[0];
    if (!sess || !shouldUpdateMemory(sess.messageCount)) return;

    const recent = await db
      .select({ role: chatMessages.role, content: chatMessages.content })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(MEMORY_INTERVAL);

    const summary = await summarizeMemory({
      existingMemory: sess.memorySummary,
      recentMessages: recent.reverse(),
    });

    if (summary) {
      await db
        .update(chatSessions)
        .set({ memorySummary: summary })
        .where(eq(chatSessions.id, sessionId));
      console.log("[Memory] 会话", sessionId, "长期记忆已更新:", summary.slice(0, 80));
    }
  } catch (error) {
    console.error("[Memory] 更新长期记忆失败:", error);
  }
}

export async function summarizeMemory(params: {
  existingMemory: string | null;
  recentMessages: { role: string; content: string }[];
}): Promise<string | null> {
  const dialogue = params.recentMessages
    .slice(-MEMORY_INTERVAL)
    .map(
      (m) =>
        `${m.role === "user" ? "对方" : "你"}：${m.content.slice(0, 150)}`,
    )
    .join("\n");

  const result = await simpleChatComplete(
    [
      {
        role: "system",
        content:
          "你是一个记忆整理助手。根据对话记录，维护一份关于「对方」（用户）的长期记忆摘要，供角色在后续聊天中自然引用。" +
          (params.existingMemory
            ? `\n\n已有的记忆摘要：\n${params.existingMemory}`
            : "") +
          `\n\n请输出更新后的记忆摘要，要求：
1. 只记录稳定且有价值的信息：称呼/名字、身份职业、喜好厌恶、重要经历、约定、情绪倾向、聊天风格偏好
2. 合并旧摘要与新对话中的信息，冲突时以新对话为准
3. 用简短的条目式中文，总长不超过 200 字
4. 直接输出摘要内容，不要任何前缀或解释`,
      },
      { role: "user", content: `最近的对话记录：\n${dialogue}` },
    ],
    { maxTokens: 400, temperature: 0.3 },
  );

  if (!result.success || !result.content) return null;
  return result.content.trim().slice(0, 400);
}
