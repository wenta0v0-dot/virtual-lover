#!/bin/bash
# 🔒 上传前安全检查脚本
# 运行: bash pre-upload-check.sh

echo "==================================="
echo "🔒 上传前安全检查"
echo "==================================="
echo ""

# 检查1: 确认.env文件未被追踪
echo "[1/4] 检查敏感文件..."
if git ls-files | grep -q ".env.local"; then
    echo "❌ 危险: .env.local 将被提交！立即停止！"
    exit 1
else
    echo "✅ .env.local 已被排除"
fi

# 检查2: 搜索真实API密钥
echo ""
echo "[2/4] 扫描API密钥..."
if grep -r "fc44945077\|a1af3eda26\|npg_C6AKgf0nBPGN\|b2a3e142-782d" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.md" .; then
    echo "❌ 发现真实API密钥！请清理后再上传！"
    exit 1
else
    echo "✅ 未发现API密钥泄露"
fi

# 检查3: 验证.gitignore配置
echo ""
echo "[3/4] 检查.gitignore..."
if grep -q "\.env.*" .gitignore; then
    echo "✅ .env 文件已被忽略规则覆盖"
else
    echo "⚠️  建议添加 .env 忽略规则"
fi

# 查看将要提交的文件统计
echo ""
echo "[4/4] 提交统计..."
echo "文件总数: $(git ls-files | wc -l)"
echo "最近提交: $(git log --oneline -1)"

echo ""
echo "==================================="
echo "✅ 所有检查通过！可以安全上传"
echo "==================================="
echo ""
echo "下一步:"
echo "1. 在 GitHub 创建新仓库: https://github.com/new"
echo "2. 运行: git remote add origin <你的仓库地址>"
echo "3. 运行: git push -u origin main"
echo ""