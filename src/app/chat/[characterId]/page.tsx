"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { characters, getCharacter, type Character } from "@/lib/characters";
import UserMenu from "@/components/UserMenu";
import ImageUploader from "@/components/ImageUploader";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUrl?: string;
  imageLoading?: boolean;
  imageError?: string;
  imageRetryable?: boolean;
  isStreaming?: boolean;
}

interface CustomCharacterData {
  id: string;
  name: string;
  title: string;
  tags: string[];
  avatar: string;
  avatarImage: string | null;
  gender: string;
  appearance: string;
  systemPrompt: string;
  greeting: string;
  color: string;
  status: string;
  isCustom: true;
}

export default function ChatPage() {
  // ✅ 第1步：所有参数和Hook调用（绝对不能有任何条件）
  const params = useParams();
  const router = useRouter();
  const characterId = params.characterId as string;
  const { user, loading: authLoading } = useAuth(true);

  // ✅ 第2步：所有状态声明（必须在条件返回之前）
  const [character, setCharacter] = useState<
    Character | CustomCharacterData | undefined
  >(getCharacter(characterId));
  const [loadingCustomChar, setLoadingCustomChar] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null); // 新增：用户头像
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const initializedCharacterIdRef = useRef<string | null>(null);
  const lastImageGenTime = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const IMAGE_GEN_COOLDOWN = 10000;

  // ✅ 第3步：所有useEffect和useCallback
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // 加载用户头像
  useEffect(() => {
    async function loadUserAvatar() {
      if (!user) {
        console.log("[Chat] 等待用户登录...");
        return;
      }

      console.log("[Chat] 开始加载用户头像...");
      try {
        const response = await fetch("/api/user-settings", {
          credentials: "include",
        });

        console.log("[Chat] API响应状态:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("[Chat] API返回数据:", data);

          // 兼容两种返回格式：
          // 格式1: { user: { avatar: "..." } }
          // 格式2: { avatar: "..." }
          const avatarUrl = data.user?.avatar || data.avatar;

          if (avatarUrl) {
            // 修复Windows路径分隔符问题（\\ -> /）
            const fixedAvatarUrl = avatarUrl.replace(/\\/g, "/");
            setUserAvatar(fixedAvatarUrl);
            console.log("[Chat] ✅ 用户头像已设置:", fixedAvatarUrl);
            console.log("[Chat] 原始URL:", avatarUrl);
            console.log("[Chat] 头像URL长度:", fixedAvatarUrl.length);
          } else {
            console.log("[Chat] ⚠️ 用户未设置头像");
            console.log("[Chat] 完整data对象:", data);
          }
        } else {
          console.error(
            "[Chat] API请求失败:",
            response.status,
            await response.text(),
          );
        }
      } catch (error) {
        console.error("[Chat] 加载用户头像失败:", error);
      }
    }

    loadUserAvatar();
  }, [user]);

  // 加载自定义角色
  useEffect(() => {
    async function loadCustomCharacter() {
      if (getCharacter(characterId) || !characterId.startsWith("custom-")) {
        return;
      }

      setLoadingCustomChar(true);
      try {
        const response = await fetch("/api/characters/custom", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const customChar = data.characters?.find(
            (c: CustomCharacterData) => c.id === characterId,
          );

          if (customChar) {
            setCharacter(customChar);
          }
        }
      } catch (error) {
        console.error("[Chat] 加载自定义角色失败:", error);
      } finally {
        setLoadingCustomChar(false);
      }
    }

    loadCustomCharacter();
  }, [characterId]);

  // Scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send greeting on mount or when character changes
  useEffect(() => {
    if (loadingCustomChar) return;
    if (!character) return;

    if (initializedCharacterIdRef.current === character.id) return;

    // Mark this character as initialized
    initializedCharacterIdRef.current = character.id;

    // Reset messages for new character
    setMessages([]);

    const greetingId = crypto.randomUUID();
    setMessages([
      {
        id: greetingId,
        role: "assistant",
        text: "",
        isStreaming: true,
      },
    ]);

    // Stream greeting
    streamChat(
      [
        { role: "system", content: character.systemPrompt },
        { role: "user", content: character.greeting },
      ],
      greetingId,
      character,
    );
  }, [character, loadingCustomChar]); // ✅ 保持依赖数组大小不变

  // ✅ 条件返回（必须在所有Hooks之后）
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF8F0]">
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

  // Stream chat response
  async function streamChat(
    chatMessages: { role: string; content: string }[],
    msgId: string,
    char: Character | CustomCharacterData,
  ) {
    try {
      console.log("[Chat-Debug] 发送聊天请求...");
      console.log("[Chat-Debug] 请求参数:", {
        messagesCount: chatMessages.length,
        characterId: char.id,
        characterName: char.name,
        hasAvatar: !!(char.avatarImage || char.avatar),
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: chatMessages,
          characterId: char.id,
          characterName: char.name,
          characterAvatar: char.avatarImage || char.avatar,
        }),
      });

      console.log(
        "[Chat-Debug] 响应状态:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Chat-Debug] 错误响应内容:", errorText);
        throw new Error(
          `Chat request failed (${response.status}): ${errorText}`,
        );
      }
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullText += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === msgId
                      ? { ...m, text: fullText, isStreaming: true }
                      : m,
                  ),
                );
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
      }

      // Parse selfie tag
      const selfieMatch = fullText.match(/\[SELFIE:(.*?)\]/);
      let cleanText = fullText;
      let imagePrompt: string | null = null;

      if (selfieMatch) {
        const sceneDescription = selfieMatch[1];
        // 构建角色一致性提示词，包含角色外观和场景描述
        imagePrompt = `[SELFIE:${char.appearance}，${sceneDescription}]`;
        cleanText = fullText.replace(/\[SELFIE:.*?\]/, "").trim();
      }

      // Update message with clean text
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                text: cleanText,
                isStreaming: false,
                imageLoading: !!imagePrompt,
              }
            : m,
        ),
      );

      // Trigger image generation with character's avatar as reference image
      if (imagePrompt) {
        const referenceImageUrl = char.avatarImage || undefined;
        await generateImage(imagePrompt, msgId, 0, referenceImageUrl);
      }
    } catch (error) {
      console.error("Stream error:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const displayText = `网络不太好，再说一次吗？\n\n[调试信息]\n错误: ${errorMessage}`;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                text: displayText,
                isStreaming: false,
              }
            : m,
        ),
      );
    }
  }

  // Generate image with enhanced error handling
  async function generateImage(
    prompt: string,
    msgId: string,
    retryCount = 0,
    referenceImageUrl?: string,
  ) {
    const maxRetries = 2;

    const now = Date.now();
    const timeSinceLastGen = now - lastImageGenTime.current;
    if (timeSinceLastGen < IMAGE_GEN_COOLDOWN && retryCount === 0) {
      const waitTime = IMAGE_GEN_COOLDOWN - timeSinceLastGen;
      console.log(`[Image] Cooldown active, waiting ${waitTime}ms`);
      setTimeout(() => {
        generateImage(prompt, msgId, retryCount, referenceImageUrl);
      }, waitTime);
      return;
    }
    lastImageGenTime.current = Date.now();

    try {
      const requestBody: { prompt: string; size?: string; imageUrl?: string } =
        {
          prompt,
          size: "1280x1280",
        };

      if (referenceImageUrl) {
        requestBody.imageUrl = referenceImageUrl;
      }

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        const isRateLimit = data.code === 429;
        const isRetryable = data.retryable && retryCount < maxRetries;

        if (isRetryable) {
          const waitTime = isRateLimit ? 5000 * (retryCount + 1) : 2000;
          console.log(
            `[Image] Rate limited, retry ${retryCount + 1}/${maxRetries} in ${waitTime}ms`,
          );

          setTimeout(() => {
            generateImage(prompt, msgId, retryCount + 1, referenceImageUrl);
          }, waitTime);

          return;
        }

        console.error(`[Image] Failed [${data.code}]:`, data.error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  imageError: getErrorMessage(data.code, data.error),
                  imageLoading: false,
                  imageRetryable: data.retryable,
                }
              : m,
          ),
        );
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                imageUrl: data.imageUrls?.[0],
                imageLoading: false,
                imageError: undefined,
              }
            : m,
        ),
      );
    } catch (error) {
      console.error("Image generation error:", error);

      if (retryCount < maxRetries) {
        setTimeout(() => {
          generateImage(prompt, msgId, retryCount + 1, referenceImageUrl);
        }, 2000);
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                imageLoading: false,
                imageError: "图片生成失败，请稍后重试",
              }
            : m,
        ),
      );
    }
  }

  function getErrorMessage(code?: number, message?: string): string {
    switch (code) {
      case 429:
        return "生成太快啦，休息一下再试试～";
      case 401:
        return "API配置错误，请联系管理员";
      case 403:
        return "权限不足，无法生成图片";
      default:
        return message || "图片生成失败，点击重试";
    }
  }

  // Retry image generation
  async function retryImage(msgId: string) {
    const message = messages.find((m) => m.id === msgId);
    if (!message || !message.text || !character) return;

    const selfieMatch = message.text.match(/\[SELFIE:(.*?)\]/);
    if (!selfieMatch) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, imageLoading: true, imageError: undefined }
          : m,
      ),
    );

    const sceneDescription = selfieMatch[1];
    const fullPrompt = `[SELFIE:${character.appearance}，${sceneDescription}]`;
    const referenceImageUrl = character.avatarImage || undefined;
    await generateImage(fullPrompt, msgId, 0, referenceImageUrl);
  }

  // Send message
  async function handleSend() {
    if (!inputText.trim() || isSending || !character) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: inputText.trim(),
    };

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInputText("");
    setIsSending(true);

    // Build conversation history
    const chatHistory = messages.map((m) => ({
      role: m.role,
      content: m.text,
    }));
    chatHistory.push({ role: "user", content: userMsg.text });

    await streamChat(
      [{ role: "system", content: character.systemPrompt }, ...chatHistory],
      assistantMsg.id,
      character,
    );

    setIsSending(false);
  }

  // Send image message
  async function handleSendImage(imageData: string, file: File) {
    if (isSending || !character) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: "[图片]",
      imageUrl: imageData,
    };

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setShowImageUploader(false);
    setIsSending(true);

    try {
      // Build form data
      const formData = new FormData();
      formData.append("image", file);
      formData.append(
        "messages",
        JSON.stringify(
          messages.map((m) => ({
            role: m.role,
            content: m.text,
          })),
        ),
      );
      formData.append(
        "characterData",
        JSON.stringify({
          name: character.name,
          systemPrompt: character.systemPrompt,
          appearance: character.appearance,
        }),
      );

      // Send to API
      const response = await fetch("/api/chat-with-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "发送失败");
      }

      // Update assistant message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, text: data.reply, isStreaming: false }
            : m,
        ),
      );
    } catch (error) {
      console.error("[SendImage] Error:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                text: "抱歉，我暂时无法查看图片，请稍后再试～",
                isStreaming: false,
              }
            : m,
        ),
      );
    } finally {
      setIsSending(false);
    }
  }

  // Handle key press
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Back to character selection
  function handleBack() {
    router.push("/");
  }

  if (!character) {
    if (loadingCustomChar || characterId.startsWith("custom-")) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#FFF8F0]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F8C8D4] mx-auto mb-4"></div>
            <p className="text-[#9B8A8E]">加载角色中...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF8F0]">
        <div className="text-center">
          <p className="text-[#9B8A8E]">角色不存在</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-[#F8C8D4] underline"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#EDEDED]">
      {/* Header - Enhanced with avatar and status */}
      <div
        className="relative px-4 py-3 shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${character.color}40, ${character.color}20)`,
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-[#3D2C2E]/70 hover:text-[#3D2C2E]"
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
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <UserMenu />
        </div>

        {/* Avatar + Name + Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {character.avatarImage && (
              <img
                src={character.avatarImage}
                alt={character.name}
                className="h-10 w-10 rounded-full object-cover shadow-md ring-2 ring-white/50"
                style={{ display: "block" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const fallback = (e.target as HTMLImageElement)
                    .nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  const fallback = img.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "none";
                }}
              />
            )}
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg shadow-md ${character.avatarImage ? "" : "ring-2 ring-white/50"}`}
              style={{
                backgroundColor: character.color,
                display: !character.avatarImage ? "flex" : "none",
              }}
            >
              {character.avatar}
            </div>
            {"isOnline" in character && character.isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-base font-semibold text-[#3D2C2E]">
              {character.name}
            </span>
            {character.status && (
              <span className="text-xs text-[#9B8A8E]/80 animate-pulse-slow">
                {character.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div
        ref={chatContainerRef}
        className="chat-scroll flex-1 overflow-y-auto px-4 py-4"
      >
        <div className="mx-auto max-w-lg space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              character={character as Character}
              userAvatar={userAvatar}
              onRetryImage={retryImage}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - WeChat style */}
      <div className="border-t border-[#E0E0E0] bg-[#F7F7F7] px-4 py-3">
        {/* Image Uploader */}
        {showImageUploader && (
          <div className="mb-3">
            <ImageUploader
              onImageSelect={handleSendImage}
              onCancel={() => setShowImageUploader(false)}
            />
          </div>
        )}

        <div className="mx-auto flex max-w-lg items-end gap-3">
          {/* Image upload button */}
          <button
            onClick={() => setShowImageUploader(!showImageUploader)}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm transition-all ${
              showImageUploader
                ? "bg-[#F8C8D4] text-white"
                : "bg-white text-[#9B8A8E] hover:bg-[#F8C8D4]/20"
            }`}
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
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          <div className="flex-1 rounded-lg bg-white px-4 py-2.5 shadow-sm">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-[#3D2C2E] outline-none placeholder:text-[#9B8A8E]/50"
              style={{ maxHeight: "100px" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#95EC69] text-white shadow-sm transition-all hover:bg-[#7DD956] disabled:opacity-40"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Message bubble component
function MessageBubble({
  message,
  character,
  userAvatar,
  onRetryImage,
}: {
  message: Message;
  character: Character;
  userAvatar?: string | null;
  onRetryImage: (msgId: string) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={`animate-message-in flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      {!isUser && character.avatarImage ? (
        <div className="relative">
          <img
            src={character.avatarImage}
            alt={character.name}
            className="h-10 w-10 shrink-0 rounded-lg object-cover shadow-sm ring-2 ring-white/30"
            style={{ display: "block" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const fallback = (e.target as HTMLImageElement)
                .nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              const fallback = img.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "none";
            }}
          />
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg shadow-sm"
            style={{
              backgroundColor: character.color,
              display: "none",
            }}
          >
            {character.avatar}
          </div>
        </div>
      ) : isUser && userAvatar ? (
        <div className="relative">
          <img
            src={userAvatar}
            alt="用户头像"
            className="h-10 w-10 shrink-0 rounded-lg object-cover shadow-sm ring-2 ring-white/30"
            style={{ display: "block" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const fallback = (e.target as HTMLImageElement)
                .nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              const fallback = img.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "none";
            }}
          />
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg shadow-sm"
            style={{
              backgroundColor: "#95EC69",
              display: "none",
            }}
          >
            👤
          </div>
        </div>
      ) : (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg shadow-sm"
          style={{
            backgroundColor: isUser ? "#95EC69" : character.color,
          }}
        >
          {isUser ? "👤" : character.avatar}
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}
      >
        <div
          className="relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm"
          style={{
            backgroundColor: isUser ? "#95EC69" : "#FFFFFF",
            color: isUser ? "#1A1A1A" : "#3D2C2E",
            borderTopLeftRadius: isUser ? "16px" : "4px",
            borderTopRightRadius: isUser ? "4px" : "16px",
          }}
        >
          {message.text || (
            <span className="inline-flex items-center gap-1">
              <span className="text-[#9B8A8E]">正在输入</span>
              <span className="animate-cursor-blink text-[#9B8A8E]">|</span>
            </span>
          )}
          {message.isStreaming && message.text && (
            <span className="animate-cursor-blink ml-0.5 inline-block text-[#9B8A8E]">
              |
            </span>
          )}
        </div>

        {/* Image */}
        {message.imageUrl && (
          <div className="mt-2 overflow-hidden rounded-xl shadow-md">
            <img
              src={message.imageUrl}
              alt="角色自拍"
              className="max-w-[240px] rounded-xl"
              loading="lazy"
            />
          </div>
        )}
        {message.imageLoading && (
          <div className="mt-2 flex h-32 w-48 items-center justify-center rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse">
            <div className="text-center">
              <div className="mb-1 inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-[#9B8A8E]"></div>
              <p className="text-xs text-[#9B8A8E]">照片生成中...</p>
            </div>
          </div>
        )}
        {message.imageError && !message.imageLoading && (
          <div className="mt-2 flex flex-col items-center gap-2 rounded-xl bg-red-50 p-3">
            <p className="text-sm text-red-600">{message.imageError}</p>
            {message.imageRetryable && (
              <button
                onClick={() => onRetryImage(message.id)}
                className="rounded-full bg-red-100 px-4 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-200"
              >
                🔄 重新生成
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
