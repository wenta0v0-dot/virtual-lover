import { config } from "dotenv";
import { sendVerificationCode } from "@/lib/email";

config({ path: ".env.local" });

async function testEmail() {
  const testEmail = process.env.TEST_EMAIL || "your-test@email.com";

  console.log("📧 测试邮件发送功能\n");
  console.log(`📬 目标邮箱: ${testEmail}`);
  console.log(`🔧 SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`👤 SMTP User: ${process.env.SMTP_USER}\n`);

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.error("❌ 错误: SMTP 环境变量未完整配置");
    console.log("\n请在 .env.local 文件中设置:");
    console.log("  SMTP_HOST=smtp.gmail.com");
    console.log("  SMTP_PORT=587");
    console.log("  SMTP_USER=your-email@gmail.com");
    console.log("  SMTP_PASS=your-app-password\n");

    console.log("📝 常用邮箱服务商 SMTP 配置:\n");
    console.log("Gmail:");
    console.log("  Host: smtp.gmail.com");
    console.log("  Port: 587");
    console.log("  需要开启: 两步验证 + 应用专用密码\n");
    console.log("QQ 邮箱:");
    console.log("  Host: smtp.qq.com");
    console.log("  Port: 465 或 587");
    console.log("  需要开启: POP3/SMTP 服务 + 授权码\n");
    console.log("163 邮箱:");
    console.log("  Host: smtp.163.com");
    console.log("  Port: 465 或 587");
    console.log("  需要开启: POP3/SMTP 服务 + 授权码\n");

    return false;
  }

  try {
    const testCode = "123456";
    console.log(`📨 发送测试验证码: ${testCode}...\n`);

    await sendVerificationCode(testEmail, testCode);

    console.log("✅ 邮件发送成功！");
    console.log(`\n请检查 ${testEmail} 的收件箱（或垃圾邮件文件夹）`);
    console.log("\n如果收到邮件，说明 SMTP 配置正确！");
    console.log("可以将 DEV_MODE 设为 false 启用正式模式。\n");

    return true;
  } catch (error) {
    console.error("❌ 邮件发送失败:", error);
    console.log("\n常见问题解决方案:");
    console.log("1. 检查邮箱和密码是否正确");
    console.log("2. Gmail 需要使用'应用专用密码'，不是登录密码");
    console.log("3. QQ/163 邮箱需要开启 POP3/SMTP 服务");
    console.log("4. 检查网络连接和防火墙设置");
    console.log("5. 尝试更换端口号 (587/465)\n");

    return false;
  }
}

const testEmailArg = process.argv[2];
if (testEmailArg) {
  process.env.TEST_EMAIL = testEmailArg;
}

testEmail()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch(() => process.exit(1));
