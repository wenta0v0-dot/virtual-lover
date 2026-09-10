"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserMenu from "@/components/UserMenu";
import CharacterAvatar from "@/components/CharacterAvatar";
import { useAuth } from "@/hooks/useAuth";

interface ChatHistory {
  id: number;
  characterId: string;
  characterName: string;
  characterAvatar: string | null;
  lastMessage: string | null;
  messageCount: number;
  updatedAt: Date | string;
}

function formatTimeAgo(dateInput?: Date | string | null): string {
  if (!dateInput) return "未知时间";

  try {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "无效时间";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (isNaN(diffMs)) return "未知";

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("[formatTimeAgo] Error:", error);
    return "时间错误";
  }
}
export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(true); // requireAuth = true

  // ✅ 所有状态必须在条件返回之前
  const [searchQuery, setSearchQuery] = useState("");
  const [historyData, setHistoryData] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ useEffect 必须在条件返回之前
  useEffect(() => {
    // 如果还在加载或未登录，不执行
    if (authLoading || !user) return;

    async function loadHistory() {
      try {
        const response = await fetch("/api/history", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setHistoryData(data.sessions || []);
        }
      } catch (error) {
        console.error("[History] Failed to load:", error);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [authLoading, user]); // ✅ 添加依赖

  // ✅ 条件返回在所有 Hooks 之后
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

  // 未登录时会自动跳转
  if (!user) {
    return null;
  }

  const filteredHistory = historyData.filter(
    (item) =>
      item.characterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lastMessage ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  function handleChatClick(characterId: string) {
    router.push(`/chat/${characterId}`);
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#EDE5E0]/50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
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
              <h1 className="text-xl font-bold text-[#3D2C2E]">历史记录</h1>
            </div>

            <UserMenu />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B8A8E]"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="搜索角色或消息内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#F5F0EB]/50 border border-[#EDE5E0] rounded-xl text-sm text-[#3D2C2E] placeholder:text-[#9B8A8E]/60 focus:border-[#F8C8D4] focus:ring-2 focus:ring-[#F8C8D4]/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F8C8D4] mx-auto mb-4"></div>
            <p className="text-sm text-[#9B8A8E]">加载历史记录...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-[#3D2C2E] mb-2">
              {searchQuery ? "未找到相关记录" : "暂无聊天记录"}
            </h3>
            <p className="text-sm text-[#9B8A8E]">
              {searchQuery
                ? "尝试使用其他关键词搜索"
                : "开始与你的虚拟恋人聊天吧"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => handleChatClick(item.characterId)}
                className="w-full group p-4 bg-white rounded-2xl shadow-sm border border-[#EDE5E0] text-left hover:shadow-md hover:border-[#F8C8D4]/30 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  {/* Character Avatar */}
                  <div className="shrink-0">
                    <CharacterAvatar
                      name={item.characterName}
                      avatar={item.characterAvatar}
                      size="md"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-[#3D2C2E] group-hover:text-[#F8C8D4] transition-colors">
                        {item.characterName}
                      </h3>
                      <span className="text-xs text-[#9B8A8E] whitespace-nowrap ml-2">
                        {formatTimeAgo(item.updatedAt)}
                      </span>
                    </div>

                    <p className="text-sm text-[#9B8A8E] line-clamp-2 mb-2">
                      {item.lastMessage}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs text-[#9B8A8E]">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        {item.messageCount} 条消息
                      </span>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-[#F8C8D4]"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Stats */}
      {!loading && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-[#EDE5E0]/50 py-3 px-4">
          <div className="max-w-3xl mx-auto flex items-center justify-center gap-6 text-xs text-[#9B8A8E]">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400" />共{" "}
              {historyData.length} 个角色
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {historyData.reduce(
                (sum, item) => sum + (item.messageCount || 0),
                0,
              )}{" "}
              条总消息
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
