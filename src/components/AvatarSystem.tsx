"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  Upload,
  ImageIcon,
  Wand2,
  Lightbulb,
  TriangleAlert,
} from "lucide-react";

// 头像选项接口
interface AvatarOption {
  id: string;
  url: string;
  label: string;
  style: string;
  tags: string[];
}

// 精选头像库
const PRESET_AVATARS: Record<string, AvatarOption[]> = {
  female: [
    {
      id: "f1",
      url: "/avatars/female/cute-1.jpg",
      label: "甜美少女",
      style: "cute",
      tags: ["可爱", "甜美", "活泼"],
    },
    {
      id: "f2",
      url: "/avatars/female/cool-1.jpg",
      label: "高冷御姐",
      style: "cool",
      tags: ["高冷", "成熟", "神秘"],
    },
    {
      id: "f3",
      url: "/avatars/female/gentle-1.jpg",
      label: "温柔治愈",
      style: "gentle",
      tags: ["温柔", "治愈", "文静"],
    },
    {
      id: "f4",
      url: "/avatars/female/lively-1.jpg",
      label: "元气少女",
      style: "lively",
      tags: ["元气", "活泼", "阳光"],
    },
    {
      id: "f5",
      url: "/avatars/female/mystery-1.jpg",
      label: "神秘魔女",
      style: "mystery",
      tags: ["神秘", "暗黑", "优雅"],
    },
    {
      id: "f6",
      url: "/avatars/female/elegant-1.jpg",
      label: "优雅淑女",
      style: "elegant",
      tags: ["优雅", "知性", "成熟"],
    },
  ],
  male: [
    {
      id: "m1",
      url: "/avatars/male/warm-1.jpg",
      label: "温柔暖男",
      style: "warm",
      tags: ["温柔", "暖男", "体贴"],
    },
    {
      id: "m2",
      url: "/avatars/male/cool-1.jpg",
      label: "冷酷型男",
      style: "cool",
      tags: ["冷酷", "帅气", "高冷"],
    },
    {
      id: "m3",
      url: "/avatars/male/sunshine-1.jpg",
      label: "阳光少年",
      style: "sunshine",
      tags: ["阳光", "开朗", "运动"],
    },
    {
      id: "m4",
      url: "/avatars/male/mature-1.jpg",
      label: "成熟大叔",
      style: "mature",
      tags: ["成熟", "稳重", "绅士"],
    },
    {
      id: "m5",
      url: "/avatars/male/gentle-1.jpg",
      label: "文艺青年",
      style: "gentle",
      tags: ["文艺", "温柔", "内敛"],
    },
    {
      id: "m6",
      url: "/avatars/male/lively-1.jpg",
      label: "元气少年",
      style: "lively",
      tags: ["元气", "活泼", "可爱"],
    },
  ],
};

type AvatarTab = "preset" | "ai" | "upload";

interface AvatarSystemProps {
  gender: "male" | "female";
  selectedAvatar: string | null;
  characterTags?: string[];
  appearance?: string;
  onSelect: (avatarUrl: string) => void;
  onCustomUpload?: (file: File) => void;
}

