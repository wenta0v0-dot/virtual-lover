import { clearSession } from "@/lib/auth";

export async function POST() {
  try {
    await clearSession();
    return Response.json({ success: true });
  } catch (error) {
    console.error("[Logout] Error:", error);
    return Response.json({ error: "退出登录失败" }, { status: 500 });
  }
}
