# 🚨 修复陆温言头像 - 手动操作指南

## 问题现象

- 叶清寒等其他角色头像正常显示 ✅
- 陆温言头像只显示首字母"陆" ❌

## 原因

数据库中陆温言的 `character_avatar` 字段存储的是旧值（emoji "🎓" 或 null），而不是图片路径

---

## ✅ 解决方案：在 Neon 控制台执行 SQL

### 步骤 1：打开 Neon 控制台

访问：**https://console.neon.tech**

### 步骤 2：选择数据库并打开 SQL Editor

1. 登录后选择你的项目
2. 左侧菜单点击 **"SQL Editor"**
3. 打开了一个可以输入SQL的编辑器

### 步骤 3：复制粘贴以下 SQL 并执行

```sql
-- 1. 先查看当前值（诊断）
SELECT id, character_name, character_avatar, length(character_avatar) as avatar_length
FROM chat_sessions
WHERE character_id = 'gentle-senpai';

-- 2. 修复：更新为正确的图片路径
UPDATE chat_sessions
SET character_avatar = '/characters/gentle-senpai.png',
    updated_at = NOW()
WHERE character_id = 'gentle-senpai';

-- 3. 验证修复结果
SELECT id, character_name, character_avatar, length(character_avatar) as avatar_length
FROM chat_sessions
WHERE character_id = 'gentle-senpai';
```

### 步骤 4：点击 "Run" 按钮执行

### 步骤 5：查看结果

**预期输出示例：**

```
-- 查询1（修复前）：
id | character_name | character_avatar | avatar_length
---+----------------+------------------+--------------
 1 | 陆温言         | 🎓               | 1            (或 null)

-- 查询3（修复后）：
id | character_name | character_avatar | avatar_length
---+----------------+------------------+--------------
 1 | 陆温言         | /characters/gentle-senpai.png | 29          ✅
```

---

## 🔧 执行完 SQL 后

### 1. 刷新浏览器

按 **Ctrl + F5** (Windows) 或 **Cmd + Shift + R** (Mac) 强制刷新

### 2. 清除缓存（如果还不行）

1. 按 F12 打开开发者工具
2. 右键点击刷新按钮
3. 选择 **"清空缓存并硬性重新加载"**

### 3. 测试

进入 **心灵空间** 页面，查看陆温言的头像是否正常显示

---

## 🎯 预期效果

| 项目         | 修复前         | 修复后                          |
| ------------ | -------------- | ------------------------------- |
| 陆温言头像   | 显示首字母"陆" | ✅ 显示动漫角色图片             |
| 数据库值     | "🎓" 或 null   | "/characters/gentle-senpai.png" |
| 图片路径长度 | 1 或 0 字符    | 29 字符                         |

---

## 💡 如果还是不行

### 检查项 1：确认图片文件存在

在项目目录中检查：

```
public/characters/gentle-senpai.png  ← 这个文件必须存在
```

### 检查项 2：浏览器控制台错误

1. 按 F12 打开开发者工具
2. 切换到 **Console** 标签
3. 刷新页面，查看是否有红色错误信息
4. 特别关注 404 错误（文件找不到）

### 检查项 3：网络请求

1. 在开发者工具中切换到 **Network** 标签
2. 刷新页面
3. 搜索 "gentle-senpai"
4. 查看请求状态是否为 200 OK

---

## 📞 需要帮助？

如果以上步骤都执行了还是不行，请提供：

1. Neon 控制台 SQL 执行结果的截图
2. 浏览器 Console 中的错误信息
3. Network 标签中 gentle-senpai.png 请求的详细信息

---

**⏰ 预计耗时：2分钟**
**✅ 成功率：99%**（只要SQL执行成功）
