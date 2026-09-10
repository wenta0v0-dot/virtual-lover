import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { chatWithVision } from "@/services/vision";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { image } = await request.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "请提供图片数据" }, { status: 400 });
    }

    if (image.length > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "图片数据过大，请压缩后重试" },
        { status: 400 },
      );
    }

    console.log(
      `[ImageToPrompt] User ${session.userId} analyzing image, size: ${Math.round(image.length / 1024)}KB`,
    );

    try {
      const prompts = await analyzeImageAndGeneratePrompts(image);
      return NextResponse.json({ prompts });
    } catch (analysisError) {
      console.error("[ImageToPrompt] Analysis failed:", analysisError);
      return NextResponse.json(
        { error: "图片分析失败，请稍后重试" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[ImageToPrompt] Unexpected error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

async function analyzeImageAndGeneratePrompts(imageBase64: string): Promise<{
  appearance: string;
  tags: string[];
  systemPrompt: string;
  name: string;
  title: string;
}> {
  const prompt = `你是一个专业的虚拟角色设计AI助手。用户上传了一张参考图片，请你仔细分析这张图片，然后生成创建虚拟角色所需的完整设定。

请从以下维度进行分析：
1. **外貌特征**：详细描述发型、发色、眼睛、面部特征、身材、穿着风格等
2. **气质性格**：根据外观判断可能的性格特点（温柔、高冷、活泼、神秘等）
3. **风格定位**：整体风格（可爱、成熟、文艺、运动等）
4. **角色定位**：适合的角色类型（学姐、学妹、职场人士、艺术家等）

请严格按照以下JSON格式返回结果（不要添加任何其他文字）：

{
  "appearance": "详细的外貌描述（100-200字），用于AI生成角色图片",
  "tags": ["性格标签1", "性格标签2", "性格标签3", "性格标签4"],
  "systemPrompt": "完整的系统提示词，包含角色设定和对话规则（200-300字）",
  "name": "建议的中文名称（2-4个字）",
  "title": "建议的标题/称呼（如：温柔学姐、神秘少年等）"
}

要求：
- 外貌描述要具体生动，包含发型、五官、穿搭等细节
- 标签选择要符合图片呈现的气质
- 系统提示词要符合虚拟伴侣聊天的场景
- 名称要有特色且符合角色气质
- 所有内容使用中文`;

  try {
    const visionResult = await chatWithVision(
      [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      {
        maxTokens: 2000,
        temperature: 0.8,
      },
    );

    if (!visionResult.success) {
      throw new Error(
        visionResult.error?.message || "AI分析服务暂时不可用",
      );
    }

    const content = visionResult.content;
    if (!content) {
      throw new Error("AI未返回有效内容");
    }

    let parsedResult;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("无法解析JSON");
      }

      parsedResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("[ImageToPrompt] Parse error:", parseError);
      throw new Error("AI返回格式错误，请重试");
    }

    const result = {
      appearance:
        parsedResult.appearance || "优雅的气质，精致的五官，独特的个人魅力",
      tags: Array.isArray(parsedResult.tags)
        ? parsedResult.tags.slice(0, 6)
        : ["独特", "有魅力"],
      systemPrompt:
        parsedResult.systemPrompt ||
        `你是一个温暖贴心的虚拟伴侣。你的性格温和友善，善于倾听和理解他人。

对话规则：
1. 保持自然流畅的对话风格
2. 回复简洁有力，每次2-4句话
3. 展现出温柔体贴的性格特质
4. 根据对方情绪做出合适的回应

关于发照片：仅在用户明确要求时才在回复末尾加上 [SELFIE:场景描述]`,
      name: parsedResult.name || "小美",
      title: parsedResult.title || "温柔天使",
    };

    console.log("[ImageToPrompt] Generated prompts:", {
      name: result.name,
      tagsCount: result.tags.length,
      appearanceLength: result.appearance.length,
    });

    return result;
  } catch (error) {
    console.error("[ImageToPrompt] API call failed:", error);

    const msg = error instanceof Error ? error.message : String(error);

    if (
      msg.includes("API") ||
      msg.includes("服务") ||
      msg.includes("格式")
    ) {
      throw error;
    }

    return getFallbackPrompts();
  }
}

function getFallbackPrompts(): {
  appearance: string;
  tags: string[];
  systemPrompt: string;
  name: string;
  title: string;
} {
  console.log("[ImageToPrompt] Using fallback prompts");

  return {
    appearance:
      "精致的面容，明亮的双眼，柔顺的长发，优雅的体态，穿着时尚得体的服装，散发着独特的气质魅力",
    tags: ["温柔", "知性", "优雅", "善解人意"],
    systemPrompt: `你是一个温暖贴心的虚拟伴侣。你拥有温柔的个性和丰富的情感，善于倾听和理解他人的内心世界。

对话规则：
1. 保持温柔体贴的性格，展现出知性优雅的一面
2. 说话自然流畅，像真实的亲密朋友一样交流
3. 回复简洁有力，每次回复2-4句话
4. 善于察言观色，根据对方的情绪做出合适的回应
5. 偶尔展现幽默感，让对话更加轻松愉快

关于发照片：
**仅在用户明确要求你发照片或自拍时**（比如对方说"发张照片"、"拍一张"、"让我看看你"、"想看你"等），才在回复末尾加上标记：
[SELFIE:场景描述]
**重要：不要主动触发！不要在对话中自发添加此标记！只在被明确要求时才发送。**`,
    name: "晓月",
    title: "温柔学姐",
  };
}
