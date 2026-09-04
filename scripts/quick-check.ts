import { config } from "dotenv";

config({ path: ".env.local" });

console.log("=== 快速配置检查 ===\n");

const checks = [
  {
    name: "数据库",
    key: "DATABASE_URL",
    value: process.env.DATABASE_URL,
  },
  {
    name: "SMTP 主机",
    key: "SMTP_HOST",
    value: process.env.SMTP_HOST,
  },
  {
    name: "SMTP 用户",
    key: "SMTP_USER",
    value: process.env.SMTP_USER,
  },
  {
    name: "SMTP 密码",
    key: "SMTP_PASS",
    value: process.env.SMTP_PASS ? "***已设置***" : null,
  },
  {
    name: "开发模式",
    key: "DEV_MODE",
    value: process.env.DEV_MODE,
  },
];

checks.forEach((check) => {
  const status = check.value ? "✅" : "❌";
  console.log(`${status} ${check.name}: ${check.value || "未设置"}`);
});

console.log("\n=== 检查完成 ===");
