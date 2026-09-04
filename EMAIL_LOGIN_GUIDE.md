# 📧 邮箱登录系统完整指南

## ✅ 系统特性

您的邮箱登录系统已具备以下**企业级功能**：

### 🔐 安全特性

- ✅ **验证码速率限制** - 每个邮箱 5 次尝试，超出锁定 15 分钟
- ✅ **发送频率限制** - 60 秒内不能重复发送
- ✅ **验证码有效期** - 10 分钟自动过期
- ✅ **单次使用** - 验证码使用后立即失效
- ✅ **会话管理** - JWT Token + HttpOnly Cookie（7 天有效）

### 💡 用户体验

- ✅ **记住邮箱** - 自动保存上次输入的邮箱
- ✅ **倒计时显示** - 60 秒冷却计时器
- ✅ **实时反馈** - 剩余尝试次数、锁定倒计时
- ✅ **开发模式** - DEV_MODE=true 时直接显示验证码
- ✅ **美观 UI** - 渐变背景、动画效果、响应式设计

---

## 🚀 快速开始

### 1️⃣ 配置邮件服务

编辑 `.env.local` 文件，设置 SMTP 配置：

```bash
# Gmail 示例（推荐）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # 应用专用密码，不是登录密码！

# QQ 邮箱示例
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=your-email@qq.com
SMTP_PASS=your-authorization-code  # 授权码

# 163 邮箱示例
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=your-email@163.com
SMTP_PASS=your-authorization-code  # 授权码
```

#### 获取 Gmail 应用专用密码：

1. 访问 https://myaccount.google.com/security
2. 开启**两步验证**
3. 访问 https://myaccount.google.com/apppasswords
4. 创建应用专用密码（选择"邮件"+"Windows电脑"）
5. 复制生成的 16 位密码到 `SMTP_PASS`

#### 获取 QQ/163 授权码：

1. 登录邮箱网页版
2. 进入 **设置** → **账户** → **POP3/SMTP 服务**
3. 开启服务并按提示发送短信验证
4. 获取 16 位授权码

---

### 2️⃣ 测试邮件功能

```bash
# 方式一：使用测试脚本（替换为真实邮箱）
pnpm tsx scripts/test-email.ts your-real-email@example.com

# 方式二：检查当前配置
pnpm tsx scripts/quick-check.ts

# 方式三：完整配置检查
pnpm tsx scripts/check-config.ts
```

测试成功后，将 `DEV_MODE` 设为 `false`：

```bash
DEV_MODE=false
```

---

### 3️⃣ 启动应用

```bash
pnpm dev
```

访问 http://localhost:3000/login 开始使用！

---

## 📁 文件结构

```
src/
├── app/
│   ├── login/
│   │   └── page.tsx              # 登录页面（增强版）
│   └── api/auth/
│       ├── send-code/route.ts    # 发送验证码 API
│       ├── verify-code/route.ts  # 验证码验证 API（安全增强）
│       ├── me/route.ts           # 获取当前用户
│       └── logout/route.ts       # 登出
├── lib/
│   ├── auth.ts                   # JWT 会话管理
│   ├── email.ts                  # 邮件发送（HTML模板）
│   ├── dev-auth.ts               # 开发模式支持
│   └── rate-limit.ts             # 速率限制 ⭐新增
└── services/
    └── database.ts               # 数据库操作

scripts/
├── test-email.ts                 # 邮件发送测试 ⭐新增
├── test-db.ts                    # 数据库连接测试
├── check-config.ts               # 完整配置检查 ⭐新增
└── quick-check.ts                # 快速配置检查 ⭐新增
```

---

## 🔧 API 接口说明

### POST /api/auth/send-code

发送验证码到指定邮箱

**请求体：**

```json
{
  "email": "user@example.com"
}
```

**响应：**

```json
// 成功（开发模式）
{
  "success": true,
  "message": "验证码已生成（开发模式）",
  "devCode": "123456"
}

// 成功（生产模式）
{
  "success": true,
  "message": "验证码已发送"
}

// 失败（频率限制）
{
  "error": "发送过于频繁，请稍后再试"
}
```

---

### POST /api/auth/verify-code

验证码登录

**请求体：**

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**响应：**

