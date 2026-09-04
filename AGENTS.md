# AGENTS.md

## 项目概览
虚拟恋人聊天产品 - 仿微信界面的 AI 恋爱聊天应用，支持选择男性/女性角色，支持多模态互动（文字流式回复 + TTS 语音 + AI 生图）。

## 技术栈
- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **AI SDK**: coze-coding-dev-sdk (LLM + TTS + ImageGeneration)

## 目录结构
```
src/
├── app/
│   ├── page.tsx                    # 角色选择首页
│   ├── chat/[characterId]/page.tsx  # 聊天页面（仿微信）
│   ├── api/
│   │   ├── chat/route.ts           # LLM 流式对话 (SSE)
│   │   ├── tts/route.ts            # TTS 语音合成
│   │   └── generate-image/route.ts # AI 图片生成
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── characters.ts               # 角色数据定义
│   └── utils.ts
└── components/ui/                   # shadcn/ui 组件
```

## 核心功能
1. **性别选择**: 首页两步流程 - 先选性别（找男朋友/找女朋友），再选角色
2. **角色选择**: 8 个预设角色
   - 男性：温柔学长/傲娇少爷/阳光暖男/神秘文艺
   - 女性：甜美学妹/高冷学姐/治愈少女/元气偶像
3. **流式对话**: LLM SSE 流式输出，打字机效果
4. **TTS 语音**: 每条回复异步生成语音，挂载播放控件（不同角色不同声线）
5. **AI 生图**: LLM 通过 [SELFIE:] 标记触发图片生成
6. **仿微信 UI**: 绿色/白色气泡，底部输入框，顶部角色信息

## 开发命令
- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm start` - 启动生产服务器
- `pnpm ts-check` - TypeScript 类型检查
- `pnpm lint` - ESLint 检查

## 设计规范
- 整体色调偏暖、浪漫，符合乙女游戏审美
- 主色：樱花粉 #F8C8D4
- 背景色：奶油白 #FFF8F0
- 聊天气泡：微信绿 #95EC69（用户）/ 白色（AI）
- 详见 DESIGN.md

## 注意事项
- 不做用户注册/登录，不做数据持久化（刷新即清空）
- 生图由 LLM 自主决定触发，不接受用户强制指令
- 所有 AI 调用通过 coze-coding-dev-sdk 后端调用
