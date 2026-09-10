import { NextRequest } from "next/server";
import { getSession, getCurrentUser } from "@/lib/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: "请先登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await getCurrentUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "用户不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        id: user.id,
        phone: user.phone,
        name: user.name || "",
        avatar: user.avatar || null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[User-Settings-API] GET error:", error);
    return new Response(JSON.stringify({ error: "获取用户信息失败" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[User-Settings-API] 收到PUT请求");

    const session = await getSession();
    console.log("[User-Settings-API] Session:", session);

    if (!session) {
      console.log("[User-Settings-API] 未授权：无session");
      return new Response(JSON.stringify({ error: "请先登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let body;
    try {
      body = await request.json();
      console.log(
        "[User-Settings-API] 请求体:",
        JSON.stringify(body).slice(0, 200),
      );
    } catch (parseError) {
      console.error("[User-Settings-API] 解析请求体失败:", parseError);
      return new Response(
        JSON.stringify({
          error: "无效的JSON格式",
          details: parseError instanceof Error ? parseError.message : String(parseError),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { name, avatar } = body;

    console.log("[User-Settings-API] 更新用户信息:", {
      name,
      hasAvatar: !!avatar,
      avatarLength: avatar ? avatar.length : 0,
    });

    const db = getDb();
    const updateData: Record<string, string | null> = {};

    if (name !== undefined && name !== null) {
      updateData.name = String(name).trim().slice(0, 100);
    }

    if (avatar !== undefined) {
      if (!avatar) {
        updateData.avatar = null;
      } else if (
        avatar.startsWith("http://") ||
        avatar.startsWith("https://") ||
        avatar.startsWith("/uploads/")
      ) {
        console.log("[User-Settings-API] 使用文件URL:", avatar.slice(0, 80));
        updateData.avatar = avatar;
      } else if (avatar.startsWith("data:")) {
        console.warn("[User-Settings-API] 收到base64数据，应使用文件上传API");
        return new Response(
          JSON.stringify({
            error: "请使用文件上传接口上传头像",
            hint: "使用 POST /api/upload/avatar 上传文件后再保存设置",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      } else {
        updateData.avatar = avatar;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: "没有需要更新的字段" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[User-Settings-API] 准备执行数据库更新...");
    console.log("[User-Settings-API] 更新数据:", {
      ...updateData,
      avatarPreview: updateData.avatar
        ? updateData.avatar.slice(0, 50) + "..."
        : null,
    });

    const updated = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.userId))
      .returning();

    console.log("[User-Settings-API] 数据库更新完成，结果数:", updated.length);

    if (updated.length === 0) {
      return new Response(JSON.stringify({ error: "更新失败，用户不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = updated[0];
    console.log("[User-Settings-API] 更新成功:", {
      id: user.id,
      name: user.name,
      hasAvatar: !!user.avatar,
      avatarLength: user.avatar ? user.avatar.length : 0,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "更新成功",
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          avatar: user.avatar,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[User-Settings-API] PUT error:", error);
    return new Response(
      JSON.stringify({
        error: "更新失败",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
