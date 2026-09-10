const http = require("http");

const BASE_URL = "http://localhost:5000";
let cookies = "";

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path: path,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(cookies && { Cookie: cookies }),
          ...(options.headers || {}),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          // 保存cookie
          const setCookie = res.headers["set-cookie"];
          if (setCookie) {
            cookies = setCookie.map((c) => c.split(";")[0]).join("; ");
            console.log("   🍪 收到Cookie:", cookies.substring(0, 50) + "...");
          }
          resolve({
            statusCode: res.statusCode,
            body: body,
            headers: res.headers,
          });
        });
      },
    );

    req.on("error", reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function testLoginFlow() {
  console.log("🔬 测试完整登录流程...\n");

  // 1. 测试发送验证码
  console.log("1️⃣  发送验证码...");
  const phone =
    "138" + String(Math.floor(Math.random() * 100000000)).padStart(8, "0");
  const sendCodeRes = await makeRequest("/api/auth/send-code", {
    method: "POST",
    body: { phone },
  });
  console.log("   状态码:", sendCodeRes.statusCode);

  const sendCodeData = JSON.parse(sendCodeRes.body);
  if (sendCodeData.devCode) {
    console.log("   开发模式验证码:", sendCodeData.devCode);

    // 2. 测试验证码登录
    console.log("\n2️⃣  验证码登录...");
    const verifyRes = await makeRequest("/api/auth/verify-code", {
      method: "POST",
      body: { phone, code: sendCodeData.devCode },
    });
    console.log("   状态码:", verifyRes.statusCode);
    console.log("   响应:", verifyRes.body.substring(0, 100));

    if (verifyRes.statusCode === 200) {
      console.log("   ✅ 登录成功！");
      console.log("   🍪 当前Cookie:", cookies.substring(0, 50) + "...");

      // 3. 测试获取当前用户
      console.log("\n3️⃣  获取当前用户...");
      const meRes = await makeRequest("/api/auth/me");
      console.log("   状态码:", meRes.statusCode);
      console.log("   响应:", meRes.body.substring(0, 100));

      if (meRes.statusCode === 200) {
        console.log("   ✅ 认证正常！");
      } else {
        console.log("   ❌ 认证失败！");
      }

      // 4. 测试聊天API
      console.log("\n4️⃣  测试聊天API...");
      const chatRes = await makeRequest("/api/chat", {
        method: "POST",
        body: {
          messages: [{ role: "user", content: "你好" }],
          characterId: "test",
          characterName: "Test",
          characterAvatar: "",
        },
      });
      console.log("   状态码:", chatRes.statusCode);

      if (chatRes.statusCode === 200) {
        console.log("   ✅ 聊天API正常工作！");
      } else if (chatRes.statusCode === 401) {
        console.log("   ❌ 聊天API返回401 - Cookie未正确传递！");
        console.log("   💡 可能原因：");
        console.log('      1. fetch请求缺少 credentials: "include"');
        console.log("      2. Cookie设置有问题（sameSite/secure）");
        console.log("      3. 浏览器阻止了Cookie");
      } else {
        console.log("   ⚠️  聊天API返回:", chatRes.statusCode);
        console.log("   响应:", chatRes.body.substring(0, 100));
      }
    } else {
      console.log("   ❌ 登录失败:", verifyRes.body);
    }
  } else {
    console.log("   响应:", sendCodeRes.body);
  }
}

testLoginFlow().catch(console.error);