export default function AvatarSystem({
  gender,
  selectedAvatar,
  characterTags = [],
  appearance = "",
  onSelect,
  onCustomUpload,
}: AvatarSystemProps) {
  const [activeTab, setActiveTab] = useState<AvatarTab>("preset");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAvatars, setGeneratedAvatars] = useState<string[]>([]);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  // 智能推荐头像
  const getRecommendedAvatars = useCallback(() => {
    const avatars = PRESET_AVATARS[gender] || [];
    if (characterTags.length === 0) return avatars;

    // 根据标签匹配度排序
    return avatars.sort((a, b) => {
      const aMatch = a.tags.filter((tag) => characterTags.includes(tag)).length;
      const bMatch = b.tags.filter((tag) => characterTags.includes(tag)).length;
      return bMatch - aMatch;
    });
  }, [gender, characterTags]);

  // AI生成头像
  const handleAIGenerate = async () => {
    if (!appearance) {
      toast.error("请先在下方填写外貌描述，AI才能生成匹配的头像");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appearance,
          gender,
          style: "anime",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "生成失败");
      }

      setGeneratedAvatars((prev) => [...prev, data.imageUrl]);
      toast.success("✨ 头像生成成功！");
    } catch (error) {
      console.error("[AIGenerate] Error:", error);
      toast.error("头像生成失败，请稍后重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片文件");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadPreview(result);
      onSelect(result);
      if (onCustomUpload) onCustomUpload(file);
    };
    reader.readAsDataURL(file);
  };

  const recommendedAvatars = getRecommendedAvatars();

  return (
    <div className="space-y-4">
      {/* Tab 切换 */}
      <div className="flex gap-2 p-1 bg-[#F5F0EB] rounded-xl">
        <button
          onClick={() => setActiveTab("preset")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === "preset"
              ? "bg-white text-[#3D2C2E] shadow-sm"
              : "text-[#9B8A8E] hover:text-[#3D2C2E]"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          精选头像
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === "ai"
              ? "bg-white text-[#3D2C2E] shadow-sm"
              : "text-[#9B8A8E] hover:text-[#3D2C2E]"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI生成
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === "upload"
              ? "bg-white text-[#3D2C2E] shadow-sm"
              : "text-[#9B8A8E] hover:text-[#3D2C2E]"
          }`}
        >
          <Upload className="w-4 h-4" />
          自定义
        </button>
      </div>

      {/* 精选头像 */}
      {activeTab === "preset" && (
        <div className="space-y-3">
          {characterTags.length > 0 && (
            <p className="text-xs text-[#9B8A8E] flex items-center gap-1">
              <Lightbulb size={13} className="text-[#A8C8EA]" />
              根据角色标签为您智能推荐
            </p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {recommendedAvatars.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => onSelect(avatar.url)}
                className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  selectedAvatar === avatar.url
                    ? "border-[#F8C8D4] ring-2 ring-[#F8C8D4]/30"
                    : "border-transparent hover:border-[#EDE5E0]"
                }`}
              >
                <div className="w-full h-full bg-gradient-to-br from-[#F8C8D4]/20 to-[#A8D8EA]/20 flex items-center justify-center">
                  <span className="text-3xl">
                    {gender === "female" ? "👩" : "👨"}
                  </span>
                </div>
                {/* 选中标记 */}
                {selectedAvatar === avatar.url && (
                  <div className="absolute inset-0 bg-[#F8C8D4]/20 flex items-center justify-center">
                    <div className="w-8 h-8 bg-[#F8C8D4] rounded-full flex items-center justify-center text-white text-lg">
                      ✓
                    </div>
                  </div>
                )}
                {/* 标签 */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1.5 text-center backdrop-blur-sm">
                  {avatar.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI生成 */}
      {activeTab === "ai" && (
        <div className="space-y-4">
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#A8D8EA]/20 to-[#F8C8D4]/20 rounded-2xl flex items-center justify-center">
              <Wand2 className="w-8 h-8 text-[#A8D8EA]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#3D2C2E]">
                AI智能生成专属头像
              </p>
              <p className="text-xs text-[#9B8A8E] mt-1">
                根据角色的外貌描述，AI将生成独一无二的头像
              </p>
            </div>
            <Button
              onClick={handleAIGenerate}
              disabled={isGenerating || !appearance}
              className="bg-gradient-to-r from-[#A8D8EA] to-[#F8C8D4] text-white hover:opacity-90 transition-opacity"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  立即生成
                </>
              )}
            </Button>
            {!appearance && (
              <p className="text-xs text-orange-500 flex items-center gap-1">
                <TriangleAlert size={13} />
                请先在下方填写外貌描述
              </p>
            )}
          </div>

          {/* 生成的头像展示 */}
          {generatedAvatars.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#3D2C2E]">生成结果</p>
              <div className="grid grid-cols-3 gap-3">
                {generatedAvatars.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => onSelect(url)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedAvatar === url
                        ? "border-[#F8C8D4] ring-2 ring-[#F8C8D4]/30"
                        : "border-transparent hover:border-[#EDE5E0]"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`AI生成头像 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedAvatar === url && (
                      <div className="absolute inset-0 bg-[#F8C8D4]/20 flex items-center justify-center">
                        <div className="w-8 h-8 bg-[#F8C8D4] rounded-full flex items-center justify-center text-white text-lg">
                          ✓
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 自定义上传 */}
      {activeTab === "upload" && (
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              uploadPreview
                ? "border-[#F8C8D4] bg-[#F8C8D4]/5"
                : "border-[#EDE5E0] hover:border-[#F8C8D4]"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="custom-avatar-upload"
            />
            <label htmlFor="custom-avatar-upload" className="cursor-pointer">
              {uploadPreview ? (
                <div className="space-y-3">
                  <img
                    src={uploadPreview}
                    alt="预览"
                    className="w-24 h-24 mx-auto rounded-xl object-cover"
                  />
                  <p className="text-sm text-[#3D2C2E]">点击更换图片</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto bg-[#F5F0EB] rounded-xl flex items-center justify-center">
                    <Upload className="w-6 h-6 text-[#9B8A8E]" />
                  </div>
                  <p className="text-sm text-[#3D2C2E]">点击上传自定义图片</p>
                  <p className="text-xs text-[#9B8A8E]">
                    支持 JPG、PNG、WebP，最大 5MB
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>
      )}

      {/* 选中预览 */}
      {selectedAvatar && (
        <div className="flex items-center gap-3 p-3 bg-[#F5F0EB]/50 rounded-xl">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-[#F8C8D4]/20 to-[#A8D8EA]/20">
            {selectedAvatar.startsWith("http") ||
            selectedAvatar.startsWith("data:") ? (
              <img
                src={selectedAvatar}
                alt="选中头像"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">
                {gender === "female" ? "👩" : "👨"}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#3D2C2E]">已选择头像</p>
            <p className="text-xs text-[#9B8A8E]">
              {activeTab === "preset" && "精选头像"}
              {activeTab === "ai" && "AI生成头像"}
              {activeTab === "upload" && "自定义上传"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
