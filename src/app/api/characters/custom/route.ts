import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { customCharacters } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { isDevMode } from "@/lib/dev-auth";

export async function POST(request: NextRequest) {
  try {
    // 获取当前用户
    let user;
    if (isDevMode()) {
      // 开发模式：返回固定用户
      user = {
        id: 1,
        email: "dev@example.com",
        name: "开发用户",
      };
    } else {
      // 生产模式：从session获取真实用户
      user = await getCurrentUser();
    }

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      title,
      tags,
      avatar,
      avatarImage,
      gender,
      appearance,
      systemPrompt,
      greeting,
      color,
      status,
    } = body;

    // 验证必填字段
    if (!name || !systemPrompt || !greeting) {
      return NextResponse.json(
        { error: "角色名称、人物设定和开场白为必填项" },
        { status: 400 },
      );
    }

    // 获取数据库实例
    const db = getDb();

    // 创建自定义角色
    const [newCharacter] = await db
      .insert(customCharacters)
      .values({
        userId: user.id,
        name: name.trim(),
        title: title?.trim() || "自定义角色",
        tags: tags || [],
        avatar: avatar || "🎭",
        avatarImage: avatarImage || null,
        gender: gender || "female",
        appearance: appearance || "",
        systemPrompt: systemPrompt.trim(),
        greeting: greeting.trim(),
        color: color || "#FFB6C1",
        status: status || "在线",
        isActive: true,
      })
      .returning();

    console.log(
      "[Custom-Character] 创建成功:",
      newCharacter.id,
      newCharacter.name,
    );

    return NextResponse.json({
      success: true,
      character: {
        ...newCharacter,
        id: `custom-${newCharacter.id}`, // 添加前缀区分自定义角色
        isCustom: true,
      },
    });
  } catch (error) {
    console.error("[Custom-Character] 创建失败:", error);
    return NextResponse.json(
      { error: "创建角色失败，请稍后重试" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取当前用户
    let user;
    if (isDevMode()) {
      // 开发模式：返回固定用户
      user = {
        id: 1,
        email: "dev@example.com",
        name: "开发用户",
      };
    } else {
      // 生产模式：从session获取真实用户
      user = await getCurrentUser();
    }

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取数据库实例
    const db = getDb();

    // 获取用户的所有自定义角色
    const userCharacters = await db
      .select()
      .from(customCharacters)
      .where(eq(customCharacters.userId, user.id))
      .orderBy(desc(customCharacters.createdAt));

    // 转换格式，添加 custom- 前缀
    const formattedCharacters = userCharacters.map((char) => ({
      ...char,
      id: `custom-${char.id}`,
      isCustom: true,
    }));

    return NextResponse.json({
      success: true,
      characters: formattedCharacters,
    });
  } catch (error) {
    console.error("[Custom-Character] 获取失败:", error);
    return NextResponse.json({ error: "获取角色列表失败" }, { status: 500 });
  }
}

async function getUserSession(request: NextRequest) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/auth/me`,
      {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      },
    );

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
