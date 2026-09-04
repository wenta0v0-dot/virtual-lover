require("dotenv").config({ path: ".env.local" });

console.log("🔍 简单诊断测试\n");

// 测试1：环境变量
console.log("1️⃣ 环境变量:");
console.log(
  "   AUTH_SECRET:",
  process.env.AUTH_SECRET
    ? "✅ (" + process.env.AUTH_SECRET.substring(0, 10) + "...)"
    : "❌",
);
console.log(
  "   ZHIPUAI_CHAT_API_KEY:",
  process.env.ZHIPUAI_CHAT_API_KEY ? "✅" : "❌",
);
console.log("   DATABASE_URL:", process.env.DATABASE_URL ? "✅" : "❌");
console.log(
  "   ZHIPUAI_CHAT_MODEL:",
  process.env.ZHIPUAI_CHAT_MODEL || "默认(glm-5.2)",
);

// 测试2：直接测试智谱AI API
console.log("\n2️⃣ 智谱AI API测试:");
const https = require("https");

const data = JSON.stringify({
  model: process.env.ZHIPUAI_CHAT_MODEL || "glm-5.2",
  messages: [{ role: "user", content: "你好" }],
  max_tokens: 20,
});

const req = https.request(
  {
    hostname: "open.bigmodel.cn",
    path: "/api/paas/v4/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.ZHIPUAI_CHAT_API_KEY,
      "Content-Length": Buffer.byteLength(data),
    },
    timeout: 10000,
  },
  (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      console.log("   状态码:", res.statusCode);
      if (res.statusCode === 200) {
        try {
          const json = JSON.parse(body);
          console.log(
            "   ✅ API正常！回复:",
            json.choices?.[0]?.message?.content,
          );
        } catch {
          console.log("   ⚠️  解析失败:", body.substring(0, 100));
        }
      } else {
        console.log("   ❌ API错误:", body.substring(0, 200));
      }
    });
  },
);

req.on("error", (e) => console.log("   ❌ 请求失败:", e.message));
req.on("timeout", () => {
  console.log("   ❌ 请求超时");
  req.destroy();
});
req.write(data);
req.end();
