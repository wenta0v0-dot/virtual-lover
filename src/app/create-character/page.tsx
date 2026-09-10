"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import UserMenu from "@/components/UserMenu";
import ImageToPromptAssistant from "@/components/ImageToPromptAssistant";
import AvatarSystem from "@/components/AvatarSystem";
import { useAuth } from "@/hooks/useAuth";

interface FormData {
  name: string;
  title: string;
  tags: string[];
  gender: "male" | "female";
  appearance: string;
  systemPrompt: string;
  greeting: string;
  avatarImage: string | null;
  color: string;
  status: string;
}

const PRESET_COLORS = [
  "#FFB6C1", // 粉色
  "#A8D8EA", // 蓝色
  "#C8E6C9", // 绿色
  "#FFD580", // 橙色
  "#D8BFD8", // 紫色
  "#B8C8D8", // 灰蓝
  "#FFE4B5", // 浅橙
  "#F0E68C", // 卡其
];

const GENDER_OPTIONS = [
  { value: "female" as const, label: "女性角色", emoji: "👩" },
  { value: "male" as const, label: "男性角色", emoji: "👨" },
];

const TAG_SUGGESTIONS = [
  "温柔",
  "高冷",
  "活泼",
  "内向",
  "傲娇",
  "甜美",
  "成熟",
  "可爱",
  "神秘",
  "阳光",
  "文艺",
  "元气",
  "腹黑",
  "呆萌",
  "御姐",
  "暖男",
  "毒舌",
  "治愈",
];

const MAX_CHARACTERS_PER_GENDER = 4;

