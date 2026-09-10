"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import EmojiAvatar from "./EmojiAvatar";

interface CustomCharacter {
  id: number;
  name: string;
  title: string;
  tags: string[];
  avatar: string;
  avatarImage: string | null;
  gender: "male" | "female";
  appearance: string;
  systemPrompt: string;
  greeting: string;
  color: string;
  status: string;
  isCustom: true;
}

const MAX_CHARACTERS_PER_GENDER = 4;

export default function MyVirtualLovers() {
  const router = useRouter();
  const { user } = useAuth(true);
  const [characters, setCharacters] = useState<CustomCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDeleteCharacter(
    characterId: number,
    characterName: string,
  ) {
    setDeletingId(characterId);

    try {
      // 处理 custom- 前缀的 ID
      const numericId = String(characterId).replace("custom-", "");

      const res = await fetch(`/api/characters/${numericId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "删除失败");
        return;
      }

      toast.success(`"${characterName}" 已被删除`);

      // 从列表中移除已删除的角色
      setCharacters((prev) => prev.filter((c) => c.id !== characterId));
    } catch (error) {
      console.error("[DeleteCharacter] Error:", error);
      toast.error("网络错误，请稍后重试");
    } finally {
      setDeletingId(null);
    }
  }

  // 刷新角色列表
  async function refreshCharacters() {
    if (!user) return;

    try {
      const response = await fetch("/api/characters/custom", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCharacters(data.characters || []);
      }
    } catch (error) {
      console.error("[MyVirtualLovers] 刷新失败:", error);
    }
  }

  const maleCharacters = characters
    .filter((c) => c.gender === "male")
    .slice(0, MAX_CHARACTERS_PER_GENDER);
  const femaleCharacters = characters
    .filter((c) => c.gender === "female")
    .slice(0, MAX_CHARACTERS_PER_GENDER);

  const canCreateMale = maleCharacters.length < MAX_CHARACTERS_PER_GENDER;
  const canCreateFemale = femaleCharacters.length < MAX_CHARACTERS_PER_GENDER;

  useEffect(() => {
    async function loadCustomCharacters() {
      if (!user) return;

      try {
        const response = await fetch("/api/characters/custom", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setCharacters(data.characters || []);
          console.log(
            "[MyVirtualLovers] 加载自定义角色:",
            data.characters?.length || 0,
            "个",
          );
        }
      } catch (error) {
        console.error("[MyVirtualLovers] 加载失败:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCustomCharacters();
  }, [user]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-gradient-to-r from-pink-100 to-blue-100 rounded-2xl mb-6" />
        <div className="h-32 bg-gradient-to-r from-blue-100 to-pink-100 rounded-2xl" />
      </div>
    );
  }

  if (!user || characters.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Section Title */}
      <div className="text-center px-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#F8C8D4]/20 to-[#A8D8EA]/20 border border-[#F8C8D4]/30">
          <span className="text-lg">💕</span>
          <span className="text-sm font-medium text-[#3D2C2E]">
            我的虚拟恋人
          </span>
          <span className="text-xs text-[#9B8A8E]">
            ({characters.length}/{MAX_CHARACTERS_PER_GENDER * 2})
          </span>
        </div>
      </div>

      {/* Boyfriends Section */}
      {(maleCharacters.length > 0 || canCreateMale) && (
        <div className="mx-4 overflow-hidden rounded-2xl bg-white shadow-md border border-[#A8D8EA]/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#A8D8EA] to-[#87CEEB] px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">👨‍❤️‍👨</span>
              <div>
                <h3 className="text-base font-bold text-white drop-shadow-sm">
                  你创建的男朋友
                </h3>
                <p className="text-xs text-white/90">
                  {maleCharacters.length} / {MAX_CHARACTERS_PER_GENDER}
                </p>
              </div>
            </div>

            {canCreateMale && (
              <button
                onClick={() => router.push(`/create-character?gender=male`)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/25 hover:bg-white/40 backdrop-blur-sm transition-all text-xs font-medium text-white"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                创建
              </button>
            )}
          </div>

          {/* Characters Grid */}
          {maleCharacters.length > 0 ? (
            <div className="p-4 grid grid-cols-2 gap-3">
              {maleCharacters.map((character) => (
                <div
                  key={character.id}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-white p-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-[#E5E7EB]"
                >
                  {/* Delete Button - appears on hover */}
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full ${
                            deletingId === character.id ? "animate-pulse" : ""
                          }`}
                          disabled={deletingId === character.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            确定要删除这个角色吗？
                          </AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-2">
                              <div>
                                您即将删除角色：
                                <strong>{character.name}</strong>
                              </div>
                              <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded-md border border-orange-200">
                                ⚠️
                                此操作将同时删除与该角色的所有聊天记录，且无法恢复！
                              </div>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDeleteCharacter(
                                character.id,
                                character.name,
                              )
                            }
                            className="bg-red-500 hover:bg-red-600 text-white"
                            disabled={deletingId === character.id}
                          >
                            {deletingId === character.id
                              ? "删除中..."
                              : "确认删除"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Clickable area for chat */}
                  <button
                    onClick={() => router.push(`/chat/${character.id}`)}
                    className="w-full"
                  >
                    {/* Avatar */}
                    <div className="relative mx-auto mb-2">
                      {character.avatarImage ? (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#A8D8EA]/30 group-hover:ring-[#A8D8EA] transition-all">
                          <img
                            src={character.avatarImage}
                            alt={character.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                          {/* Online indicator */}
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full ring-2 ring-white" />
                        </div>
                      ) : (
                        <div className="relative">
                          <EmojiAvatar
                            name={character.name}
                            gender={character.gender}
                            size="lg"
                            className="rounded-full ring-2 ring-[#A8D8EA]/30 group-hover:ring-[#A8D8EA] transition-all"
                          />
                          {/* Online indicator */}
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full ring-2 ring-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="text-center">
                      <h4 className="font-semibold text-sm text-[#3D2C2E] truncate group-hover:text-[#A8D8EA] transition-colors">
                        {character.name}
                      </h4>
                      <p className="text-xs text-[#9B8A8E] truncate mt-0.5">
                        {character.title}
                      </p>

                      {/* Status badge */}
                      <div
                        className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: `${character.color}15`,
                          color: character.color,
                        }}
                      >
                        {character.status || "在线"}
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">💔</div>
              <p className="text-sm text-[#9B8A8E] mb-3">还没有创建男朋友呢</p>
              <button
                onClick={() => router.push(`/create-character?gender=male`)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#A8D8EA] text-white text-sm font-medium hover:bg-[#87CEEB] transition-colors"
              >
                <span>✨</span>
                创建第一个男朋友
              </button>
            </div>
          )}

          {/* Progress bar */}
          <div className="px-4 pb-3">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#A8D8EA] to-[#87CEEB] transition-all duration-500"
                style={{
                  width: `${(maleCharacters.length / MAX_CHARACTERS_PER_GENDER) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Girlfriends Section */}
      {(femaleCharacters.length > 0 || canCreateFemale) && (
        <div className="mx-4 overflow-hidden rounded-2xl bg-white shadow-md border border-[#FFB6C1]/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FFB6C1] to-[#FF69B4] px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">👩‍❤️‍👩</span>
              <div>
                <h3 className="text-base font-bold text-white drop-shadow-sm">
                  你创建的女朋友
                </h3>
                <p className="text-xs text-white/90">
                  {femaleCharacters.length} / {MAX_CHARACTERS_PER_GENDER}
                </p>
              </div>
            </div>

            {canCreateFemale && (
              <button
                onClick={() => router.push(`/create-character?gender=female`)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/25 hover:bg-white/40 backdrop-blur-sm transition-all text-xs font-medium text-white"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                创建
              </button>
            )}
          </div>

          {/* Characters Grid */}
          {femaleCharacters.length > 0 ? (
            <div className="p-4 grid grid-cols-2 gap-3">
              {femaleCharacters.map((character) => (
                <div
                  key={character.id}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-white p-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-[#E5E7EB]"
                >
                  {/* Delete Button - appears on hover */}
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full ${
                            deletingId === character.id ? "animate-pulse" : ""
                          }`}
                          disabled={deletingId === character.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            确定要删除这个角色吗？
                          </AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-2">
                              <div>
                                您即将删除角色：
                                <strong>{character.name}</strong>
                              </div>
                              <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded-md border border-orange-200">
                                ⚠️
                                此操作将同时删除与该角色的所有聊天记录，且无法恢复！
                              </div>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleDeleteCharacter(
                                character.id,
                                character.name,
                              )
                            }
                            className="bg-red-500 hover:bg-red-600 text-white"
                            disabled={deletingId === character.id}
                          >
                            {deletingId === character.id
                              ? "删除中..."
                              : "确认删除"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Clickable area for chat */}
                  <button
                    onClick={() => router.push(`/chat/${character.id}`)}
                    className="w-full"
                  >
                    {/* Avatar */}
                    <div className="relative mx-auto mb-2 w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#FFB6C1]/30 group-hover:ring-[#FFB6C1] transition-all">
                      {character.avatarImage ? (
                        <img
                          src={character.avatarImage}
                          alt={character.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-3xl"
                          style={{ backgroundColor: `${character.color}20` }}
                        >
                          {character.avatar}
                        </div>
                      )}

                      {/* Online indicator */}
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full ring-2 ring-white" />
                    </div>

                    {/* Info */}
                    <div className="text-center">
                      <h4 className="font-semibold text-sm text-[#3D2C2E] truncate group-hover:text-[#FFB6C1] transition-colors">
                        {character.name}
                      </h4>
                      <p className="text-xs text-[#9B8A8E] truncate mt-0.5">
                        {character.title}
                      </p>

                      {/* Status badge */}
                      <div
                        className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: `${character.color}15`,
                          color: character.color,
                        }}
                      >
                        {character.status || "在线"}
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">💗</div>
              <p className="text-sm text-[#9B8A8E] mb-3">还没有创建女朋友呢</p>
              <button
                onClick={() => router.push(`/create-character?gender=female`)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#FFB6C1] text-white text-sm font-medium hover:bg-[#FF69B4] transition-colors"
              >
                <span>✨</span>
                创建第一个女朋友
              </button>
            </div>
          )}

          {/* Progress bar */}
          <div className="px-4 pb-3">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FFB6C1] to-[#FF69B4] transition-all duration-500"
                style={{
                  width: `${(femaleCharacters.length / MAX_CHARACTERS_PER_GENDER) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Limit reached warning */}
      {!canCreateMale && !canCreateFemale && (
        <div className="mx-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-center">
          <p className="text-sm text-yellow-800">
            💡 已达到上限：最多可创建 {MAX_CHARACTERS_PER_GENDER} 个男朋友和{" "}
            {MAX_CHARACTERS_PER_GENDER} 个女朋友
          </p>
        </div>
      )}
    </div>
  );
}
