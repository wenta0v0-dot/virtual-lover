import { NextRequest } from "next/server";
import { createSession } from "@/lib/auth";
import { isDevMode, verifyDevCode } from "@/lib/dev-auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const verifyCodeSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  code: z.string().length(6, "验证码为6位数字"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = verifyCodeSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email, code } = result.data;

    const rateLimitResult = checkRateLimit(`verify:${email}`);
    if (!rateLimitResult.allowed) {
      return Response.json(
        {
          error: "验证次数过多，请稍后再试",
          lockoutRemaining: rateLimitResult.lockoutRemaining,
          remainingAttempts: 0,
        },
        { status: 429 },
      );
    }

    if (isDevMode()) {
      const valid = verifyDevCode(email, code);
      if (!valid) {
        return Response.json(
          {
            error: "验证码错误或已过期",
            remainingAttempts: rateLimitResult.remainingAttempts,
          },
          { status: 400 },
        );
      }

      resetRateLimit(`verify:${email}`);

      const devUser = {
        id: 1,
        email,
        name: email.split("@")[0],
        avatar: null,
      };

      await createSession(devUser.id, devUser.email);

      return Response.json({
        success: true,
        user: devUser,
        remainingAttempts: rateLimitResult.remainingAttempts,
      });
    }

    const { getDb } = await import("@/db");
    const { users, verificationCodes } = await import("@/db/schema");
    const { eq, and, gt } = await import("drizzle-orm");
    const db = getDb();

    const now = new Date();

    const validCode = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.email, email),
          eq(verificationCodes.code, code),
          eq(verificationCodes.used, 0),
          gt(verificationCodes.expiresAt, now),
        ),
      )
      .limit(1);

    if (validCode.length === 0) {
      return Response.json(
        {
          error: "验证码错误或已过期",
          remainingAttempts: rateLimitResult.remainingAttempts,
        },
        { status: 400 },
      );
    }

    await db
      .update(verificationCodes)
      .set({ used: 1 })
      .where(eq(verificationCodes.id, validCode[0].id));

    resetRateLimit(`verify:${email}`);

    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      const newUser = await db
        .insert(users)
        .values({
          email,
          name: email.split("@")[0],
        })
        .returning();
      user = newUser;
    }

    await createSession(user[0].id, user[0].email);

    return Response.json({
      success: true,
      user: {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        avatar: user[0].avatar,
      },
      remainingAttempts: rateLimitResult.remainingAttempts,
    });
  } catch (error) {
    console.error("[VerifyCode] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "验证失败，请稍后重试";

    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
