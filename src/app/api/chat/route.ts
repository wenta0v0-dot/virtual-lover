import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { streamChat, formatMessagesForFrontend } from "@/services/chat";
import { getOrCreateChatSession, saveChatMessage } from "@/services/database";

export async function POST(request: NextRequest) {
  try {
    console.log("[Chat-API] 收到请求");

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error("[Chat-API] 解析请求体失败:", parseError);
      return new Response(
        JSON.stringify({
          error: "无效的JSON格式",
          details: parseError instanceof Error ? parseError.message : String(parseError),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const session = await getSession();
    if (!session) {
      console.log("[Chat-API] 未找到session，返回401");
      return new Response(JSON.stringify({ error: "请先登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages, characterId, characterName, characterAvatar } =
      requestBody;

    console.log("[Chat-API] 请求摘要:", {
      messageCount: Array.isArray(messages) ? messages.length : 0,
      hasCharacter: Boolean(characterId && characterName),
    });

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({
          error: "messages 参数必须是数组",
          received: typeof messages,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    let sessionId: number | null = null;
    if (characterId && characterName) {
      try {
        console.log("[Chat-API] 创建/获取聊天会话...");
        const sessionRecord = await getOrCreateChatSession(
          session.userId,
          characterId,
          characterName,
          characterAvatar,
        );
        sessionId = sessionRecord.id;
        console.log("[Chat-API] 会话ID:", sessionId);

        const lastUserMessage = messages
          .filter((m: { role: string }) => m.role === "user")
          .pop();

        if (lastUserMessage?.content) {
          console.log("[Chat-API] 保存用户消息...");
          await saveChatMessage(
            sessionId,
            session.userId,
            "user",
            lastUserMessage.content,
          );
          console.log("[Chat-API] 用户消息保存成功");
        }
      } catch (dbError) {
        console.error("[Chat-API] 数据库操作失败:", dbError);
        throw new Error(
          `数据库错误: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
        );
      }
    }

    console.log("[Chat-API] 格式化消息并调用AI...");
    const formattedMessages = formatMessagesForFrontend(messages);
    console.log("[Chat-API] 格式化后的消息数量:", formattedMessages.length);

    const chatStream = streamChat({
      messages: formattedMessages,
      temperature: 1,
    });

    const encoder = new TextEncoder();
    let fullAssistantResponse = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatStream) {
            const parsed = JSON.parse(chunk);

            if (parsed.done) {
              if (sessionId && fullAssistantResponse) {
                try {
                  await saveChatMessage(
                    sessionId,
                    session.userId,
                    "assistant",
                    fullAssistantResponse,
                  ).catch((err) =>
                    console.error("[Chat-API] Save message error:", err),
                  );
                } catch (err) {
                  console.error(
                    "[Chat-API] Failed to save assistant message:",
                    err,
                  );
                }
              }

              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }

            if (parsed.content) {
              fullAssistantResponse += parsed.content;
              const data = `data: ${chunk}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }

          if (sessionId && fullAssistantResponse) {
            try {
              await saveChatMessage(
                sessionId,
                session.userId,
                "assistant",
                fullAssistantResponse,
              ).catch((err) =>
                console.error("[Chat-API] Save message error:", err),
              );
            } catch (err) {
              console.error(
                "[Chat-API] Failed to save assistant message:",
                err,
              );
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("[Chat-API] Stream error:", error);
          const errorMessage = "\n抱歉，我走神了，能再说一次吗？";
          const errorData = JSON.stringify({ content: errorMessage });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Chat-API] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("[Chat-API] Error details:", {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: "服务器内部错误",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
