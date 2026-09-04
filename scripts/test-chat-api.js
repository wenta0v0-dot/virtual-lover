// 测试聊天API的诊断脚本
const API_BASE = "http://localhost:3000";

async function testChatAPI(characterId, characterName) {
  console.log(`\n🧪 测试角色: ${characterName} (${characterId})`);

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: document.cookie, // 传递登录状态
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: `你是${characterName}` },
          { role: "user", content: "你好" },
        ],
        characterId,
        characterName,
        characterAvatar: `/characters/${characterId}.png`,
      }),
    });

    console.log(`   状态码: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ 错误响应: ${errorText}`);
      return false;
    }

    console.log("   ✅ 请求成功");

    // 读取流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullResponse += data.content;
            }
            if (data.error) {
              console.log(`   ⚠️ API错误:`, data.error);
            }
          } catch (e) {}
        }
      }
    }

    console.log(`   📝 响应内容: ${fullResponse.substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.log(`   ❌ 请求异常:`, error.message);
    return false;
  }
}

// 测试所有角色
const characters = [
  { id: "gentle-senpai", name: "陆温言" },
  { id: "tsundere", name: "顾凌川" },
  { id: "sunny", name: "林沐阳" },
  { id: "mysterious", name: "沈墨白" },
  { id: "sweet-junior", name: "苏念晴" },
  { id: "cool-senior", name: "叶清寒" },
  { id: "healing-girl", name: "林小溪" },
  { id: "energetic-idol", name: "陈星瑶" },
];

async function runTests() {
  console.log("🔍 开始测试所有角色的聊天API...\n");

  let successCount = 0;
  let failCount = 0;

  for (const char of characters) {
    const success = await testChatAPI(char.id, char.name);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // 避免请求过快
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 测试结果: ${successCount} 成功, ${failCount} 失败`);
}

// 在浏览器控制台中运行这个函数
window.testAllCharacters = runTests;
console.log("💡 在控制台输入 testAllCharacters() 开始测试");
