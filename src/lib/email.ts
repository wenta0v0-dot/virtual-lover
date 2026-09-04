import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP 环境变量未配置，请设置 SMTP_HOST、SMTP_USER、SMTP_PASS",
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendVerificationCode(email: string, code: string) {
  const appName = process.env.APP_NAME || "虚拟恋人";
  const fromEmail = process.env.SMTP_USER;

  if (!fromEmail) {
    throw new Error("SMTP_USER 环境变量未设置");
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"${appName}" <${fromEmail}>`,
    to: email,
    subject: `【${appName}】邮箱验证码`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #3D2C2E;">
        <div style="background: linear-gradient(135deg, #F8C8D4 0%, #FFB6C1 100%); padding: 40px 20px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">${appName}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">邮箱验证码</p>
        </div>
        <div style="background: #fff; padding: 40px 30px; border-radius: 0 0 16px 16px; border: 1px solid #EDE5E0; border-top: none;">
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">你好，</p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 32px;">你正在进行邮箱验证，请使用以下验证码完成操作：</p>
          <div style="background: #FFF8F0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #F8C8D4; font-family: 'Courier New', monospace;">${code}</span>
          </div>
          <p style="font-size: 13px; color: #9B8A8E; line-height: 1.6; margin: 0 0 8px;">此验证码将在 <strong style="color: #3D2C2E;">10 分钟</strong> 后失效。</p>
          <p style="font-size: 13px; color: #9B8A8E; line-height: 1.6; margin: 0;">如非你本人操作，请忽略此邮件。</p>
        </div>
        <div style="text-align: center; padding: 24px 0;">
          <p style="font-size: 12px; color: #9B8A8E; margin: 0;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      </div>
    `,
  });
}
