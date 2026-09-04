import { NextRequest } from "next/server";
import { sendVerificationCode } from "@/lib/email";
import { isDevMode, generateDevCode } from "@/lib/dev-auth";
import { z } from "zod";

const sendCodeSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
});

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = sendCodeSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email } = result.data;

    if (isDevMode()) {
      const code = generateDevCode(email);
      return Response.json({
        success: true,
        message: "验证码已生成（开发模式）",
        devCode: code,
      });
    }

    const { getDb } = await import("@/db");
    const { verificationCodes } = await import("@/db/schema");
    const { eq, and, gt } = await import("drizzle-orm");
    const db = getDb();

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCode = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.email, email),
          gt(verificationCodes.createdAt, oneMinuteAgo),
        ),
      )
      .limit(1);

    if (recentCode.length > 0) {
      return Response.json(
        { error: "发送过于频繁，请稍后再试" },
        { status: 429 },
      );
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(verificationCodes).values({
      email,
      code,
      expiresAt,
    });

    await sendVerificationCode(email, code);

    return Response.json({ success: true, message: "验证码已发送" });
  } catch (error) {
    console.error("[SendCode] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "发送验证码失败，请稍后重试";

    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
