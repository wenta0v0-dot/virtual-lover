interface SmsConfig {
  accessKeyId: string;
  accessKeySecret: string;
  signName: string;
  templateCode: string;
}

function getSmsConfig(): SmsConfig {
  const accessKeyId = process.env.SMS_ACCESS_KEY_ID || "";
  const accessKeySecret = process.env.SMS_ACCESS_KEY_SECRET || "";
  const signName = process.env.SMS_SIGN_NAME || "虚拟恋人";
  const templateCode = process.env.SMS_TEMPLATE_CODE || "";

  if (!accessKeyId || !accessKeySecret) {
    console.warn("[SMS] 短信服务未配置，使用开发模式");
    return {
      accessKeyId,
      accessKeySecret,
      signName,
      templateCode,
    };
  }

  return { accessKeyId, accessKeySecret, signName, templateCode };
}

export async function sendSmsCode(phone: string, code: string): Promise<void> {
  const config = getSmsConfig();

  if (!config.accessKeyId || !config.accessKeySecret) {
    console.log(`[SMS] 开发模式 - 手机号：${phone}，验证码：${code}`);
    return;
  }

  try {
    console.log(`[SMS] 发送验证码到 ${phone}`);

    const response = await fetch("https://dysmsapi.aliyuncs.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        PhoneNumbers: phone,
        SignName: config.signName,
        TemplateCode: config.templateCode,
        TemplateParam: JSON.stringify({ code }),
      }),
    });

    if (!response.ok) {
      throw new Error(`短信发送失败：${response.statusText}`);
    }

    const result = await response.json();

    if (result.Code !== "OK") {
      throw new Error(result.Message || "短信发送失败");
    }

    console.log(`[SMS] 验证码已成功发送到 ${phone}`);
  } catch (error) {
    console.error("[SMS] 发送失败:", error);
    throw error;
  }
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}
