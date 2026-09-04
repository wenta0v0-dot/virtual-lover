# 角色头像图片

当前使用 SVG 占位头像，你可以替换为真实的 PNG/JPG 图片。

## 当前占位头像

✅ 所有8个角色的 SVG 占位图已就绪

## 替换为真实图片

如果你想使用真实的插画头像，请：

1. **准备图片**（推荐规格）
   - 尺寸：200×200px 或 400×400px
   - 格式：PNG（透明背景）或 JPG
   - 风格：二次元/动漫风格，符合角色设定

2. **替换文件**
   - 将 `.svg` 文件替换为同名的 `.png` 或 `.jpg`
   - 或修改 [characters.ts](../../src/lib/characters.ts) 中的 `avatarImage` 路径

3. **更新配置**（如果改变文件名）
   ```typescript
   // 在 characters.ts 中修改
   avatarImage: "/characters/gentle-senpai.png", // 改为你的文件名
   ```

## 角色列表

| 文件名               | 角色   | 代表色     |
| -------------------- | ------ | ---------- |
| `gentle-senpai.svg`  | 陆温言 | 💙 #A8D8EA |
| `tsundere.svg`       | 顾凌川 | 💜 #C8A8E8 |
| `sunny.svg`          | 林沐阳 | 🧡 #FFD580 |
| `mysterious.svg`     | 沈墨白 | 🔵 #B8C8D8 |
| `sweet-junior.svg`   | 苏念晴 | 💗 #FFB6C1 |
| `cool-senior.svg`    | 叶清寒 | 💜 #D8BFD8 |
| `healing-girl.svg`   | 林小溪 | 💚 #C8E6C9 |
| `energetic-idol.svg` | 陈星瑶 | 🤍 #FFE4B5 |

## 注意事项

- ✅ 系统会优雅降级：如果图片加载失败，会自动显示 Emoji 头像
- ✅ SVG 占位图已包含渐变背景和 Emoji，视觉效果良好
- 🔧 未来可随时替换为高质量插画
