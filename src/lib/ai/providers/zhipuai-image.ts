import {
  ImageGenOptions,
  ImageGenResult,
  ZhipuAIImageRequest,
  ZhipuAIImageResponse,
  ErrorCategory,
} from "../types";
import AILogger from "../logger";
import fs from "fs";
import path from "path";

const API_BASE_URL =
  process.env.ZHIPUAI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";
const API_KEY = process.env.ZHIPUAI_IMAGE_API_KEY || "";

export class ZhipuAIImageProvider {
  private readonly endpoint = "/images/generations";
  private readonly model = "cogview-3-flash";
  private logger = AILogger;

  async generate(options: ImageGenOptions): Promise<ImageGenResult> {
    const startTime = this.logger.logRequestStart(
      "zhipuai",
      this.endpoint,
      this.model,
    );

    try {
      const requestBody: ZhipuAIImageRequest = await this.buildRequest(options);
      const response = await this.makeAPIRequest(requestBody);

      if (!response.ok) {
        return this.handleError(
          response.status,
          await response.text(),
          startTime,
        );
      }

      const data: ZhipuAIImageResponse = await response.json();
      return this.handleSuccess(data, options.prompt, startTime);
    } catch (error) {
      return this.handleException(error, startTime);
    }
  }

  private async buildRequest(
    options: ImageGenOptions,
  ): Promise<ZhipuAIImageRequest> {
    let prompt = options.prompt.trim();
    prompt = this.cleanPrompt(prompt);

    // 构建角色一致性提示词
    const characterConsistentPrompt =
      this.buildCharacterConsistentPrompt(prompt);

    const requestBody: ZhipuAIImageRequest = {
      model: this.model,
      prompt: characterConsistentPrompt,
      size: options.size || "1280x1280",
    };

    // 如果有参考图片，转换为 base64
    if (options.imageUrl) {
      try {
        const base64Image = await this.convertImageToBase64(options.imageUrl);
        if (base64Image) {
          requestBody.image_url = base64Image;
          console.log(`[Image] Using reference image: ${options.imageUrl}`);
        }
      } catch (error) {
        console.warn(`[Image] Failed to convert reference image: ${error}`);
      }
    }

    return requestBody;
  }

  /**
   * 构建角色一致性提示词
   * 确保生成的图片与角色头像保持一致性
   */
  private buildCharacterConsistentPrompt(originalPrompt: string): string {
    // 提取场景描述（去掉 [SELFIE:] 标记）
    const sceneDescription = originalPrompt
      .replace(/^\[SELFIE:\s*/, "")
      .replace(/\]$/, "");

    // 添加角色一致性约束
    const consistencyPrompt = `
${sceneDescription}

重要要求：
1. 保持角色面部特征、发型、发色与参考图片完全一致
2. 保持角色服装风格一致
3. 保持整体画风和色调一致
4. 角色必须是同一个人，只是场景不同
5. 日系动漫风格，高质量，细节丰富
`.trim();

    return consistencyPrompt;
  }

  /**
   * 将本地图片转换为 base64 格式
   */
  private async convertImageToBase64(imageUrl: string): Promise<string | null> {
    try {
      // 检查是否是本地路径
      if (imageUrl.startsWith("/")) {
        // 构建绝对路径
        const projectRoot = process.cwd();
        const publicPath = path.join(projectRoot, "public", imageUrl);

        // 检查文件是否存在
        if (!fs.existsSync(publicPath)) {
          console.warn(`[Image] Reference image not found: ${publicPath}`);
          return null;
        }

        // 读取文件并转换为 base64
        const imageBuffer = fs.readFileSync(publicPath);
        const base64 = imageBuffer.toString("base64");

        // 获取文件扩展名
        const ext = path.extname(publicPath).toLowerCase();
        const mimeType = this.getMimeType(ext);

        return `data:${mimeType};base64,${base64}`;
      }

      // 如果是完整的 URL，直接返回
      if (imageUrl.startsWith("http")) {
        return imageUrl;
      }

      return null;
    } catch (error) {
      console.error(`[Image] Error converting image: ${error}`);
      return null;
    }
  }

  private getMimeType(ext: string): string {
    switch (ext) {
      case ".png":
        return "image/png";
      case ".jpg":
      case ".jpeg":
        return "image/jpeg";
      case ".svg":
        return "image/svg+xml";
      case ".webp":
        return "image/webp";
      case ".gif":
        return "image/gif";
      default:
        return "image/png";
    }
  }

  private cleanPrompt(prompt: string): string {
    const suffixesToRemove = [
      ", high quality, anime style, detailed, beautiful lighting",
      ", high quality",
      ", anime style",
      ", detailed",
      ", beautiful lighting",
    ];

    let cleaned = prompt;
    for (const suffix of suffixesToRemove) {
      if (cleaned.endsWith(suffix)) {
        cleaned = cleaned.slice(0, -suffix.length);
      }
    }

    return cleaned.trim();
  }

  private async makeAPIRequest(body: ZhipuAIImageRequest): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${API_BASE_URL}${this.endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private handleSuccess(
    response: ZhipuAIImageResponse,
    originalPrompt: string,
    startTime: number,
  ): ImageGenResult {
    const imageUrls = response.data.map((item) => item.url);

    this.logger.logRequestEnd(startTime, {
      provider: "zhipuai",
      endpoint: this.endpoint,
      model: this.model,
      promptLength: originalPrompt.length,
      size: "1280x1280",
      status: "success",
      statusCode: 200,
      imageCount: imageUrls.length,
    });

    return {
      success: true,
      imageUrls,
    };
  }

  private handleError(
    statusCode: number,
    errorText: string,
    startTime: number,
  ): ImageGenResult {
    const errorInfo = this.classifyError(statusCode, errorText);

    this.logger.logRequestEnd(startTime, {
      provider: "zhipuai",
      endpoint: this.endpoint,
      model: this.model,
      promptLength: 0,
      size: "1280x1280",
      status: "error",
      statusCode,
      error: errorInfo,
    });

    return {
      success: false,
      error: errorInfo,
    };
  }

  private classifyError(
    statusCode: number,
    errorText: string,
  ): {
    code: number;
    message: string;
    retryable: boolean;
    category: ErrorCategory;
  } {
    let message = "图片生成失败";
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
        message = "权限不足，请检查账户权限";
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

  private handleException(error: unknown, startTime: number): ImageGenResult {
    let errorInfo = {
      code: 0,
      message: "网络请求异常，请检查网络连接",
      retryable: true,
      category: "timeout" as ErrorCategory,
    };

    if (error instanceof DOMException && error.name === "AbortError") {
      errorInfo = {
        code: 408,
        message: "请求超时（60秒），请稍后重试",
        retryable: true,
        category: "timeout",
      };
    } else if (error instanceof Error) {
      errorInfo.message = error.message;
    }

    this.logger.logRequestEnd(startTime, {
      provider: "zhipuai",
      endpoint: this.endpoint,
      model: this.model,
      promptLength: 0,
      size: "1280x1280",
      status: "error",
      error: errorInfo,
    });

    return {
      success: false,
      error: errorInfo,
    };
  }
}

export default new ZhipuAIImageProvider();
