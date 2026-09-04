require("dotenv").config({ path: ".env.local" });

const https = require("https");

console.log("🔍 快速测试...\n");
console.log(
  "✅ AUTH_SECRET:",
  process.env.AUTH_SECRET ? "已设置" : "❌ 未设置",
);
console.log(
  "✅ API_KEY:",
  process.env.ZHIPUAI_CHAT_API_KEY ? "已设置" : "❌ 未设置",
);
console.log(
  "✅ DATABASE_URL:",
  process.env.DATABASE_URL ? "已设置" : "❌ 未设置",
);

console.log("\n🤖 测试智谱AI API...");

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
  },
  (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      console.log(`📡 状态码: ${res.statusCode}`);
      if (res.statusCode === 200) {
        const json = JSON.parse(body);
        console.log("✅ API连接成功！");
        console.log(`🤖 响应: ${json.choices?.[0]?.message?.content}`);
      } else {
        console.log("❌ API错误:", body);
      }
    });
  },
);

req.on("error", (e) => console.error("❌ 请求失败:", e.message));
req.write(data);
req.end();
