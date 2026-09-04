import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateImageWithRetry } from "@/services/image-generation";
import { recordImageGeneration } from "@/services/database";

const rateLimitStore = new Map<
  string,
  { count: number; lastRequest: number }
>();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_MINUTE = 5;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now - record.lastRequest > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(identifier, { count: 1, lastRequest: now });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  record.count++;
  record.lastRequest = now;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        {
          error: "请求过于频繁，请稍后再试",
          code: 429,
          retryable: true,
          retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW / 1000)),
            "X-RateLimit-Limit": String(MAX_REQUESTS_PER_MINUTE),
          },
        },
      );
    }

    const { prompt, size, imageUrl } = await request.json();

    console.log(
      `[Generate-Image] User ${session.userId} from ${clientIP}, prompt length: ${prompt?.length}, hasReferenceImage: !!imageUrl`,
    );

    const [record] = await recordImageGeneration(
      session.userId,
      prompt,
      size || "1280x1280",
      [],
      "pending",
      undefined,
      0,
      imageUrl,
    );

    try {
      const result = await generateImageWithRetry({
        prompt,
        size: size || "1280x1280",
        imageUrl,
      });

      if (result.success && result.imageUrls) {
        await recordImageGeneration(
          session.userId,
          prompt,
          size || "1280x1280",
          result.imageUrls,
          "success",
          undefined,
          undefined,
          imageUrl,
        ).catch((err) =>
          console.error("[Generate-Image] Update success record error:", err),
        );

        return NextResponse.json({ imageUrls: result.imageUrls });
      } else {
        await recordImageGeneration(
          session.userId,
          prompt,
          size || "1280x1280",
          [],
          "failed",
          result.error?.message,
          undefined,
          imageUrl,
        ).catch((err) =>
          console.error("[Generate-Image] Update failed record error:", err),
        );

        return NextResponse.json(
          {
            error: result.error?.message || "图片生成失败",
            code: result.error?.code,
            category: result.error?.category,
            retryable: result.error?.retryable,
          },
          { status: result.error?.code || 500 },
        );
      }
    } catch (error) {
      console.error("[Generate-Image] Generation error:", error);

      await recordImageGeneration(
        session.userId,
        prompt,
        size || "1280x1280",
        [],
        "failed",
        error instanceof Error ? error.message : "未知错误",
        undefined,
        imageUrl,
      ).catch((err) =>
        console.error("[Generate-Image] Update error record error:", err),
      );

      throw error;
    }
  } catch (error) {
    console.error("[API-Route] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "服务器内部错误",
        code: 500,
        retryable: true,
      },
      { status: 500 },
    );
  }
}
