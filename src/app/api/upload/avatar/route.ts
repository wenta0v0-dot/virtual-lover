import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import storage from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    console.log("[Upload-API] 收到头像上传请求");

    const session = await getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: "请先登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "未选择文件" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[Upload-API] 文件信息:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    const validation = storage.validateImage(buffer, file.type);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await storage.initialize();

    const result = await storage.saveAvatar(
      session.userId,
      buffer,
      file.name,
      file.type,
    );

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[Upload-API] 上传成功:", result.url);

    return new Response(
      JSON.stringify({
        success: true,
        url: result.url,
        filename: result.filename,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[Upload-API] 上传失败:", error);
    return new Response(
      JSON.stringify({
        error: "服务器内部错误",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