```json
// 成功
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "user",
    "avatar": null
  },
  "remainingAttempts": 4
}

// 失败（验证码错误）
{
  "error": "验证码错误或已过期",
  "remainingAttempts": 4
}

// 失败（次数过多，锁定）
{
  "error": "验证次数过多，请稍后再试",
  "lockoutRemaining": 900,
  "remainingAttempts": 0
}
```

---

## 🛡️ 安全机制详解

### 速率限制规则

| 操作       | 限制            | 锁定时间 |
| ---------- | --------------- | -------- |
| 发送验证码 | 每 60 秒 1 次   | 无       |
| 验证码尝试 | 每 15 分钟 5 次 | 15 分钟  |

### 安全流程图

```
用户输入邮箱 → 检查发送频率 → [通过] → 生成验证码 → 发送邮件/显示开发码
                  ↓ [未通过]
              返回 429 错误

用户提交验证码 → 检查是否锁定 → [已锁定] → 显示倒计时
                    ↓ [未锁定]
                检查剩余次数 → [用完] → 锁定账户 15 分钟
                    ↓ [有剩余]
                验证码校验 → [成功] → 重置计数 → 登录成功
                    ↓ [失败]
                减少剩余次数 → 返回错误 + 剩余次数
```

---

## 🎨 自定义配置

### 修改验证码有效期

编辑 `src/app/api/auth/send-code/route.ts`:

```typescript
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 分钟
// 改为 5 分钟：
const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
```

### 修改尝试次数限制

编辑 `src/lib/rate-limit.ts`:

```typescript
const MAX_ATTEMPTS = 5; // 最大尝试次数
const LOCKOUT_DURATION = 15 * 60 * 1000; // 锁定时间（毫秒）
```

### 修改发送冷却时间

编辑 `src/app/api/auth/send-code/route.ts`:

```typescript
const oneMinuteAgo = new Date(Date.now() - 60 * 1000); // 60 秒
// 改为 30 秒：
const oneMinuteAgo = new Date(Date.now() - 30 * 1000);
```

### 自定义邮件模板

编辑 `src/lib/email.ts` 中的 HTML 模板，修改颜色、文字、布局等。

---

## ❓ 常见问题

### Q: 收不到验证邮件？

**A:**

1. 检查垃圾邮件文件夹
2. 确认 SMTP 配置正确（运行 `pnpm tsx scripts/test-email.ts` 测试）
3. Gmail 必须使用**应用专用密码**，不是账号密码
4. QQ/163 邮箱需要开启 POP3/SMTP 服务并获取授权码

### Q: 开发模式下验证码不显示？

**A:** 确保 `.env.local` 中设置了 `DEV_MODE=true`

### Q: 生产环境如何关闭开发模式？

**A:** 设置 `DEV_MODE=false`，并确保 SMTP 配置正确

### Q: 如何更换邮件服务商？

**A:** 修改 `.env.local` 中的 SMTP 配置即可，代码无需改动

### Q: 验证码一直提示错误？

**A:**

1. 检查是否复制了多余空格
2. 确认验证码未过期（10 分钟内）
3. 查看浏览器控制台是否有错误信息
4. 检查是否触发了速率限制（等待 15 分钟后重试）

---

## 📊 监控与日志

系统会自动记录以下日志：

```
[SendCode] 发送验证码到 xxx@xxx.com
[VerifyCode] 用户 xxx@xxx.com 验证成功/失败
[VerifyCode] 用户 xxx@xxx.com 触发速率限制
[Auth] 用户 ID: xxx 登录成功
```

可在终端或日志系统中查看。

---

## 🔄 下一步建议

1. **添加用户头像上传** - 登录后让用户设置头像
2. **添加忘记邮箱功能** - 通过备用邮箱找回
3. **多语言支持** - 国际化错误提示和邮件模板
4. **审计日志** - 记录所有登录尝试到数据库
5. **双因素认证** - 结合 TOTP 应用（如 Google Authenticator）

---

## ✨ 总结

您的邮箱登录系统现已具备：

- ✅ **生产就绪**的安全机制
- ✅ **用户体验优秀**的界面
- ✅ **易于配置**的邮件服务
- ✅ **完善**的测试工具
- ✅ **详细**的文档支持

**立即开始使用：**

1. 配置 SMTP（参考上方指南）
2. 运行测试脚本验证
3. 启动应用享受完美登录体验！

🎉 **恭喜！您拥有了一个专业级的邮箱登录系统！**
