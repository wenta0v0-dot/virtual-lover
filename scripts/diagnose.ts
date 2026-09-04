import { config } from "dotenv";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { encrypt, decrypt } from "@/lib/auth";

config({ path: ".env.local" });

console.log("🔍 === 全面诊断开始 ===\n");

let allPassed = true;

// 1. 检查环境变量
console.log("1️⃣  检查环境变量...");
const envChecks = [
  { name: "AUTH_SECRET", key: "AUTH_SECRET", required: true },
  { name: "智谱AI聊天API密钥", key: "ZHIPUAI_CHAT_API_KEY", required: true },
  { name: "智谱AI图片API密钥", key: "ZHIPUAI_IMAGE_API_KEY", required: true },
  { name: "智谱AI基础URL", key: "ZHIPUAI_BASE_URL", required: false },
  { name: "智谱AI聊天模型", key: "ZHIPUAI_CHAT_MODEL", required: false },
  { name: "数据库URL", key: "DATABASE_URL", required: true },
  { name: "开发模式", key: "DEV_MODE", required: false },
];

envChecks.forEach((check) => {
  const value = process.env[check.key];
  const status = value ? "✅" : "❌";
  const displayValue =
    check.key.includes("KEY") ||
    check.key.includes("SECRET") ||
    check.key.includes("PASS")
      ? value
        ? `${value.substring(0, 10)}...`
        : "未设置"
      : value || "未设置";

  console.log(`   ${status} ${check.name}: ${displayValue}`);

  if (check.required && !value) {
    allPassed = false;
    console.log(`      ⚠️  ${check.name} 是必需的！`);
  }
});

// 2. 测试AUTH_SECRET是否可用
console.log("\n2️⃣  测试AUTH_SECRET加密/解密...");
try {
  const testPayload = { userId: 1, email: "test@example.com" };
  const token = await encrypt(testPayload);
  console.log("   ✅ 加密成功");

  const decrypted = await decrypt(token);
  console.log("   ✅ 解密成功");
  console.log(`   👤 测试用户: ${decrypted.email}`);
} catch (error) {
  console.error("   ❌ AUTH_SECRET测试失败:", error);
  allPassed = false;
}

// 3. 测试数据库连接
console.log("\n3️⃣  测试数据库连接...");
try {
  const db = getDb();
  const result = await db.select({ count: users.id }).from(users);
  console.log("   ✅ 数据库连接成功");
  console.log(`   👥 用户数量: ${result.length}`);
} catch (error) {
  console.error("   ❌ 数据库连接失败:", error);
  allPassed = false;
}

// 4. 测试智谱AI API连接
console.log("\n4️⃣  测试智谱AI聊天API...");
const ZHIPUAI_API_KEY = process.env.ZHIPUAI_CHAT_API_KEY;
const ZHIPUAI_BASE_URL =
  process.env.ZHIPUAI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";

if (!ZHIPUAI_API_KEY) {
  console.log("   ❌ 智谱AI API密钥未设置");
  allPassed = false;
} else {
  try {
    const response = await fetch(`${ZHIPUAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ZHIPUAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.ZHIPUAI_CHAT_MODEL || "glm-5.2",
        messages: [{ role: "user", content: "你好" }],
        max_tokens: 10,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("   ✅ 智谱AI API连接成功");
      console.log(
        `   🤖 模型响应: ${data.choices?.[0]?.message?.content?.substring(0, 50)}...`,
      );
    } else {
      const errorText = await response.text();
      console.error(`   ❌ 智谱AI API错误 [${response.status}]:`, errorText);
      allPassed = false;
    }
  } catch (error) {
    console.error("   ❌ 智谱AI API请求失败:", error);
    allPassed = false;
  }
}

// 5. 检查开发模式配置
console.log("\n5️⃣  检查开发模式配置...");
const devMode = process.env.DEV_MODE === "true";
console.log(
  `   📋 开发模式: ${devMode ? "已开启（验证码直接显示）" : "已关闭（发送邮件验证码）"}`,
);

if (!devMode) {
  const smtpConfigured =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (!smtpConfigured) {
    console.log("   ⚠️  开发模式关闭但SMTP未配置完整，登录可能失败");
    allPassed = false;
  } else {
    console.log("   ✅ SMTP配置完整");
  }
}

// 总结
console.log("\n" + "=".repeat(50));
if (allPassed) {
  console.log("🎉 所有检查通过！应用应该可以正常工作。");
  console.log("\n💡 如果仍有问题，请：");
  console.log("   1. 重启开发服务器 (Ctrl+C 然后 pnpm dev)");
  console.log("   2. 清除浏览器cookie并重新登录");
  console.log("   3. 查看浏览器控制台(F12)的具体错误信息");
} else {
  console.log("❌ 发现问题！请根据上面的提示修复。");
  console.log("\n🔧 常见修复方法：");
  console.log("   - 缺少环境变量 → 编辑 .env.local 文件添加");
  console.log("   - API密钥无效 → 检查智谱AI控制台的API密钥");
  console.log("   - 数据库失败 → 检查DATABASE_URL是否正确");
}
console.log("=".repeat(50));

process.exit(allPassed ? 0 : 1);