export default function CreateCharacterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth(true); // requireAuth = true

  // ✅ 所有useState必须在条件返回之前！
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [existingCharacters, setExistingCharacters] = useState<{
    male: number;
    female: number;
  }>({ male: 0, female: 0 });
  const [limitReached, setLimitReached] = useState<{
    male: boolean;
    female: boolean;
  }>({ male: false, female: false });

  const initialGender =
    (searchParams.get("gender") as "male" | "female") || "female";

  const [formData, setFormData] = useState<FormData>({
    name: "",
    title: "",
    tags: [],
    gender: initialGender,
    appearance: "",
    systemPrompt: "",
    greeting: "",
    avatarImage: null,
    color: initialGender === "male" ? "#A8D8EA" : "#FFB6C1",
    status: "在线",
  });

  // 加载用户已创建的角色数量
  useEffect(() => {
    async function loadExistingCharacters() {
      if (!user) return;

      try {
        const response = await fetch("/api/characters/custom", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const characters = data.characters || [];
          const maleCount = characters.filter(
            (c: { gender?: string }) => c.gender === "male",
          ).length;
          const femaleCount = characters.filter(
            (c: { gender?: string }) => c.gender === "female",
          ).length;

          setExistingCharacters({ male: maleCount, female: femaleCount });
          setLimitReached({
            male: maleCount >= MAX_CHARACTERS_PER_GENDER,
            female: femaleCount >= MAX_CHARACTERS_PER_GENDER,
          });

          console.log("[Create-Character] 已有角色:", {
            male: maleCount,
            female: femaleCount,
          });
        }
      } catch (error) {
        console.error("[Create-Character] 加载失败:", error);
      }
    }

    loadExistingCharacters();
  }, [user]);

  // ✅ 条件返回放在所有Hooks之后
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F8C8D4] mx-auto mb-4"></div>
          <p className="text-[#9B8A8E]">正在检查登录状态...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleInputChange = (
    field: keyof FormData,
    value: string | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleAIPromptsApply = (prompts: {
    appearance: string;
    tags: string[];
    systemPrompt: string;
    name: string;
    title: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      name: prompts.name || prev.name,
      title: prompts.title || prev.title,
      tags: [...new Set([...prev.tags, ...prompts.tags])],
      appearance: prompts.appearance || prev.appearance,
      systemPrompt: prompts.systemPrompt || prev.systemPrompt,
    }));

    console.log("[Create-Character] Applied AI prompts:", {
      name: prompts.name,
      title: prompts.title,
      tagsCount: prompts.tags.length,
    });
  };

  const handleImageUpload = (file: File) => {
    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件");
      return;
    }

    // 检查文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError("图片大小不能超过5MB");
      return;
    }

    // 转换为base64或使用URL.createObjectURL
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        avatarImage: event.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const generateSystemPrompt = () => {
    const { name, gender, appearance, tags } = formData;

    const genderText = gender === "female" ? "女" : "男";
    const tagText = tags.length > 0 ? tags.join("、") : "独特";

    return `你是${name}，一个${genderText}性虚拟角色。你的性格特点是${tagText}。
${appearance ? `你的外貌特征：${appearance}` : ""}

对话规则：
1. 保持角色性格的一致性，展现出${tagText}的特质
2. 说话自然流畅，像真实的聊天一样
3. 回复简洁有力，每次回复2-4句话
4. 不要使用括号描述动作或表情
5. 根据对方的情绪和话题做出合适的回应

关于发照片：
**仅在用户明确要求你发照片或自拍时**（比如对方说"发张照片"、"拍一张"、"让我看看你"、"想看你"等），才在回复末尾加上标记：
[SELFIE:场景描述]
**重要：不要主动触发！不要在对话中自发添加此标记！只在被明确要求时才发送。**`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 验证必填字段
    if (!formData.name.trim()) {
      setError("请输入角色名称");
      return;
    }
    if (!formData.systemPrompt.trim()) {
      setError("请输入人物设定");
      return;
    }
    if (!formData.greeting.trim()) {
      setError("请输入开场白");
      return;
    }
    if (!formData.appearance.trim()) {
      setError("请输入外貌描述（用于生成角色图片）");
      return;
    }

    // 检查创建数量限制
    if (formData.gender === "male" && limitReached.male) {
      setError(
        `已达到男朋友创建上限（${MAX_CHARACTERS_PER_GENDER}个），无法继续创建`,
      );
      return;
    }
    if (formData.gender === "female" && limitReached.female) {
      setError(
        `已达到女朋友创建上限（${MAX_CHARACTERS_PER_GENDER}个），无法继续创建`,
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/characters/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          credentials: "include",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "创建失败");
      }

      console.log("[Create-Character] 创建成功:", data.character);

      // 跳转到新角色的聊天页面
      router.push(`/chat/${data.character.id}`);
    } catch (err) {
      console.error("[Create-Character] 错误:", err);
      setError(err instanceof Error ? err.message : "创建失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#EDE5E0]/50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-[#F5F0EB] rounded-lg transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#9B8A8E]"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-[#3D2C2E]">
                创建自定义角色
              </h1>
            </div>

            <UserMenu />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 错误提示 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* AI助手入口 */}
          <div className="bg-gradient-to-r from-[#A8D8EA]/10 via-[#F8C8D4]/10 to-[#FFB6C1]/10 rounded-2xl p-6 border border-[#EDE5E0]/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#3D2C2E] mb-1 flex items-center gap-2">
                  <span>✨</span> AI智能辅助
                </h3>
                <p className="text-sm text-[#9B8A8E]">
                  上传参考图片，AI自动生成角色设定，快速创建理想角色
                </p>
              </div>
              <ImageToPromptAssistant onApply={handleAIPromptsApply} />
            </div>
          </div>

          {/* 基本信息 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EDE5E0] space-y-4">
            <h2 className="text-lg font-semibold text-[#3D2C2E] flex items-center gap-2">
              <span>📝</span> 基本信息
            </h2>

            {/* 角色名称 */}
            <div>
              <label className="block text-sm font-medium text-[#3D2C2E] mb-2">
                角色名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="给你的角色起个名字..."
                className="w-full h-11 px-4 bg-[#F5F0EB]/50 border border-[#EDE5E0] rounded-xl text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-2 focus:ring-[#F8C8D4]/20 outline-none transition-all"
                maxLength={50}
              />
            </div>

            {/* 角色标题 */}
            <div>
              <label className="block text-sm font-medium text-[#3D2C2E] mb-2">
                角色标题
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="例如：温柔学姐、神秘少年..."
                className="w-full h-11 px-4 bg-[#F5F0EB]/50 border border-[#EDE5E0] rounded-xl text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-2 focus:ring-[#F8C8D4]/20 outline-none transition-all"
                maxLength={100}
              />
            </div>

            {/* 性别选择 */}
            <div>
              <label className="block text-sm font-medium text-[#3D2C2E] mb-2">
                性别
              </label>
              <div className="grid grid-cols-2 gap-3">
                {GENDER_OPTIONS.map((option) => {
                  const isMale = option.value === "male";
                  const count = isMale
                    ? existingCharacters.male
                    : existingCharacters.female;
                  const isLimitReached = isMale
                    ? limitReached.male
                    : limitReached.female;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        !isLimitReached &&
                        handleInputChange("gender", option.value)
                      }
                      disabled={isLimitReached}
                      className={`p-4 rounded-xl border-2 transition-all relative ${
                        formData.gender === option.value
                          ? "border-[#F8C8D4] bg-[#F8C8D4]/10"
                          : "border-[#EDE5E0] hover:border-[#F8C8D4]/50"
                      } ${isLimitReached ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="text-2xl mb-1">{option.emoji}</div>
                      <div className="text-sm font-medium text-[#3D2C2E]">
                        {option.label}
                      </div>
                      <div className="mt-1 text-xs text-[#9B8A8E]">
                        {count} / {MAX_CHARACTERS_PER_GENDER} 已创建
                      </div>

                      {isLimitReached && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                          已满
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-[#3D2C2E] mb-2">
                性格标签
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#F8C8D4]/20 text-[#3D2C2E] rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                placeholder="输入标签后按回车添加..."
                className="w-full h-11 px-4 bg-[#F5F0EB]/50 border border-[#EDE5E0] rounded-xl text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-2 focus:ring-[#F8C8D4]/20 outline-none transition-all"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs text-[#9B8A8E]">推荐：</span>
                {TAG_SUGGESTIONS.slice(0, 8).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="text-xs px-2 py-1 bg-[#F5F0EB] text-[#9B8A8E] rounded-full hover:bg-[#F8C8D4]/30 hover:text-[#3D2C2E] transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 颜色选择 */}
            <div>
              <label className="block text-sm font-medium text-[#3D2C2E] mb-2">
                主题颜色
              </label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleInputChange("color", color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      formData.color === color
                        ? "border-[#3D2C2E] scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 外貌与形象 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EDE5E0] space-y-4">
            <h2 className="text-lg font-semibold text-[#3D2C2E] flex items-center gap-2">
              <span>🎨</span> 外貌与形象
            </h2>

            {/* 头像系统 */}
            <div>
              <label className="block text-sm font-medium text-[#3D2C2E] mb-2">
                角色头像 <span className="text-red-500">*</span>
              </label>
              <AvatarSystem
                gender={formData.gender}
                selectedAvatar={formData.avatarImage}
                characterTags={formData.tags}
                appearance={formData.appearance}
                onSelect={(url) =>
                  setFormData((prev) => ({ ...prev, avatarImage: url }))
                }
                onCustomUpload={handleImageUpload}
              />
            </div>

            {/* 外貌描述 */}
            <div>
              <label className="block text-sm font-medium text-[#3D2C2E] mb-2">
                外貌描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.appearance}
                onChange={(e) =>
                  handleInputChange("appearance", e.target.value)
                }
                placeholder="详细描述角色的外貌特征（必填，用于AI生成角色图片），例如：黑色长发扎低马尾，大眼睛圆脸，穿奶白色针织开衫和百褶裙，气质甜美可爱..."
                rows={3}
                className="w-full px-4 py-3 bg-[#F5F0EB]/50 border border-[#EDE5E0] rounded-xl text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-2 focus:ring-[#F8C8D4]/20 outline-none transition-all resize-none"
                maxLength={500}
              />
              <p className="mt-2 text-xs text-[#9B8A8E]">
                💡
                详细的描述能让AI更准确地生成角色的照片，包括发型、五官、服装、气质等
              </p>
            </div>
          </div>

          {/* 人物设定 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EDE5E0] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3D2C2E] flex items-center gap-2">
                <span>🧠</span> 人物设定 <span className="text-red-500">*</span>
              </h2>
              <button
                type="button"
                onClick={() =>
                  handleInputChange("systemPrompt", generateSystemPrompt())
                }
                className="text-sm px-3 py-1 bg-[#F8C8D4]/20 text-[#3D2C2E] rounded-lg hover:bg-[#F8C8D4]/40 transition-colors"
              >
                ✨ 智能生成
              </button>
            </div>

            <p className="text-sm text-[#9B8A8E]">
              详细描述角色的性格、说话方式、行为特点等。这是决定角色灵魂的核心设置。
            </p>

            <textarea
              value={formData.systemPrompt}
              onChange={(e) =>
                handleInputChange("systemPrompt", e.target.value)
              }
              placeholder={`示例：\n你是小樱，一个活泼可爱的女孩。你说话总是带着很多感叹号，喜欢用可爱的语气词（嘿嘿、呀、呢）。你会主动分享自己的日常，偶尔会撒娇...\n\n对话规则：\n1. 保持性格一致...`}
              rows={8}
              className="w-full px-4 py-3 bg-[#F5F0EB]/50 border border-[#EDE5E0] rounded-xl text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-2 focus:ring-[#F8C8D4]/20 outline-none transition-all resize-none"
              maxLength={2000}
            />

            <div className="flex justify-end">
              <span className="text-xs text-[#9B8A8E]">
                {formData.systemPrompt.length}/2000
              </span>
            </div>
          </div>

          {/* 开场白 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#EDE5E0] space-y-4">
            <h2 className="text-lg font-semibold text-[#3D2C2E] flex items-center gap-2">
              <span>💬</span> 开场白 <span className="text-red-500">*</span>
            </h2>

            <p className="text-sm text-[#9B8A8E]">
              角色对用户说的第一句话，要能体现角色的性格特点。
            </p>

            <textarea
              value={formData.greeting}
              onChange={(e) => handleInputChange("greeting", e.target.value)}
              placeholder="例如：嘿！你终于来了！我等你好久了～今天想聊些什么呢？"
              rows={3}
              className="w-full px-4 py-3 bg-[#F5F0EB]/50 border border-[#EDE5E0] rounded-xl text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-2 focus:ring-[#F8C8D4]/20 outline-none transition-all resize-none"
              maxLength={500}
            />
          </div>

          {/* 提交按钮 */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-[#F8C8D4] to-[#FFB6C1] text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  创建中...
                </span>
              ) : (
                "✨ 创建我的角色"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
