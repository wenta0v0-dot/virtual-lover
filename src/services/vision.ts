/**
 * 智谱AI 视觉模型（多模态）调用服务
 * 用于图片理解类任务：图生文、图文聊天等
 */

const API_BASE_URL =
  process.env.ZHIPUAI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";
const API_KEY = process.env.ZHIPUAI_CHAT_API_KEY || "";
const DEFAULT_MODEL = process.env.ZHIPUAI_VISION_MODEL || "glm-4v-plus";

export type VisionTextPart = { type: "text"; text: string };
export type VisionImagePart = {
  type: "image_url";
  image_url: { url: string };
};
export type VisionContent = string | Array<VisionTextPart | VisionImagePart>;

export interface VisionMessage {
  role: "system" | "user" | "assistant";
  content: VisionContent;
}

export interface VisionChatOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface VisionChatResult {
  success: boolean;
  content?: string;
  error?: { code: number; message: string };
}

export async function chatWithVision(
  messages: VisionMessage[],
  options: VisionChatOptions = {},
): Promise<VisionChatResult> {
  const model = options.model || DEFAULT_MODEL;

  if (!API_KEY) {
    return {
      success: false,
      error: { code: 401, message: "视觉模型 API Key 未配置" },
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens ?? 2000,
        temperature: options.temperature ?? 0.8,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let message = `视觉模型请求失败 (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        message = errorJson.error?.message || errorJson.message || message;
      } catch {
        // 保留默认错误信息
      }
      console.error("[ZhipuAI-Vision] API error:", response.status, message);
      return { success: false, error: { code: response.status, message } };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: { code: 500, message: "视觉模型未返回有效内容" },
      };
    }

    return { success: true, content };
  } catch (error) {
    const isTimeout =
      error instanceof DOMException && error.name === "AbortError";
    const message = isTimeout
      ? "视觉模型请求超时（60秒），请稍后重试"
      : error instanceof Error
        ? error.message
        : "网络请求异常，请检查网络连接";
    console.error("[ZhipuAI-Vision] Request failed:", message);
    return { success: false, error: { code: isTimeout ? 408 : 0, message } };
  } finally {
    clearTimeout(timeoutId);
  }
}
