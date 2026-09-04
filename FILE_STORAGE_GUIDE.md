# 📁 文件存储系统使用指南

## 🎯 系统架构

```
用户上传 → API验证 → 本地存储 → 返回URL → 数据库保存路径
```

### 当前实现：本地文件存储

**存储位置：** `./public/uploads/avatars/`

**访问方式：**

- 开发环境: `http://localhost:5000/uploads/avatars/filename.jpg`
- 生产环境: `https://yourdomain.com/uploads/avatars/filename.jpg`

---

## ✨ 功能特性

### 1. **安全上传**

- ✅ 文件类型限制（仅允许图片）
- ✅ 大小限制（最大5MB）
- ✅ 自动生成唯一文件名
- ✅ 防止路径遍历攻击

### 2. **智能管理**

- ✅ 按用户ID组织文件
- ✅ 时间戳命名
- ✅ 随机字符防冲突

### 3. **数据库优化**

- ✅ 只存URL路径，不存base64
- ✅ 节省数据库空间
- ✅ 提升查询性能

---

## 🚀 使用方法

### 开发环境测试

1. **启动服务器**

```bash
pnpm dev
```

2. **访问个人设置**

- 打开 http://localhost:5000/profile
- 点击 "⚙️ 个人设置"
- 上传头像图片

3. **查看上传的文件**

```bash
ls -la public/uploads/avatars/
# 应该看到类似:
# 1_1704321000000_a1b2c3d4.jpg
```

4. **直接访问图片**

```
http://localhost:5000/uploads/avatars/1_1704321000000_a1b2c3d4.jpg
```

---

## 📦 生产环境部署

### 方案A：单服务器部署（当前方案）

#### 1. 创建目录并授权

```bash
# Linux/Mac
sudo mkdir -p /var/www/yourapp/public/uploads/avatars
sudo chown -R www-data:www-data /var/www/yourapp/public/uploads
sudo chmod -R 755 /var/www/yourapp/public/uploads

# Windows (IIS)
mkdir C:\inetpub\wwwroot\yourapp\public\uploads\avatars
icacls C:\inetpub\wwwroot\yourapp\public\uploads /grant IUSR:(OI)(CI)F
```

#### 2. 配置Nginx/Apache静态文件服务

```nginx
# Nginx配置示例
server {
    listen 80;
    server_name yourdomain.com;

    location /uploads/ {
        alias /var/www/yourapp/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # 其他Next.js代理配置...
}
```

#### 3. 设置定期备份

```bash
# 添加到crontab (每天凌晨3点备份)
0 3 * * * tar -czf /backup/uploads_$(date +\%Y\%m\%d).tar.gz /var/www/yourapp/public/uploads/
```

#### 4. 监控磁盘空间

```bash
# 查看占用空间
du -sh /var/www/yourapp/public/uploads/

# 设置磁盘告警（超过80%时通知）
df -h | awk 'NR==2 && int($5) > 80 {print "警告: 磁盘使用率 " $5}'
```

---

### 方案B：云对象存储（推荐大规模应用）

当用户量增长后，建议迁移到云存储：

#### 1. 选择云服务商

| 服务商            | 免费额度 | 价格      | 特点       |
| ----------------- | -------- | --------- | ---------- |
| **阿里云OSS**     | 5GB/月   | ¥0.12/GB  | 国内速度快 |
| **腾讯云COS**     | 50GB/月  | ¥0.118/GB | 免费额度大 |
| **AWS S3**        | 5GB/月   | $0.023/GB | 全球CDN    |
| **Cloudflare R2** | 10GB/月  | 免费      | 无流量费   |

#### 2. 迁移步骤（以阿里云为例）

```typescript
// 1. 安装SDK
npm install ali-oss

// 2. 修改 src/lib/storage.ts
import OSS from 'ali-oss';

const client = new OSS({
  region: 'oss-cn-hangzhou',
  accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET!,
  bucket: 'your-bucket-name',
});

class CloudStorage {
  async saveAvatar(userId, buffer, name, mimeType) {
    const filename = `${userId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.${this.getExtension(mimeType)}`;

    await client.put(`avatars/${filename}`, buffer, {
      headers: { 'Content-Type': mimeType }
    });

    return {
      success: true,
      url: `https://your-bucket.oss-cn-hangzhou.aliyuncs.com/avatars/${filename}`,
      filename: `avatars/${filename}`
    };
  }
}
```

#### 3. 更新前端代码（无需改动！）

```
✅ 前端代码完全兼容，只需修改后端storage.ts
```

---

## 🔧 高级配置

### 环境变量配置

在 `.env.local` 中添加：

```bash
# 存储模式: local | s3 | oss | cos
STORAGE_MODE=local

# 本地存储配置
UPLOAD_DIR=./public/uploads
BASE_URL=http://localhost:5000

# 云存储配置（未来使用）
# AWS_S3_BUCKET=xxx
# AWS_REGION=us-east-1
# ALI_OSS_BUCKET=xxx
# ALI_OSS_REGION=oss-cn-hangzhou
```

### 图片处理（可选）

安装sharp进行自动压缩：

```bash
npm install sharp
```

```typescript
// 在 storage.ts 中添加压缩功能
import sharp from 'sharp';

async compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(400, 400, { fit: 'cover' }) // 限制尺寸
    .jpeg({ quality: 80 })              // 压缩质量
    .toBuffer();
}
```

---

## ⚠️ 注意事项

### 安全性

- ✅ 已禁止上传可执行文件
- ✅ 已限制文件大小
- ✅ 已随机化文件名
- ⚠️ 建议生产环境启用HTTPS
- ⚠️ 建议配置CORS策略

### 性能优化

- ✅ 已支持浏览器缓存（30天）
- ⚠️ 建议配置CDN加速
- ⚠️ 建议对大图进行压缩

### 数据保护

- ✅ 已加入.gitignore防止误提交
- ⚠️ 必须配置定期备份
- ⚠️ 考虑用户删除账户时的文件清理

---

## 🐛 常见问题

### Q1: 上传失败提示"目录不存在"？

**A:** 确保 `public/uploads/avatars/` 目录存在且有写入权限。

### Q2: 图片显示404？

**A:** 检查：

1. 文件是否真的存在于 `public/uploads/avatars/`
2. Nginx/Apache是否正确配置了静态文件服务
3. 文件权限是否允许读取

### Q3: 如何清理未使用的头像？

**A:** 可以编写定时任务：

```sql
-- 查找孤儿文件（在磁盘上但不在数据库中）
-- 然后批量删除
```

### Q4: 能否支持视频上传？

**A:** 可以扩展，但需要：

1. 增加大小限制（视频通常很大）
2. 使用视频转码服务
3. 考虑使用专门的视频CDN

---

## 📈 扩展建议

### 短期优化（本周完成）

- [ ] 添加图片压缩（减少50-70%体积）
- [ ] 实现懒加载（提升页面速度）
- [ ] 添加图片水印（版权保护）

### 中期规划（本月完成）

- [ ] 支持多尺寸缩略图
- [ ] 实现图片CDN加速
- [ ] 添加存储用量监控面板

### 长期目标（下季度）

- [ ] 迁移到云对象存储
- [ ] 支持图片审核（AI检测违规内容）
- [ ] 实现分布式文件系统

---

## 💡 最佳实践总结

1. **永远不要将base64存入数据库** ← 你已经做到了！✅
2. **使用专业对象存储服务处理大量文件**
3. **实施严格的文件类型和大小检查**
4. **定期备份和监控存储使用情况**
5. **考虑CDN加速全球访问**

---

**🎉 恭喜！你的项目现在已经具备了生产级别的文件存储能力！**
