import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateImageWithRetry } from "@/services/image-generation";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { appearance, gender, style = "anime" } = await request.json();

    if (!appearance) {
      return NextResponse.json({ error: "请提供外貌描述" }, { status: 400 });
    }

    // 构建AI绘画提示词
    const genderText = gender === "female" ? "female girl" : "male boy";
    const prompt = `Create a high-quality ${style} style portrait of a ${genderText} character.
    
Appearance: ${appearance}

Requirements:
- Front-facing portrait, shoulders up
- Clean soft gradient background (pastel colors)
- Expressive, appealing, detailed face
- High quality, sharp details
- Suitable for use as a profile avatar
- Soft, warm lighting
- ${gender === "female" ? "Beautiful, charming" : "Handsome, attractive"} appearance
- Professional anime art style
- Vibrant colors but not oversaturated`;

    console.log("[GenerateAvatar] Generating avatar with prompt:", prompt);

    const result = await generateImageWithRetry({
      prompt,
      size: "1280x1280",
    });

    if (result.success && result.imageUrls && result.imageUrls.length > 0) {
      const imageUrl = result.imageUrls[0];
      console.log("[GenerateAvatar] Success:", imageUrl);
      return NextResponse.json({ success: true, imageUrl });
    }

    console.error(
      "[GenerateAvatar] Generation failed:",
      result.error?.message,
    );
    return NextResponse.json(
      { error: result.error?.message || "头像生成失败，请稍后重试" },
      { status: result.error?.code || 500 },
    );
  } catch (error) {
    console.error("[GenerateAvatar] Error:", error);
    return NextResponse.json(
      { error: "头像生成失败，请稍后重试" },
      { status: 500 },
    );
  }
}
