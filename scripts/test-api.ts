import { config } from "dotenv";

config({ path: ".env.local" });

const API_KEY = process.env.ZHIPUAI_CHAT_API_KEY;
const BASE_URL =
  process.env.ZHIPUAI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";
const MODEL = process.env.ZHIPUAI_CHAT_MODEL || "glm-5.2";

console.log("🔍 测试智谱AI API连接...\n");

if (!API_KEY) {
  console.error("❌ ZHIPUAI_CHAT_API_KEY 未设置");
  process.exit(1);
}

try {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: "你好，请用一句话介绍自己" }],
      max_tokens: 50,
    }),
  });

  console.log(`📡 状态码: ${response.status}`);

  if (response.ok) {
    const data = await response.json();
    console.log("✅ API连接成功！");
    console.log(`🤖 模型响应: ${data.choices?.[0]?.message?.content}`);
    console.log("\n🎉 智谱AI API工作正常！问题可能出在其他地方。");
  } else {
    const errorText = await response.text();
    console.error("❌ API错误:");
    console.error(errorText);

    if (response.status === 401) {
      console.error("\n💡 可能原因: API密钥无效或已过期");
    } else if (response.status === 429) {
      console.error("\n💡 可能原因: API调用频率超限");
    } else if (response.status >= 500) {
      console.error("\n💡 可能原因: 智谱AI服务器错误，请稍后重试");
    }
  }
} catch (error) {
  console.error("❌ 请求失败:", error);
  console.error("\n💡 可能原因: 网络连接问题或URL配置错误");
}

process.exit(0);
