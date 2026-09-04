import { config } from "dotenv";
import fs from "fs";
import path from "path";

config({ path: ".env.local" });

interface ConfigCheck {
  name: string;
  key: string;
  required: boolean;
  isSet: boolean;
  value?: string;
  maskedValue?: string;
  isValid: boolean;
  message: string;
}

function maskSensitive(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars) return "***";
  return (
    value.slice(0, visibleChars) +
    "*".repeat(Math.min(value.length - visibleChars, 8)) +
    (value.length > visibleChars + 8 ? "..." : "")
  );
}

function checkConfig(): ConfigCheck[] {
  const checks: ConfigCheck[] = [];

  checks.push({
    name: "数据库连接",
    key: "DATABASE_URL",
    required: true,
    isSet: !!process.env.DATABASE_URL,
    value: process.env.DATABASE_URL,
    maskedValue: process.env.DATABASE_URL
      ? maskSensitive(process.env.DATABASE_URL, 30)
      : undefined,
    isValid: !!process.env.DATABASE_URL,
    message: process.env.DATABASE_URL
      ? "✅ 已配置"
      : "❌ 未设置（数据库功能不可用）",
  });

  checks.push({
    name: "SMTP 主机",
    key: "SMTP_HOST",
    required: true,
    isSet: !!process.env.SMTP_HOST,
    value: process.env.SMTP_HOST,
    isValid: !!process.env.SMTP_HOST,
    message: process.env.SMTP_HOST
      ? `✅ 已配置 (${process.env.SMTP_HOST})`
      : "❌ 未设置（邮件发送不可用）",
  });

  checks.push({
    name: "SMTP 端口",
    key: "SMTP_PORT",
    required: true,
    isSet: !!process.env.SMTP_PORT,
    value: process.env.SMTP_PORT,
    isValid:
      !!process.env.SMTP_PORT &&
      ![587, 465, 25].includes(Number(process.env.SMTP_PORT)),
    message: process.env.SMTP_PORT
      ? `✅ 已配置 (端口 ${process.env.SMTP_PORT})`
      : "❌ 未设置",
  });

  checks.push({
    name: "SMTP 用户名",
    key: "SMTP_USER",
    required: true,
    isSet: !!process.env.SMTP_USER,
    value: process.env.SMTP_USER,
    maskedValue: process.env.SMTP_USER
      ? maskSensitive(process.env.SMTP_USER)
      : undefined,
    isValid: !!process.env.SMTP_USER && process.env.SMTP_USER.includes("@"),
    message: process.env.SMTP_USER
      ? process.env.SMTP_USER.includes("@")
        ? "✅ 格式正确"
        : "⚠️ 格式可能不正确"
      : "❌ 未设置",
  });

  checks.push({
    name: "SMTP 密码/授权码",
    key: "SMTP_PASS",
    required: true,
    isSet: !!process.env.SMTP_PASS,
    value: process.env.SMTP_PASS,
    maskedValue: process.env.SMTP_PASS
      ? maskSensitive(process.env.SMTP_PASS, 2)
      : undefined,
    isValid: !!process.env.SMTP_PASS && process.env.SMTP_PASS.length > 5,
    message: process.env.SMTP_PASS
      ? process.env.SMTP_PASS.length > 5
        ? "✅ 已配置"
        : "⚠️ 密码太短"
      : "❌ 未设置",
  });

  checks.push({
    name: "应用名称",
    key: "APP_NAME",
    required: false,
    isSet: !!process.env.APP_NAME,
    value: process.env.APP_NAME,
    isValid: true,
    message: process.env.APP_NAME || "⚠️ 使用默认值（虚拟恋人）",
  });

  checks.push({
    name: "认证密钥",
    key: "AUTH_SECRET",
    required: true,
    isSet: !!process.env.AUTH_SECRET,
    isValid: true,
    message: "✅ 已配置",
  });

  checks.push({
    name: "开发模式",
    key: "DEV_MODE",
    required: false,
    isSet: process.env.DEV_MODE !== undefined,
    value: process.env.DEV_MODE,
    isValid: true,
    message:
      process.env.DEV_MODE === "true"
        ? "🔧 开启（验证码直接显示）"
        : "🔒 关闭（发送真实邮件）",
  });

  return checks;
}

console.log("🔍 检查项目配置...\n");

const configChecks = checkConfig();

let allRequiredValid = true;

configChecks.forEach((check) => {
  const statusIcon = check.isValid ? "✅" : check.isSet ? "⚠️" : "❌";
  console.log(`${statusIcon} ${check.name}`);
  console.log(`   配置项: ${check.key}`);
  if (check.maskedValue) {
    console.log(`   当前值: ${check.maskedValue}`);
  }
  console.log(`   状态: ${check.message}\n`);

  if (check.required && !check.isValid) {
    allRequiredValid = false;
  }
});

const requiredCount = configChecks.filter((c) => c.required).length;
const validRequiredCount = configChecks.filter(
  (c) => c.required && c.isValid,
).length;

console.log("📊 配置摘要:");
console.log(`   必需配置: ${validRequiredCount}/${requiredCount} 通过`);
console.log(
  `   总体状态: ${allRequiredValid ? "✅ 所有必需配置已就绪" : "❌ 存在配置问题"}\n`,
);

if (!allRequiredValid) {
  console.log("📝 配置指南:\n");
  console.log("1. Gmail 邮箱配置:");
  console.log("   - 开启两步验证: https://myaccount.google.com/security");
  console.log(
    "   - 生成应用专用密码: https://myaccount.google.com/apppasswords",
  );
  console.log("   - SMTP_HOST=smtp.gmail.com");
  console.log("   - SMTP_PORT=587");
  console.log("   - SMTP_USER=your-email@gmail.com");
  console.log("   - SMTP_PASS=xxxx-xxxx-xxxx-xxxx (应用专用密码)\n");
  console.log("2. QQ 邮箱配置:");
  console.log("   - 登录 QQ 邮箱 → 设置 → 账户 → POP3/SMTP 服务 → 开启");
  console.log("   - 获取授权码");
  console.log("   - SMTP_HOST=smtp.qq.com");
  console.log("   - SMTP_PORT=465 (或 587)");
  console.log("   - SMTP_USER=your-email@qq.com");
  console.log("   -SMTP_PASS=xxxxxxxx (授权码)\n");
  console.log("3. 163 邮箱配置:");
  console.log("   - 登录 163 邮箱 → 设置 → POP3/SMTP/IMAP → 开启");
  console.log("   - 获取授权码");
  console.log("   - SMTP_HOST=smtp.163.com");
  console.log("   - SMTP_PORT=465 (或 587)");
  console.log("   - SMTP_USER=your-email@163.com");
  console.log("   - SMTP_PASS=xxxxxxxx (授权码)\n");
}

console.log("🧪 测试命令:");
console.log("   # 测试数据库连接");
console.log("   pnpm tsx scripts/test-db.ts\n");
console.log("   # 测试邮件发送（替换为真实邮箱）");
console.log("   pnpm tsx scripts/test-email.ts your-email@example.com\n");

process.exit(allRequiredValid ? 0 : 1);
