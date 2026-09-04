require("dotenv").config({ path: ".env.local" });

const http = require("http");

console.log("🔬 === 深度诊断开始 ===\n");

// 测试1：检查环境变量
console.log("1️⃣  环境变量检查：");
console.log(
  "   AUTH_SECRET:",
  process.env.AUTH_SECRET
    ? "✅ 已设置 (" + process.env.AUTH_SECRET.substring(0, 10) + "...)"
    : "❌ 未设置",
);
console.log(
  "   ZHIPUAI_CHAT_API_KEY:",
  process.env.ZHIPUAI_CHAT_API_KEY ? "✅ 已设置" : "❌ 未设置",
);
console.log(
  "   DATABASE_URL:",
  process.env.DATABASE_URL ? "✅ 已设置" : "❌ 未设置",
);
console.log("   DEV_MODE:", process.env.DEV_MODE);

// 测试2：模拟完整登录和聊天流程
async function testFullFlow() {
  console.log("\n2️⃣  测试完整API流程：\n");

  // 2.1 测试发送验证码
  console.log("   [2.1] 测试发送验证码...");
  try {
    const sendCodeResult = await makeRequest("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test-debug@test.com" }),
    });
    console.log(
      "   发送验证码响应:",
      sendCodeResult.statusCode,
      sendCodeResult.body,
    );
  } catch (e) {
    console.error("   ❌ 发送验证码失败:", e.message);
  }

  // 2.2 测试验证码登录（DEV_MODE下可以直接获取验证码）
  console.log("\n   [2.2] 尝试直接测试聊天API（带假session）...");

  // 测试不带认证的聊天请求
  try {
    const chatResult = await makeRequest("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "你好" }],
        characterId: "test",
        characterName: "Test",
        characterAvatar: "",
      }),
    });
    console.log("   聊天API响应状态码:", chatResult.statusCode);
    console.log("   聊天API响应体:", chatResult.body.substring(0, 200));
  } catch (e) {
    console.error("   ❌ 聊天API请求失败:", e.message);
  }
}

function makeRequest(path, options) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path: path,
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () =>
          resolve({ statusCode: res.statusCode, body: body }),
        );
      },
    );

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// 测试3：检查数据库连接
async function testDatabase() {
  console.log("\n3️⃣  测试数据库连接...");
  try {
    const { getDb } = require("./src/db");
    const db = getDb();
    const result = await db
      .select({ count: 1 })
      .from(require("./src/db/schema").users);
    console.log("   ✅ 数据库连接正常");
  } catch (e) {
    console.error("   ❌ 数据库连接失败:", e.message);
  }
}

// 运行所有测试
(async () => {
  await testFullFlow();

  try {
    await testDatabase();
  } catch (e) {
    console.error("\n   数据库测试跳过（可能需要编译）");
  }

  console.log("\n" + "=".repeat(50));
  console.log("🔬 === 深度诊断完成 ===");
  console.log("=".repeat(50));

  console.log("\n💡 如果聊天API返回401，说明认证系统有问题");
  console.log("💡 如果聊天API返回500，说明后端逻辑或AI API有问题");
  console.log("💡 请把上面的完整输出发给开发者查看\n");
})();
