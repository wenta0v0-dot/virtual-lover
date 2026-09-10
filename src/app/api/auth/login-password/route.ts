import { NextRequest } from "next/server";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password";
import { z } from "zod";

const phoneRegex = /^1[3-9]\d{9}$/;

const loginPasswordSchema = z.object({
  phone: z
    .string()
    .min(1, "请输入手机号码")
    .regex(phoneRegex, "请输入有效的11位手机号码"),
  password: z.string().min(1, "请输入密码"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginPasswordSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { phone, password } = result.data;

    const rateLimitResult = checkRateLimit(`pwdlogin:${phone}`);
    if (!rateLimitResult.allowed) {
      return Response.json(
        {
          error: "尝试次数过多，请稍后再试",
          lockoutRemaining: rateLimitResult.lockoutRemaining,
        },
        { status: 429 },
      );
    }

    const { getDb } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = getDb();

    const user = await db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    // 统一提示，不泄露手机号是否已注册
    if (
      user.length === 0 ||
      !user[0].password ||
      !(await verifyPassword(password, user[0].password))
    ) {
      return Response.json(
        {
          error: "手机号或密码错误",
          remainingAttempts: rateLimitResult.remainingAttempts,
        },
        { status: 401 },
      );
    }

    resetRateLimit(`pwdlogin:${phone}`);

    const { createSession } = await import("@/lib/auth");
    await createSession(user[0].id, user[0].phone);

    return Response.json({
      success: true,
      user: {
        id: user[0].id,
        phone: user[0].phone,
        name: user[0].name,
        avatar: user[0].avatar,
      },
    });
  } catch (error) {
    console.error("[LoginPassword] Error:", error);
    return Response.json({ error: "登录失败，请稍后重试" }, { status: 500 });
  }
}
