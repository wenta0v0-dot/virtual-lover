"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  Sparkles,
  Copy,
  Check,
  Wand2,
  Image as ImageIcon,
  X,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface GeneratedPrompts {
  appearance: string;
  tags: string[];
  systemPrompt: string;
  name: string;
  title: string;
}

interface ImageToPromptAssistantProps {
  onApply?: (prompts: GeneratedPrompts) => void;
}

export default function ImageToPromptAssistant({
  onApply,
}: ImageToPromptAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] =
    useState<GeneratedPrompts | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("图片大小不能超过10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setGeneratedPrompts(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const analyzeImage = async () => {
    if (!imagePreview) return;

    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/image-to-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imagePreview }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "分析失败");
      }

      setGeneratedPrompts(data.prompts);
      toast.success("✨ 分析完成！已生成角色设定");
    } catch (error) {
      console.error("[ImageToPrompt] Error:", error);
      toast.error(error instanceof Error ? error.message : "图片分析失败");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = async (
    text: string,
    field: string,
    label: string,
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`已复制 ${label}`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  const applyAll = () => {
    if (generatedPrompts && onApply) {
      onApply(generatedPrompts);
      toast.success("✅ 已应用到表单");
      setIsOpen(false);
    }
  };

  const resetAll = () => {
    setImagePreview(null);
    setGeneratedPrompts(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="gap-2 border-[#F8C8D4] text-[#F8C8D4] hover:bg-[#F8C8D4]/10 hover:text-[#F8C8D4]"
        >
          <Wand2 className="w-4 h-4" />
          AI图片识别助手
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] bg-white/95 backdrop-blur-xl border border-[#EDE5E0]/50 shadow-2xl overflow-hidden">
        <DialogHeader className="pb-4 border-b border-[#EDE5E0]/30">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-[#3D2C2E]">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#A8D8EA]/20 to-[#F8C8D4]/20">
              <Sparkles className="w-5 h-5 text-[#A8D8EA]" />
            </div>
            AI图片识别助手
            <span className="text-xs font-normal text-[#9B8A8E] ml-auto">
              上传参考图 → 智能生成角色设定
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)] pr-4">
          <div className="space-y-6 pb-6">
            {/* 图片上传区域 */}
            {!imagePreview ? (
              <div
                className="relative border-2 border-dashed border-[#EDE5E0] rounded-2xl p-12 text-center bg-gradient-to-br from-[#FFF8F0]/50 to-white transition-all hover:border-[#F8C8D4]/50 hover:bg-gradient-to-br hover:from-[#F8C8D4]/5 hover:to-white cursor-pointer group"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileSelect(e.target.files[0])
                  }
                  className="hidden"
                />

                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#A8D8EA]/20 to-[#F8C8D4]/20 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-[#9B8A8E]" />
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-[#3D2C2E] mb-1">
                      点击或拖拽上传图片
                    </p>
                    <p className="text-sm text-[#9B8A8E]">
                      支持 JPG、PNG、WebP，最大 10MB
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center text-xs text-[#9B8A8E]">
                    <span className="px-3 py-1 bg-[#F5F0EB] rounded-full">
                      🎭 动漫角色
                    </span>
                    <span className="px-3 py-1 bg-[#F5F0EB] rounded-full">
                      👤 真人照片
                    </span>
                    <span className="px-3 py-1 bg-[#F5F0EB] rounded-full">
                      🎨 艺术画作
                    </span>
                    <span className="px-3 py-1 bg-[#F5F0EB] rounded-full">
                      📸 风格参考
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* 图片预览 */
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-[#F5F0EB]">
                  <img
                    src={imagePreview}
                    alt="预览"
                    className="w-full max-h-80 object-contain mx-auto"
                  />

                  {/* 操作按钮 */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      type="button"
                      onClick={resetAll}
                      className="p-2 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* 分析按钮 */}
                  {!generatedPrompts && !isAnalyzing && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                      <Button
                        type="button"
                        onClick={analyzeImage}
                        size="lg"
                        className="w-full bg-gradient-to-r from-[#A8D8EA] to-[#F8C8D4] text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        开始AI分析
                      </Button>
                    </div>
                  )}

                  {/* 加载状态 */}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
                        <p className="text-white font-medium">
                          AI正在分析图片...
                        </p>
                        <p className="text-xs text-white/70">
                          正在识别外貌特征、性格气质...
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 重新选择 */}
                {!isAnalyzing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm text-[#9B8A8E] hover:text-[#3D2C2E] transition-colors mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    更换图片
                  </button>
                )}
              </div>
            )}

            {/* 生成结果 */}
            {generatedPrompts && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#3D2C2E] flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    生成结果
                  </h3>

                  <Button
                    type="button"
                    onClick={applyAll}
                    size="sm"
                    className="bg-gradient-to-r from-[#F8C8D4] to-[#FFB6C1] text-white hover:shadow-lg"
                  >
                    <Wand2 className="w-4 h-4 mr-1" />
                    一键应用到表单
                  </Button>
                </div>

                {/* 外貌描述 */}
                <div className="bg-gradient-to-br from-[#FFB6C1]/5 to-[#F8C8D4]/5 rounded-xl p-4 border border-[#F8C8D4]/20">
                  <div className="flex items-start justify-between mb-2">
                    <label className="text-sm font-semibold text-[#3D2C2E] flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#F8C8D4]" />
                      外貌描述
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          generatedPrompts.appearance,
                          "appearance",
                          "外貌描述",
                        )
                      }
                      className="text-xs"
                    >
                      {copiedField === "appearance" ? (
                        <>
                          <Check className="w-3 h-3 mr-1" /> 已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" /> 复制
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-[#5A4A4E] leading-relaxed pl-6">
                    {generatedPrompts.appearance}
                  </p>
                </div>

                {/* 建议标签 */}
                <div className="bg-gradient-to-br from-[#A8D8EA]/5 to-transparent rounded-xl p-4 border border-[#A8D8EA]/20">
                  <label className="text-sm font-semibold text-[#3D2C2E] mb-2 block flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#A8D8EA]" />
                    性格标签建议
                  </label>
                  <div className="flex flex-wrap gap-2 pl-6">
                    {generatedPrompts.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-[#A8D8EA]/20 text-[#3D2C2E] rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 系统提示词 */}
                <div className="bg-gradient-to-br from-[#FFE4B5]/5 to-transparent rounded-xl p-4 border border-[#FFE4B5]/20">
                  <div className="flex items-start justify-between mb-2">
                    <label className="text-sm font-semibold text-[#3D2C2E] flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-[#FFB6C1]" />
                      系统提示词
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          generatedPrompts.systemPrompt,
                          "systemPrompt",
                          "系统提示词",
                        )
                      }
                      className="text-xs"
                    >
                      {copiedField === "systemPrompt" ? (
                        <>
                          <Check className="w-3 h-3 mr-1" /> 已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" /> 复制
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="text-sm text-[#5A4A4E] leading-relaxed whitespace-pre-wrap font-sans pl-6 bg-white/50 rounded-lg p-3 mt-2">
                    {generatedPrompts.systemPrompt}
                  </pre>
                </div>

                {/* 名称和标题 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-[#D8BFD8]/5 to-transparent rounded-xl p-4 border border-[#D8BFD8]/20">
                    <div className="flex items-start justify-between mb-2">
                      <label className="text-sm font-semibold text-[#3D2C2E]">
                        建议名称
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            generatedPrompts.name,
                            "name",
                            "角色名称",
                          )
                        }
                        className="text-xs"
                      >
                        {copiedField === "name" ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    <p className="text-base font-medium text-[#3D2C2E] pl-2">
                      {generatedPrompts.name}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-[#C8E6C9]/5 to-transparent rounded-xl p-4 border border-[#C8E6C9]/20">
                    <div className="flex items-start justify-between mb-2">
                      <label className="text-sm font-semibold text-[#3D2C2E]">
                        建议标题
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            generatedPrompts.title,
                            "title",
                            "角色标题",
                          )
                        }
                        className="text-xs"
                      >
                        {copiedField === "title" ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    <p className="text-base font-medium text-[#3D2C2E] pl-2">
                      {generatedPrompts.title}
                    </p>
                  </div>
                </div>

                {/* 提示信息 */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-[#A8D8EA]/10 to-[#F8C8D4]/10 border border-[#A8D8EA]/20">
                  <p className="text-xs text-[#9B8A8E] text-center">
                    💡
                    提示：您可以单独复制任意字段，也可以点击“一键应用到表单”自动填充所有内容
                  </p>
                </div>
              </div>
            )}

            {/* 使用说明 */}
            {!generatedPrompts && (
              <div className="mt-8 p-4 rounded-lg bg-[#F5F0EB]/50 border border-[#EDE5E0]">
                <h4 className="font-semibold text-[#3D2C2E] mb-2 text-sm">
                  📖 使用说明
                </h4>
                <ul className="space-y-1 text-xs text-[#9B8A8E] list-disc list-inside">
                  <li>
                    上传一张您喜欢的角色参考图（动漫、真人、艺术作品均可）
                  </li>
                  <li>AI将智能分析图片中的外貌特征、气质风格</li>
                  <li>自动生成适合创建虚拟角色的详细设定</li>
                  <li>可以复制单个字段或一键应用到创建表单</li>
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
