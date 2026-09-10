import { NextRequest } from "next/server";
import { isDevMode, verifyDevCode } from "@/lib/dev-auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

const phoneRegex = /^1[3-9]\d{9}$/;

const nicknameSchema = z
  .string()
  .trim()
  .min(1, "请输入昵称")
  .max(20, "昵称最多20个字符");

const passwordSchema = z
  .string()
  .min(6, "密码至少6位")
  .max(64, "密码最多64位");

const codeSchema = z.string().length(6, "验证码为6位数字");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const phone = String(formData.get("phone") || "").trim();
    const nickname = String(formData.get("nickname") || "").trim();
    const password = String(formData.get("password") || "");
    const code = String(formData.get("code") || "").trim();
    const avatarFile = formData.get("avatar");

    const phoneResult = z
      .string()
      .regex(phoneRegex, "请输入有效的11位手机号码")
      .safeParse(phone);
    if (!phoneResult.success) {
      return Response.json({ error: "请输入有效的11位手机号码" }, { status: 400 });
    }
    if (!nicknameSchema.safeParse(nickname).success) {
      return Response.json(
        { error: nicknameSchema.safeParse(nickname).error?.issues[0].message },
        { status: 400 },
      );
    }
    if (!passwordSchema.safeParse(password).success) {
      return Response.json(
        { error: passwordSchema.safeParse(password).error?.issues[0].message },
        { status: 400 },
      );
    }
    if (!codeSchema.safeParse(code).success) {
      return Response.json({ error: "请输入6位数字验证码" }, { status: 400 });
    }
    // 头像可选：未上传时跳过校验，注册成功后使用默认头像
    const hasAvatar = avatarFile instanceof File && avatarFile.size > 0;

    const rateLimitResult = checkRateLimit(`register:${phone}`);
    if (!rateLimitResult.allowed) {
      return Response.json(
        {
          error: "注册尝试次数过多，请稍后再试",
          lockoutRemaining: rateLimitResult.lockoutRemaining,
        },
        { status: 429 },
      );
    }

    // 校验验证码
    if (isDevMode()) {
      if (!verifyDevCode(phone, code)) {
        return Response.json(
          {
            error: "验证码错误或已过期",
            remainingAttempts: rateLimitResult.remainingAttempts,
          },
          { status: 400 },
        );
      }
    } else {
      const { getDb } = await import("@/db");
      const { verificationCodes } = await import("@/db/schema");
      const { eq, and, gt } = await import("drizzle-orm");
      const db = getDb();

      const now = new Date();
      const validCode = await db
        .select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.phone, phone),
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
    }

    const { getDb } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = getDb();

    // 手机号已被注册
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    if (existing.length > 0) {
      return Response.json(
        { error: "该手机号已注册，请直接登录" },
        { status: 409 },
      );
    }

    const { storage } = await import("@/lib/storage");
    let avatarBuffer: Buffer | null = null;
    if (hasAvatar) {
      avatarBuffer = Buffer.from(await avatarFile.arrayBuffer());
      const validation = storage.validateImage(avatarBuffer, avatarFile.type);
      if (!validation.valid) {
        return Response.json({ error: validation.error }, { status: 400 });
      }
    }

    const hashedPassword = await hashPassword(password);

    // 先创建用户，头像保存失败时回滚删除，避免留下无头像的半成品账户
    let newUser;
    try {
      const inserted = await db
        .insert(users)
        .values({ phone, name: nickname, password: hashedPassword })
        .returning();
      newUser = inserted[0];

      if (avatarBuffer && avatarFile instanceof File) {
        await storage.initialize();
        const uploadResult = await storage.saveAvatar(
          newUser.id,
          avatarBuffer,
          avatarFile.name || "avatar.png",
          avatarFile.type,
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "头像上传失败");
        }

        const updated = await db
          .update(users)
          .set({ avatar: uploadResult.url })
          .where(eq(users.id, newUser.id))
          .returning();
        newUser = updated[0];
      }
    } catch (error) {
      if (newUser) {
        await db.delete(users).where(eq(users.id, newUser.id));
      }
      console.error("[Register] 注册失败:", error);
      return Response.json({ error: "注册失败，请稍后重试" }, { status: 500 });
    }

    resetRateLimit(`register:${phone}`);

    const { createSession } = await import("@/lib/auth");
    await createSession(newUser.id, newUser.phone);

    console.log("[Register] 注册成功:", { userId: newUser.id, phone });

    return Response.json({
      success: true,
      user: {
        id: newUser.id,
        phone: newUser.phone,
        name: newUser.name,
        avatar: newUser.avatar,
      },
    });
  } catch (error) {
    console.error("[Register] Error:", error);

    const message = error instanceof Error ? error.message : "";
    if (message.includes("unique") || message.includes("duplicate")) {
      return Response.json(
        { error: "该手机号已注册，请直接登录" },
        { status: 409 },
      );
    }

    return Response.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}
