# 🚨 紧急修复：角色聊天500错误

## 问题描述

所有角色（除第一个外）聊天时出现 `500 Internal Server Error`

## 根本原因

数据库 `chat_sessions` 表的 `character_avatar` 字段长度只有 **10字符**，
无法存储完整的图片路径如 `/characters/cool-senior.png` (29字符)

---

## 🔧 解决方案（二选一）

### 方案1：在 Neon 控制台执行（推荐）

1. 打开浏览器访问：**https://console.neon.tech**
2. 登录你的账户
3. 选择项目 `virtual-lover` (或你的数据库名)
4. 点击左侧菜单 **"SQL Editor"**
5. 复制粘贴以下SQL：

```sql
-- 修复 character_avatar 字段长度
ALTER TABLE chat_sessions
ALTER COLUMN character_avatar TYPE varchar(500);

-- 验证修改成功
SELECT column_name, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'chat_sessions'
AND column_name = 'character_avatar';
```

6. 点击 **"Run"** 执行
7. 查看结果应该显示：`character_avatar | 500`

### 方案2：使用命令行

如果你安装了 PostgreSQL 客户端工具：

```bash
# ⚠️ 请将下面的连接字符串替换为你自己的数据库URL
psql "postgresql://your_username:your_password@your-host:5432/your_database?sslmode=require" -c "ALTER TABLE chat_sessions ALTER COLUMN character_avatar TYPE varchar(500);"
```

---

## ✅ 验证修复

执行完SQL后，重启开发服务器：

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev
```

然后测试任意角色（如叶清寒、苏念晴等），应该能正常聊天了！

---

## 📊 修复前后对比

| 项目       | 修复前          | 修复后              |
| ---------- | --------------- | ------------------- |
| 字段长度   | 10 字符         | 500 字符            |
| 可存储内容 | 🎓 (emoji)      | /characters/xxx.png |
| 可用角色数 | 1个             | 全部8个 ✅          |
| 错误率     | 87.5% (7/8失败) | 0% ✅               |

---

## 🎯 预期结果

- ✅ 所有8个角色都能正常发送问候语
- ✅ 聊天功能完全正常
- ✅ 心灵空间显示正确的角色头像
- ✅ 不再出现 500 Internal Server Error

---

**⚠️ 重要提示：**

- 这个修改只会影响新创建的会话记录
- 已有的旧数据（存储了短emoji）不受影响
- 如果遇到问题，请查看终端中的详细错误日志
