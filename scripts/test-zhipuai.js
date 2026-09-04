require("dotenv").config({ path: ".env.local" });

const API_KEY = process.env.ZHIPUAI_CHAT_API_KEY;
const API_BASE_URL =
  process.env.ZHIPUAI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";
const MODEL = process.env.ZHIPUAI_CHAT_MODEL || "glm-5.2";

console.log("🔍 测试智谱AI API...");
console.log(
  "API_KEY:",
  API_KEY ? "✅ 已设置 (" + API_KEY.substring(0, 10) + "...)" : "❌ 未设置",
);
console.log("MODEL:", MODEL);

if (!API_KEY) {
  console.error("❌ API_KEY 未设置");
  process.exit(1);
}

async function testAPI() {
  try {
    console.log("\n📡 发送测试请求...");
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: "你好" }],
        max_tokens: 50,
      }),
    });

    console.log("📊 状态码:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API连接成功！");
      console.log("🤖 回复:", data.choices?.[0]?.message?.content);
    } else {
      const errorText = await response.text();
      console.error("❌ API错误:", errorText);
    }
  } catch (error) {
    console.error("❌ 请求失败:", error.message);
  }
}

testAPI();
