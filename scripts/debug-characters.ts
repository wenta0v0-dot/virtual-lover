import { characters } from "../src/lib/characters";

console.log("🔍 角色配置诊断工具\n");

const issues: string[] = [];

characters.forEach((char, index) => {
  console.log(`\n${index + 1}. ${char.name} (${char.id})`);
  console.log(`   Avatar: ${char.avatar}`);
  console.log(`   AvatarImage: ${char.avatarImage}`);
  console.log(`   SystemPrompt长度: ${char.systemPrompt.length} 字符`);
  console.log(`   Greeting长度: ${char.greeting.length} 字符`);

  // 检查必要字段
  if (!char.id) issues.push(`${char.name}: 缺少 ID`);
  if (!char.name) issues.push(`${char.name}: 缺少名称`);
  if (!char.systemPrompt) issues.push(`${char.name}: 缺少系统提示词`);
  if (!char.greeting) issues.push(`${char.name}: 缺少问候语`);

  // 检查avatarImage路径
  if (char.avatarImage && !char.avatarImage.startsWith("/")) {
    issues.push(`${char.name}: avatarImage 路径应该以 / 开头`);
  }

  // 检查systemPrompt中是否有可能导致问题的内容
  if (char.systemPrompt.includes("```")) {
    issues.push(`${char.name}: systemPrompt 中包含代码块标记`);
  }

  if (char.systemPrompt.length > 2000) {
    console.log(`   ⚠️  SystemPrompt 较长 (${char.systemPrompt.length} 字符)`);
  }

  // 检查是否有特殊字符
  const specialChars = /[\x00-\x1F\x7F]/;
  if (specialChars.test(char.systemPrompt)) {
    issues.push(`${char.name}: systemPrompt 包含控制字符`);
  }
});

console.log("\n\n" + "=".repeat(50));
if (issues.length === 0) {
  console.log("✅ 所有角色配置正常！");
} else {
  console.log("❌ 发现以下问题：");
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue}`);
  });
}

// 测试API请求格式
console.log("\n\n" + "=".repeat(50));
console.log("📝 测试API请求格式：\n");

characters.slice(0, 2).forEach((char) => {
  const testRequest = {
    messages: [
      { role: "system", content: char.systemPrompt },
      { role: "user", content: char.greeting },
    ],
    characterId: char.id,
    characterName: char.name,
    characterAvatar: char.avatarImage || char.avatar,
  };

  console.log(
    `${char.name} 的请求体大小: ${JSON.stringify(testRequest).length} 字节`,
  );
});
