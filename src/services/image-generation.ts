import { ImageGenOptions, ImageGenResult } from "@/lib/ai/types";
import zhipuAIProvider from "@/lib/ai/providers/zhipuai-image";

export async function generateImage(
  options: ImageGenOptions,
): Promise<ImageGenResult> {
  if (!options.prompt || options.prompt.trim().length === 0) {
    return {
      success: false,
      error: {
        code: 400,
        message: "Prompt 不能为空",
        retryable: false,
      },
    };
  }

  if (options.prompt.length > 2000) {
    return {
      success: false,
      error: {
        code: 400,
        message: "Prompt 长度不能超过 2000 个字符",
        retryable: false,
      },
    };
  }

  return zhipuAIProvider.generate(options);
}

export async function generateImageWithRetry(
  options: ImageGenOptions,
  maxRetries: number = 3,
): Promise<ImageGenResult> {
  let lastError: ImageGenResult["error"];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await generateImage(options);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    if (!lastError?.retryable || attempt === maxRetries) {
      break;
    }

    const waitTime = calculateWaitTime(lastError.category, attempt);
    console.log(
      `[Image-Service] Retry attempt ${attempt + 1}/${maxRetries} after ${waitTime}ms for error [${lastError.code}]: ${lastError.message}`,
    );
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  return {
    success: false,
    error: lastError || {
      code: 500,
      message: "图片生成失败，已达到最大重试次数",
      retryable: false,
    },
  };
}

function calculateWaitTime(
  category: string | undefined,
  attempt: number,
): number {
  const baseWait = 1000;

  switch (category) {
    case "rate_limit":
      return baseWait * Math.pow(2, attempt + 2);
    case "server":
      return baseWait * Math.pow(1.5, attempt + 1);
    case "timeout":
      return baseWait * (attempt + 1);
    default:
      return baseWait * (attempt + 1);
  }
}
