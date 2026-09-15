"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  MessageCircle,
  Drama,
  Image as ImageIcon,
  Heart,
  Sparkles,
  Settings,
  Rocket,
  BookOpen,
  Activity,
} from "lucide-react";
import UserMenu from "@/components/UserMenu";
import CharacterAvatar from "@/components/CharacterAvatar";
import AccountSettings from "@/components/AccountSettings";
import { useAuth } from "@/hooks/useAuth";

interface ChatSession {
  id: number;
  characterId: string;
  characterName: string;
  characterAvatar: string | null;
  lastMessage: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  recentMessages?: Array<{
    id: number;
    role: string;
    content: string;
    createdAt: string;
  }>;
}

interface ImageGeneration {
  id: number;
  prompt: string;
  imageUrls: string[] | null;
  createdAt: string;
}

interface UserData {
  user: { id: number; email: string };
  stats: {
    totalMessages: number;
    totalCharacters: number;
    totalImages: number;
    totalSessions: number;
  };
  topCharacter: ChatSession | null;
  recentSessions: ChatSession[];
  imageGenerations: ImageGeneration[];
}

export default function ExperienceCenter() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(true); // requireAuth = true

  // ✅ 所有状态必须在条件返回之前
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "chats" | "gallery">(
    "overview",
  );
  const [selectedCharacter, setSelectedCharacter] =
    useState<ChatSession | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // ✅ useEffect 必须在条件返回之前
  useEffect(() => {
    // 如果还在加载或未登录，不执行
    if (authLoading || !user) return;

    fetchUserData();
  }, [authLoading, user]); // ✅ 添加依赖

  async function fetchUserData() {
    try {
      const res = await fetch("/api/user-experience", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFF0F5] to-[#F8F0FF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#F8C8D4] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9B8A8E]">正在加载你的心灵空间...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFF0F5] to-[#F8F0FF] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#9B8A8E] mb-4">请先登录</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-[#F8C8D4] text-white rounded-full hover:bg-[#F8C8D4]/90 transition-colors"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  const { stats, topCharacter, recentSessions, imageGenerations } = userData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFF0F5] to-[#F8F0FF]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-[#EDE5E0]/30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-white/50 rounded-xl transition-colors"
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
              <div>
                <h1 className="text-xl font-bold text-[#3D2C2E] flex items-center gap-2">
                  <Sparkles size={20} className="text-[#F8A8BB]" />
                  心灵空间
                </h1>
                <p className="text-xs text-[#9B8A8E]">你的虚拟恋人世界</p>
              </div>
            </div>

            <UserMenu />
          </div>
        </div>
      </div>

      {/* Hero Section - Personalized Welcome */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#F8C8D4]/20 via-transparent to-[#C8D4F8]/20" />
        <div className="max-w-6xl mx-auto px-4 py-12 relative">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm mb-4">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-[#9B8A8E]">欢迎回来，探索者</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#3D2C2E] mb-3">
                {topCharacter
                  ? `与 ${topCharacter.characterName} 的第 ${stats.totalMessages} 次对话`
                  : "开启你的第一次对话"}
              </h2>
              <p className="text-lg text-[#9B8A8E] leading-relaxed">
                {stats.totalMessages > 0
                  ? `你已经与 ${stats.totalCharacters} 位角色建立了深厚的情感连接，留下了 ${stats.totalMessages} 条珍贵的回忆`
                  : "在这里，每一位虚拟恋人都在等待与你相遇"}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={MessageCircle}
                value={stats.totalMessages}
                label="条消息"
                color="from-[#F8C8D4] to-[#F8B8C4]"
              />
              <StatCard
                icon={Drama}
                value={stats.totalCharacters}
                label="位角色"
                color="from-[#C8D4F8] to-[#B8C8F8]"
              />
              <StatCard
                icon={ImageIcon}
                value={stats.totalImages}
                label="张图片"
                color="from-[#D4F8C8] to-[#C8F8B8]"
              />
              <StatCard
                icon={Heart}
                value={stats.totalSessions}
                label="个故事"
                color="from-[#F8D4C8] to-[#F8C8B8]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-[73px] z-30 bg-white/70 backdrop-blur-xl border-b border-[#EDE5E0]/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 py-4">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              icon={Sparkles}
              label="总览"
            />
            <TabButton
              active={activeTab === "chats"}
              onClick={() => setActiveTab("chats")}
              icon={MessageCircle}
              label="对话记录"
            />
            <TabButton
              active={activeTab === "gallery"}
              onClick={() => setActiveTab("gallery")}
              icon={ImageIcon}
              label="记忆画廊"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Top Character Highlight */}
            {topCharacter && (
              <section className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/50">
                <h3 className="text-lg font-bold text-[#3D2C2E] mb-4 flex items-center gap-2">
                  <Heart size={18} className="text-[#F8A8BB]" fill="currentColor" />
                  最亲密的伙伴
                </h3>
                <div
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#F8C8D4]/10 to-transparent cursor-pointer hover:from-[#F8C8D4]/20 transition-all"
                  onClick={() => setSelectedCharacter(topCharacter)}
                >
                  <CharacterAvatar
                    name={topCharacter.characterName}
                    avatar={topCharacter.characterAvatar}
                    size="lg"
                    interactive
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-[#3D2C2E]">
                      {topCharacter.characterName}
                    </h4>
                    <p className="text-sm text-[#9B8A8E]">
                      {topCharacter.messageCount} 条对话 · 最后互动{" "}
                      {new Date(topCharacter.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#F8C8D4]">
                      {topCharacter.messageCount}
                    </div>
                    <div className="text-xs text-[#9B8A8E]">条消息</div>
                  </div>
                </div>
              </section>
            )}

            {/* Recent Activity */}
            <section>
              <h3 className="text-lg font-bold text-[#3D2C2E] mb-4 flex items-center gap-2">
                <Activity size={18} className="text-[#A8C8EA]" />
                最近动态
              </h3>
              <div className="grid gap-4">
                {recentSessions.slice(0, 3).map((session) => (
                  <ActivityCard
                    key={session.id}
                    session={session}
                    onClick={() => setSelectedCharacter(session)}
                  />
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-gradient-to-r from-[#F8C8D4]/20 to-[#C8D4F8]/20 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-[#3D2C2E] mb-4 flex items-center gap-2">
                <Rocket size={18} className="text-[#F8A8BB]" />
                快速开始
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QuickActionButton
                  icon={MessageCircle}
                  label="继续聊天"
                  onClick={() => {
                    if (topCharacter) {
                      router.push(`/chat/${topCharacter.characterId}`);
                    } else {
                      router.push("/");
                    }
                  }}
                  primary
                />
                <QuickActionButton
                  icon={Drama}
                  label="认识新角色"
                  onClick={() => router.push("/")}
                />
                <QuickActionButton
                  icon={ImageIcon}
                  label="生成图片"
                  onClick={() => {
                    if (topCharacter) {
                      router.push(`/chat/${topCharacter.characterId}`);
                    } else {
                      router.push("/");
                    }
                  }}
                />
                <QuickActionButton
                  icon={Settings}
                  label="个人设置"
                  onClick={() => setShowSettings(true)}
                />
              </div>
            </section>
          </div>
        )}

        {activeTab === "chats" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#3D2C2E] mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-[#A8C8EA]" />
              对话历史
            </h3>
            {recentSessions.map((session) => (
              <ChatSessionCard
                key={session.id}
                session={session}
                onClick={() => setSelectedCharacter(session)}
                expanded={selectedCharacter?.id === session.id}
              />
            ))}
            {recentSessions.length === 0 && (
              <EmptyState
                icon={MessageCircle}
                title="还没有对话记录"
                description="去和你的虚拟恋人聊聊天吧！"
                actionLabel="开始对话"
                onAction={() => router.push("/chat")}
              />
            )}
          </div>
        )}

        {activeTab === "gallery" && (
          <div>
            <h3 className="text-lg font-bold text-[#3D2C2E] mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-[#F8A8BB]" />
              记忆画廊
            </h3>
            {imageGenerations.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imageGenerations.map((img) => (
                  <div
                    key={img.id}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#F8C8D4]/20 to-[#C8D4F8]/20 cursor-pointer hover:shadow-lg transition-all"
                  >
                    {img.imageUrls && img.imageUrls[0] && (
                      <img
                        src={img.imageUrls[0]}
                        alt={img.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white text-sm line-clamp-2">
                          {img.prompt}
                        </p>
                        <p className="text-white/70 text-xs mt-1">
                          {new Date(img.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ImageIcon}
                title="画廊还是空的"
                description="用AI生成一些美丽的图片吧！"
                actionLabel="生成图片"
                onAction={() => router.push("/generate")}
              />
            )}
          </div>
        )}
      </div>

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <CharacterDetailModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          onChat={() => {
            router.push(`/chat/${selectedCharacter.characterId}`);
            setSelectedCharacter(null);
          }}
        />
      )}

      {/* Account Settings Modal */}
      <AccountSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsUpdate={(newSettings) => {
          console.log("用户设置已更新:", newSettings);
        }}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div
      className={`bg-white/60 dark:bg-[#2A2428] backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50 dark:border-[#3A3236] bg-gradient-to-br dark:from-transparent dark:to-transparent ${color}`}
    >
      <div className="mb-1.5">
        <Icon
          size={24}
          strokeWidth={1.8}
          className="text-[#3D2C2E]/70 dark:text-[#F8A8BB]"
        />
      </div>
      <div className="text-2xl font-bold text-[#3D2C2E]">{value}</div>
      <div className="text-xs text-[#9B8A8E]">{label}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
        active
          ? "bg-[#F8C8D4] text-white shadow-md"
          : "text-[#9B8A8E] hover:bg-white/50"
      }`}
    >
      <Icon size={16} strokeWidth={2} />
      {label}
    </button>
  );
}

function ActivityCard({
  session,
  onClick,
}: {
  session: ChatSession;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50 cursor-pointer hover:shadow-md hover:border-[#F8C8D4]/30 transition-all"
    >
      <div className="flex items-center gap-3">
        <CharacterAvatar
          name={session.characterName}
          avatar={session.characterAvatar}
          size="md"
          interactive
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[#3D2C2E] truncate">
            {session.characterName}
          </h4>
          <p className="text-sm text-[#9B8A8E] truncate">
            {session.lastMessage || "还没有消息"}
          </p>
        </div>
        <div className="text-xs text-[#9B8A8E]">
          {new Date(session.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  primary = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl text-sm font-medium transition-all ${
        primary
          ? "bg-[#F8C8D4] text-white hover:bg-[#F8C8D4]/90 shadow-md"
          : "bg-white/60 backdrop-blur-sm text-[#3D2C2E] hover:bg-white/80 border border-white/50"
      }`}
    >
      <div className="mb-1.5 flex justify-center">
        <Icon size={22} strokeWidth={1.8} className={primary ? "text-white" : "text-[#3D2C2E]/60"} />
      </div>
      <div>{label}</div>
    </button>
  );
}

function ChatSessionCard({
  session,
  onClick,
  expanded,
}: {
  session: ChatSession;
  onClick: () => void;
  expanded: boolean;
}) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 overflow-hidden">
      <div
        onClick={onClick}
        className="p-4 cursor-pointer hover:bg-white/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <CharacterAvatar
            name={session.characterName}
            avatar={session.characterAvatar}
            size="lg"
            interactive
          />
          <div className="flex-1">
            <h4 className="font-bold text-[#3D2C2E]">
              {session.characterName}
            </h4>
            <p className="text-sm text-[#9B8A8E]">
              {session.messageCount} 条消息 ·{" "}
              {new Date(session.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-[#9B8A8E] transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {expanded && session.recentMessages && (
        <div className="border-t border-[#EDE5E0]/30 p-4 bg-white/30">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {session.recentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-[#F8C8D4] text-white"
                      : "bg-white/80 text-[#3D2C2E]"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.role === "user" ? "text-white/70" : "text-[#9B8A8E]"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="text-center py-16">
      <div className="mb-4 flex justify-center text-[#E0D5D0]">
        <Icon size={56} strokeWidth={1.2} />
      </div>
      <h3 className="text-xl font-bold text-[#3D2C2E] mb-2">{title}</h3>
      <p className="text-[#9B8A8E] mb-6">{description}</p>
      <button
        onClick={onAction}
        className="px-6 py-3 bg-[#F8C8D4] text-white rounded-full hover:bg-[#F8C8D4]/90 transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function CharacterDetailModal({
  character,
  onClose,
  onChat,
}: {
  character: ChatSession;
  onClose: () => void;
  onChat: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
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
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="relative h-48 bg-gradient-to-br from-[#F8C8D4]/20 via-transparent to-[#C8D4F8]/20 flex items-center justify-center">
          <CharacterAvatar
            name={character.characterName}
            avatar={character.characterAvatar}
            size="xl"
            showRing={false}
          />
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-[#3D2C2E] text-center mb-2">
            {character.characterName}
          </h2>
          <p className="text-center text-[#9B8A8E] mb-6">
            共 {character.messageCount} 条对话
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 rounded-xl bg-[#F8C8D4]/10">
              <div className="text-xl font-bold text-[#F8C8D4]">
                {character.messageCount}
              </div>
              <div className="text-xs text-[#9B8A8E]">消息数</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-[#C8D4F8]/10">
              <div className="text-xl font-bold text-[#C8D4F8]">
                {Math.ceil(character.messageCount / 10)}
              </div>
              <div className="text-xs text-[#9B8A8E]">对话轮次</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-[#D4F8C8]/10">
              <div className="text-xl font-bold text-[#86C886]">
                {new Date(character.updatedAt).toLocaleDateString()}
              </div>
              <div className="text-xs text-[#9B8A8E]">最后互动</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onChat}
              className="flex-1 py-3 bg-[#F8C8D4] text-white rounded-xl font-medium hover:bg-[#F8C8D4]/90 transition-colors"
            >
              <span className="flex items-center justify-center gap-1.5">
                <MessageCircle size={16} />
                继续聊天
              </span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-[#9B8A8E] rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
