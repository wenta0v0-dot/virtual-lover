# 🚀 生产环境部署清单

## ✅ 已完成的配置

- [x] **开发者模式已关闭** (`DEV_MODE=false`)

---

## ⚠️ 需要检查和配置的项目

### 1️⃣ 邮件 SMTP 配置（必填）

**当前配置：**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com  # ❌ 需要修改
SMTP_PASS=your-app-password     # ❌ 需要修改
```

**操作步骤：**

1. 创建 Gmail 应用专用密码：
   - 登录 Google 账户 → 安全 → 两步验证 → 应用专用密码
   - 生成一个新密码（选择"邮件"类别）

2. 更新 `.env.local`：
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=你的真实邮箱@gmail.com
   SMTP_PASS=刚才生成的应用专用密码
   ```

**测试邮件功能：**

```bash
npx ts-node scripts/test-email.ts
```

---

### 2️⃣ 数据库配置（已配置 ✅）

**当前配置：**

```env
DATABASE_URL="postgresql://neondb_owner:npg_C6AKgf0nBPGN@ep-dry-silence-axyfea6t-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

✅ 看起来已经配置好了 Neon 数据库

**测试数据库连接：**

```bash
npx ts-node scripts/test-db.ts
```

---

### 3️⃣ 认证密钥（已配置 ✅）

**当前配置：**

```env
AUTH_SECRET=b2a3e142-782d-45a0-b818-a228e4509a95
```

✅ 已配置

⚠️ **安全建议**：如果这是生产环境，请确保：

- 不要将 `.env.local` 提交到 Git
- 在生产服务器上使用环境变量管理工具（如 Vercel/ Railway 的环境变量设置）

---

### 4️⃣ 智谱 AI API 密钥（已配置 ✅）

**当前配置：**

```env
ZHIPUAI_IMAGE_API_KEY=fc44945077e94868bf284529f4e0d643.iknXuxmWJT2vJKkD
ZHIPUAI_CHAT_API_KEY=a1af3eda26dc4f29b74f9d61200ad273.eCMShVma41PuJPdM
ZHIPUAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
ZHIPUAI_CHAT_MODEL=glm-5.2
```

✅ 已配置

⚠️ **注意**：请确认这些 API Key 有足够的配额

---

### 5️⃣ 应用名称（已配置 ✅）

```env
APP_NAME=虚拟恋人
```

✅ 已配置

---

## 🔧 生产环境额外配置

### Next.js 配置检查

查看 `next.config.ts` 确保以下配置正确：

```typescript
// next.config.ts
const nextConfig = {
  // 生产环境必须启用
  reactStrictMode: true,

  // 图片域名配置（如果有）
  images: {
    domains: ["your-image-cdn.com"],
  },
};
```

### 环境变量类型检查

创建 `.env.local` 后，运行类型检查：

```bash
npm run build
# 或
npm run typecheck
```

---

## 🧪 生产环境测试清单

### 基础功能测试

- [ ] **用户注册/登录**
  - [ ] 发送验证码邮件
  - [ ] 输入验证码登录
  - [ ] Session Cookie 设置正确

- [ ] **角色功能**
  - [ ] 查看预设角色列表
  - [ ] 创建自定义角色（需填写外貌描述）
  - [ ] 与角色聊天
  - [ ] 生成角色图片

- [ ] **用户功能**
  - [ ] 查看聊天历史
  - [ ] 修改个人资料
  - [ ] 上传头像

### 性能和安全测试

- [ ] **HTTPS 配置**
  - [ ] 生产环境必须使用 HTTPS
  - [ ] Cookie 的 `secure` 标志在 production 模式下自动启用

- [ ] **速率限制**
  - [ ] 图片生成 API 有速率限制（5次/分钟）
  - [ ] 邮件发送有频率限制

- [ ] **错误处理**
  - [ ] 404 页面正常显示
  - [ ] 500 错误有友好提示
  - [ ] API 错误返回正确的状态码

---

## 🚀 部署步骤

### 方案 A：Vercel 部署（推荐）

1. **安装 Vercel CLI**

   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**

   ```bash
   vercel login
   ```

3. **部署**

   ```bash
   vercel --prod
   ```

4. **设置环境变量**
   - 在 Vercel Dashboard → Settings → Environment Variables
   - 添加所有 `.env.local` 中的变量（除了 `DEV_MODE`）

### 方案 B：传统服务器部署

1. **构建项目**

   ```bash
   npm run build
   ```

2. **启动生产服务器**

   ```bash
   npm start
   ```

3. **使用 PM2 管理进程**
   ```bash
   pm2 start npm --name "virtual-lover" -- start
   pm2 save
   pm2 startup
   ```

---

## 📊 监控和日志

### 必须监控的指标

- [ ] API 响应时间
- [ ] 错误率（特别是图片生成 API）
- [ ] 数据库连接池状态
- [ ] 内存和 CPU 使用率
- [ ] 邮件发送成功率

### 日志配置

建议集成日志服务：

- **Sentry** - 错误追踪
- **LogRocket** - 用户行为记录
- **Datadog** - 全栈监控

---

## 🔐 安全检查清单

- [ ] `.env.local` 已添加到 `.gitignore`
- [ ] 所有 API 都有认证检查
- [ ] SQL 注入防护（使用 Drizzle ORM ✅）
- [ ] XSS 防护（Next.js 默认启用 ✅）
- [ ] CSRF 防护（SameSite Cookie ✅）
- [ ] 速率限制已配置
- [ ] 敏感数据不记录到日志

---

## 🆘 常见问题排查

### 问题 1：邮件发送失败

**症状**：用户收不到验证码

**解决方案**：

1. 检查 SMTP 配置是否正确
2. 确认应用专用密码有效
3. 查看 Gmail 是否拦截了邮件
4. 检查端口 587 是否被防火墙阻止

```bash
# 测试邮件
npx ts-node scripts/test-email.ts
```

### 问题 2：数据库连接失败

**症状**：无法加载用户数据或角色

**解决方案**：

1. 检查 `DATABASE_URL` 是否正确
2. 确认 Neon 数据库服务是否运行
3. 检查网络连接

```bash
# 测试数据库
npx ts-node scripts/test-db.ts
```

### 问题 3：图片生成失败

**症状**：聊天时无法生成角色图片

**解决方案**：

1. 检查智谱 AI API 密钥是否有效
2. 确认 API 配额未用完
3. 查看是否有速率限制错误

```bash
# 测试智谱AI
node scripts/test-zhipuai.js
```

### 问题 4：Session 无效

**症状**：用户频繁需要重新登录

**解决方案**：

1. 检查 `AUTH_SECRET` 是否一致（所有服务器实例）
2. 确认 Cookie 域名设置正确
3. 检查浏览器是否阻止了 Cookie

---

## 📞 技术支持

如果遇到问题，请检查：

1. **日志文件**

   ```bash
   # 开发环境
   npm run dev

   # 生产环境
   pm2 logs virtual-lover
   ```

2. **诊断脚本**

   ```bash
   npx ts-node scripts/diagnose.ts
   ```

3. **深度调试**
   ```bash
   node scripts/deep-debug.js
   ```

---

## ✨ 下一步优化建议

- [ ] 添加 Redis 缓存层
- [ ] 集成 CDN 加速静态资源
- [ ] 配置自动备份策略
- [ ] 设置告警通知（Slack/Email）
- [ ] 性能优化（图片压缩、代码分割）
- [ ] 添加单元测试和 E2E 测试
- [ ] CI/CD 自动化部署流程

---

**最后更新**: 2025-09-05
**配置版本**: v1.0-production
