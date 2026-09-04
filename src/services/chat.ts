import { ChatStreamOptions, ChatMessage } from "@/lib/ai/types";
import zhipuAIChatProvider from "@/lib/ai/providers/zhipuai-chat";

export async function* streamChat(
  options: ChatStreamOptions,
): AsyncGenerator<string, void, unknown> {
  if (!options.messages || options.messages.length === 0) {
    yield JSON.stringify({
      content: "错误: 消息列表不能为空",
      error: { code: 400, message: "消息列表不能为空", retryable: false },
    });
    return;
  }

  const lastMessage = options.messages[options.messages.length - 1];
  if (!lastMessage?.content || lastMessage.content.trim().length === 0) {
    yield JSON.stringify({
      content: "错误: 最后一条消息内容不能为空",
      error: { code: 400, message: "消息内容不能为空", retryable: false },
    });
    return;
  }

  if (lastMessage.content.length > 10000) {
    yield JSON.stringify({
      content: "错误: 单条消息长度不能超过 10000 个字符",
      error: { code: 400, message: "消息长度超限", retryable: false },
    });
    return;
  }

  const hasSystemMessage = options.messages.some(
    (msg) => msg.role === "system",
  );
  if (!hasSystemMessage) {
    options.messages = [
      {
        role: "system",
        content:
          "你是一个友好、专业的 AI 助手。请用简洁明了的方式回答用户问题。",
      },
      ...options.messages,
    ];
  }

  yield* zhipuAIChatProvider.stream(options);
}

export function formatMessagesForFrontend(
  rawMessages: Array<{ role: string; content: string }>,
): ChatMessage[] {
  return rawMessages
    .filter(
      (msg) =>
        msg.role === "user" ||
        msg.role === "assistant" ||
        msg.role === "system",
    )
    .map((msg) => ({
      role: msg.role as ChatMessage["role"],
      content: msg.content,
    }));
}
