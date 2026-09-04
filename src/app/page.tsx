"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCharactersByGender, type Character } from "@/lib/characters";
import UserMenu from "@/components/UserMenu";
import MyVirtualLovers from "@/components/MyVirtualLovers";
import { useAuth } from "@/hooks/useAuth";

type Gender = "male" | "female" | null;

export default function HomePage() {
  const router = useRouter();
  const [selectedGender, setSelectedGender] = useState<Gender>(null);
  const { user, loading: authLoading } = useAuth(true); // requireAuth = true

  const filteredCharacters = selectedGender
    ? getCharactersByGender(selectedGender)
    : [];

  // 显示加载状态
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

  // 未登录时会自动跳转（由useAuth处理），但为了安全再检查一次
  if (!user) {
    return null; // 正在跳转中
  }

  // Step 1: Gender selection
  if (!selectedGender) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        {/* Header with User Menu */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#EDE5E0]/50">
          <div className="max-w-md mx-auto px-6 py-3 flex items-center justify-end">
            <UserMenu />
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8C8D4]/30 to-transparent" />
          <div className="relative px-6 pt-12 pb-10 text-center">
            <div className="mb-3 text-4xl">💌</div>
            <h1 className="mb-2 text-2xl font-semibold text-[#3D2C2E]">
              虚拟恋人
            </h1>
            <p className="mb-10 text-sm text-[#9B8A8E]">
              选择你想要的恋爱对象，开始专属故事
            </p>

            {/* Gender selection cards */}
            <div className="mx-auto flex max-w-sm flex-col gap-4">
              <button
                onClick={() => setSelectedGender("male")}
                className="character-card group flex items-center gap-5 rounded-2xl bg-white p-6 shadow-sm border border-[#EDE5E0] text-left overflow-hidden"
              >
                <div className="relative shrink-0">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-md ring-2 ring-[#A8D8EA]/30">
                    <img
                      src="/characters/gentle-senpai.png"
                      alt="男朋友"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#A8D8EA] ring-2 ring-white flex items-center justify-center">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#3D2C2E]">
                    我想找男朋友
                  </h3>
                  <p className="mt-1 text-sm text-[#9B8A8E]">
                    温柔学长 / 傲娇少爷 / 阳光暖男 / 神秘文艺
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    {["温柔", "傲娇", "阳光", "文艺"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#A8D8EA]/15 px-2 py-0.5 text-xs text-[#9B8A8E]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-[#9B8A8E]/50 group-hover:text-[#3D2C2E]"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>

              <button
                onClick={() => setSelectedGender("female")}
                className="character-card group flex items-center gap-5 rounded-2xl bg-white p-6 shadow-sm border border-[#EDE5E0] text-left overflow-hidden"
              >
                <div className="relative shrink-0">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-md ring-2 ring-[#FFB6C1]/30">
                    <img
                      src="/characters/sweet-junior.png"
                      alt="女朋友"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#FFB6C1] ring-2 ring-white flex items-center justify-center">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#3D2C2E]">
                    我想找女朋友
                  </h3>
                  <p className="mt-1 text-sm text-[#9B8A8E]">
                    甜美学妹 / 高冷学姐 / 治愈少女 / 元气偶像
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    {["甜美", "高冷", "治愈", "元气"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#FFB6C1]/15 px-2 py-0.5 text-xs text-[#9B8A8E]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-[#9B8A8E]/50 group-hover:text-[#3D2C2E]"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* 创建自定义角色按钮 */}
            <button
              onClick={() => router.push("/create-character")}
              className="mt-6 w-full group flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#F8C8D4]/20 to-[#FFB6C1]/20 border-2 border-dashed border-[#F8C8D4]/50 hover:border-[#F8C8D4] hover:from-[#F8C8D4]/30 hover:to-[#FFB6C1]/30 transition-all"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                ✨
              </span>
              <div className="text-left">
                <h3 className="font-semibold text-[#3D2C2E]">创建自定义角色</h3>
                <p className="text-xs text-[#9B8A8E]">
                  设计属于你的专属虚拟恋人
                </p>
              </div>
            </button>

            {/* My Virtual Lovers Section */}
            <MyVirtualLovers />

            <div className="mt-10 text-center">
              <p className="text-xs text-[#9B8A8E]/60">
                刷新即重置 · 无压力即时陪伴
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Character selection
  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Header with User Menu */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#EDE5E0]/50">
        <div className="max-w-md mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setSelectedGender(null)}
            className="inline-flex items-center gap-1 text-sm text-[#9B8A8E] hover:text-[#3D2C2E]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            返回
          </button>

          <UserMenu />
        </div>
      </div>

      {/* Title Section */}
      <div className="px-6 pt-8 pb-6 text-center">
        <h1 className="mb-2 text-xl font-semibold text-[#3D2C2E]">
          {selectedGender === "male" ? "选择你的男朋友" : "选择你的女朋友"}
        </h1>
        <p className="text-sm text-[#9B8A8E]">
          每位都有独特的性格和声线，选择最心动的那位吧
        </p>
      </div>

      {/* Character Cards */}
      <div className="mx-auto max-w-md px-4 pb-10">
        <div className="space-y-4">
          {filteredCharacters.map((character: Character) => (
            <button
              key={character.id}
              onClick={() => router.push(`/chat/${character.id}`)}
              className="character-card block w-full overflow-hidden rounded-2xl bg-white shadow-sm border border-[#EDE5E0] text-left"
            >
              <div className="relative">
                {/* Top section with avatar and info */}
                <div className="flex items-start gap-4 p-5">
                  {/* Avatar - Larger and more prominent */}
                  <div className="relative shrink-0">
                    <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-md ring-2 ring-white">
                      {character.avatarImage ? (
                        <img
                          src={character.avatarImage}
                          alt={character.name}
                          className="h-full w-full object-cover"
                          style={{ display: "block" }}
                          onError={(e) => {
                            console.error(
                              `[Avatar] Failed to load: ${character.avatarImage}`,
                            );
                            (e.target as HTMLImageElement).style.display =
                              "none";
                            const fallback = (e.target as HTMLImageElement)
                              .parentElement?.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                          onLoad={(e) => {
                            console.log(
                              `[Avatar] Loaded: ${character.avatarImage}`,
                            );
                            const img = e.target as HTMLImageElement;
                            const fallback = img.parentElement
                              ?.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "none";
                          }}
                        />
                      ) : null}
                    </div>
                    {/* Fallback emoji avatar */}
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl shadow-md"
                      style={{
                        backgroundColor: `${character.color}30`,
                        display: character.avatarImage ? "none" : "flex",
                      }}
                    >
                      {character.avatar}
                    </div>
                    {/* Online status indicator */}
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-400 ring-2 ring-white flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#3D2C2E]">
                        {character.name}
                      </h3>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${character.color}20`,
                          color: character.color,
                        }}
                      >
                        {character.title}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {character.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${character.color}15`,
                            color: `${character.color}cc`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2.5 text-xs text-[#9B8A8E]/80 leading-relaxed">
                      &ldquo;{character.greeting.slice(0, 40)}...&rdquo;
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="shrink-0 self-center text-[#9B8A8E]/40 group-hover:text-[#3D2C2E] transition-colors">
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
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </div>

                {/* Bottom action bar */}
                <div className="flex items-center justify-between px-5 pb-4">
                  <div className="flex items-center gap-1.5 text-xs text-[#9B8A8E]/60">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>点击开始聊天</span>
                  </div>
                  <div
                    className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: character.color }}
                  >
                    <span>开始对话</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Color accent bar */}
              <div
                className="h-1 w-full"
                style={{ backgroundColor: character.color }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
