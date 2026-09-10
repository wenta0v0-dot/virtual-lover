import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isDevMode } from "@/lib/dev-auth";
import { chatWithVision } from "@/services/vision";

export async function POST(request: NextRequest) {
  try {
    // 验证用户
    let user;
    if (isDevMode()) {
      user = { id: 1, email: "dev@example.com", name: "开发用户" };
    } else {
      user = await getCurrentUser();
    }

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 解析multipart form data
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const messagesJson = formData.get("messages") as string;
    const characterDataJson = formData.get("characterData") as string;

    if (!image) {
      return NextResponse.json({ error: "请上传图片" }, { status: 400 });
    }

    // 验证图片
    if (!image.type.startsWith("image/")) {
      return NextResponse.json({ error: "请上传有效的图片" }, { status: 400 });
    }

    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "图片大小不能超过10MB" },
        { status: 400 },
      );
    }

    const messages = JSON.parse(messagesJson);
    const characterData = JSON.parse(characterDataJson);

    // 将图片转换为base64
    const bytes = await image.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${image.type};base64,${base64Image}`;

    // 构建系统提示词
    const systemPrompt = `${characterData.systemPrompt}

重要：用户发送了一张图片给你。请仔细观察图片内容，并根据图片内容与用户进行自然、有趣的对话。
你可以：
1. 描述图片内容
2. 对图片发表看法或感受
3. 根据图片内容展开话题
4. 如果图片中有用户本人，可以赞美或调侃

保持角色性格的一致性，像真实的人一样回应。`;

    // 构建消息数组
    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: [
          {
            type: "image_url" as const,
            image_url: {
              url: dataUrl,
            },
          },
          {
            type: "text" as const,
            text: "看看这张图片～",
          },
        ],
      },
    ];

    console.log("[ChatWithImage] Sending request to ZhipuAI vision model...");

    const result = await chatWithVision(chatMessages, {
      maxTokens: 1000,
      temperature: 0.8,
    });

    if (!result.success || !result.content) {
      return NextResponse.json(
        { error: result.error?.message || "处理图片失败，请稍后重试" },
        { status: result.error?.code || 500 },
      );
    }

    return NextResponse.json({
      success: true,
      reply: result.content,
    });
  } catch (error) {
    console.error("[ChatWithImage] Error:", error);
    return NextResponse.json(
      { error: "处理图片失败，请稍后重试" },
      { status: 500 },
    );
  }
}
