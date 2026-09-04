import { getCurrentUser } from "@/lib/auth";
import { isDevMode } from "@/lib/dev-auth";

export async function GET() {
  try {
    if (isDevMode()) {
      return Response.json({
        user: {
          id: 1,
          email: "dev@example.com",
          name: "开发用户",
          avatar: null,
        },
      });
    }

    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: "未登录" }, { status: 401 });
    }

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("[Me] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "获取用户信息失败";

    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
