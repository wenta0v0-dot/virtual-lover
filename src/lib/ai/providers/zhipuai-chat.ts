import {
  ChatStreamOptions,
  ZhipuAIChatRequest,
  ZhipuAIChatStreamResponse,
  ErrorCategory,
} from "../types";
import AILogger from "../logger";

const API_BASE_URL =
  process.env.ZHIPUAI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";
const API_KEY = process.env.ZHIPUAI_CHAT_API_KEY || "";
const DEFAULT_MODEL = process.env.ZHIPUAI_CHAT_MODEL || "glm-5.2";

export class ZhipuAIChatProvider {
  private readonly endpoint = "/chat/completions";
  private logger = AILogger;

  async *stream(
    options: ChatStreamOptions,
  ): AsyncGenerator<string, void, unknown> {
    const startTime = this.logger.logRequestStart(
      "zhipuai",
      this.endpoint,
      options.model || DEFAULT_MODEL,
    );

    try {
      const requestBody: ZhipuAIChatRequest = this.buildRequest(options);
      const response = await this.makeAPIRequest(requestBody);

      if (!response.ok) {
        const errorText = await response.text();
        const errorInfo = this.classifyError(response.status, errorText);

        this.logger.logRequestEnd(startTime, {
          provider: "zhipuai",
          endpoint: this.endpoint,
          model: options.model || DEFAULT_MODEL,
          promptLength: this.calculatePromptLength(options.messages),
          size: "N/A",
          status: "error",
          statusCode: response.status,
          error: errorInfo,
        });

        yield JSON.stringify({
          content: `错误 [${errorInfo.code}]: ${errorInfo.message}`,
          error: errorInfo,
        });
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法获取响应流");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === "" || trimmedLine === "data: [DONE]") continue;

          if (trimmedLine.startsWith("data: ")) {
            try {
              const jsonStr = trimmedLine.slice(6);
              const data: ZhipuAIChatStreamResponse = JSON.parse(jsonStr);

              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                yield JSON.stringify({ content });
              }
            } catch (e) {
              console.warn(
                "[ZhipuAI-Chat] Failed to parse SSE data:",
                trimmedLine,
              );
            }
          }
        }
      }

      this.logger.logRequestEnd(startTime, {
        provider: "zhipuai",
        endpoint: this.endpoint,
        model: options.model || DEFAULT_MODEL,
        promptLength: this.calculatePromptLength(options.messages),
        size: "N/A",
        status: "success",
        statusCode: 200,
      });

      yield JSON.stringify({ content: "", done: true });
    } catch (error) {
      const errorInfo = this.handleException(error, startTime);
      yield JSON.stringify({
        content: `错误: ${errorInfo.message}`,
        error: errorInfo,
      });
    }
  }

  private buildRequest(options: ChatStreamOptions): ZhipuAIChatRequest {
    return {
      model: options.model || DEFAULT_MODEL,
      messages: options.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: true,
      temperature: options.temperature ?? 1,
      max_tokens: options.maxTokens,
    };
  }

  private async makeAPIRequest(body: ZhipuAIChatRequest): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120秒超时（流式可能较长）

    const url = `${API_BASE_URL}${this.endpoint}`;
    console.log("[ZhipuAI-Chat] 正在请求:", url);
    console.log(
      "[ZhipuAI-Chat] API Key前10位:",
      API_KEY.substring(0, 10) + "...",
    );
    console.log(
      "[ZhipuAI-Chat] Request body length:",
      JSON.stringify(body).length,
    );

    try {
      console.log("[ZhipuAI-Chat] 开始fetch请求...");
      const startTime = Date.now();

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const duration = Date.now() - startTime;
      console.log(
        `[ZhipuAI-Chat] fetch完成，耗时: ${duration}ms，状态: ${response.status}`,
      );

      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      console.error("[ZhipuAI-Chat] fetch失败，详细错误:");
      console.error("   - 错误类型:", error.constructor?.name || "Unknown");
      console.error("   - 错误消息:", error.message);
      console.error("   - 错误代码:", error.code);
      console.error("   - 是否超时:", error.name === "AbortError");

      if (error.cause) {
        console.error("   - 原因:", error.cause);
        if (error.cause.code) console.error("   - 原因代码:", error.cause.code);
      }

      throw error;
    }
  }

  private calculatePromptLength(messages: { content: string }[]): number {
    return messages.reduce((total, msg) => total + msg.content.length, 0);
  }

  private classifyError(statusCode: number, errorText: string) {
    let message = "聊天请求失败";
    let retryable = false;
    let category: ErrorCategory = "unknown";

    try {
      const errorJson = JSON.parse(errorText);
      message = errorJson.error?.message || errorJson.message || message;
    } catch {
      message = errorText || message;
    }

    switch (statusCode) {
      case 401:
        category = "auth";
        message = "API 认证失败，请检查 API Key 是否正确";
        retryable = false;
        break;
      case 403:
        category = "permission";
        message = "权限不足，请检查账户权限或模型访问权限";
        retryable = false;
        break;
      case 429:
        category = "rate_limit";
        message = "请求过于频繁，请稍后重试";
        retryable = true;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        category = "server";
        message = `服务器错误 (${statusCode})，请稍后重试`;
        retryable = true;
        break;
      default:
        if (statusCode >= 400 && statusCode < 500) {
          category = "unknown";
          retryable = false;
        } else {
          category = "server";
          retryable = true;
        }
    }

    return {
      code: statusCode,
      message,
      retryable,
      category,
    };
  }

  private handleException(error: unknown, startTime: number) {
    let errorInfo = {
      code: 0,
      message: "网络请求异常，请检查网络连接",
      retryable: true,
      category: "timeout" as ErrorCategory,
    };

    if (error instanceof DOMException && error.name === "AbortError") {
      errorInfo = {
        code: 408,
        message: "请求超时（120秒），请稍后重试",
        retryable: true,
        category: "timeout",
      };
    } else if (error instanceof Error) {
      errorInfo.message = error.message;
    }

    this.logger.logRequestEnd(startTime, {
      provider: "zhipuai",
      endpoint: this.endpoint,
      model: DEFAULT_MODEL,
      promptLength: 0,
      size: "N/A",
      status: "error",
      error: errorInfo,
    });

    return errorInfo;
  }
}

export default new ZhipuAIChatProvider();
